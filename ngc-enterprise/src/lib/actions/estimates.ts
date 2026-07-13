"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { EstimateStatus, LineItemType, WorkOrderStatus } from "@prisma/client"

import {
  dateFromForm,
  nullableString,
  numberFromForm,
  requireOrganizationId,
  requiredString,
} from "@/lib/actions/context"
import { prisma } from "@/lib/db"

async function nextEstimateNumber(organizationId: string) {
  const year = String(new Date().getFullYear()).slice(2)
  const count = await prisma.estimate.count({ where: { organizationId } })
  return `EST-${year}-${String(count + 1).padStart(4, "0")}`
}

async function nextWorkOrderNumber(organizationId: string) {
  const year = String(new Date().getFullYear()).slice(2)
  const count = await prisma.workOrder.count({ where: { organizationId } })
  return `WO-${year}-${String(count + 1).padStart(4, "0")}`
}

export async function createEstimate(formData: FormData) {
  const organizationId = await requireOrganizationId()
  const customerId = requiredString(formData.get("customerId"), "Customer")
  const title = requiredString(formData.get("title"), "Estimate title")
  const selectedOption =
    nullableString(formData.get("selectedOption")) ?? "good"
  const options = ["good", "better", "best"].map((key) => ({
    key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    description: nullableString(formData.get(`${key}Description`)),
    price: numberFromForm(formData.get(`${key}Price`)),
  }))
  const selected = options.find((option) => option.key === selectedOption)
  const grandTotal = selected?.price ?? options[0]?.price ?? 0

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId },
    select: { id: true },
  })

  if (!customer) {
    throw new Error("Customer was not found for this organization.")
  }

  const estimate = await prisma.estimate.create({
    data: {
      organizationId,
      customerId,
      number: await nextEstimateNumber(organizationId),
      title,
      status: EstimateStatus.DRAFT,
      options,
      selectedOption,
      subtotal: grandTotal,
      grandTotal,
      expiresAt: dateFromForm(formData.get("expiresAt")),
      notes: nullableString(formData.get("notes")),
      customerNotes: nullableString(formData.get("customerNotes")),
      financingUrl: nullableString(formData.get("financingUrl")),
      lineItems:
        grandTotal > 0
          ? {
              create: {
                type: LineItemType.SERVICE,
                name: `${selected?.name ?? "Selected"} estimate package`,
                description: selected?.description,
                quantity: 1,
                unitPrice: grandTotal,
              },
            }
          : undefined,
    },
    select: { id: true },
  })

  revalidatePath("/estimates")
  redirect(`/estimates/${estimate.id}`)
}

export async function approveEstimate(formData: FormData) {
  const organizationId = await requireOrganizationId()
  const estimateId = requiredString(formData.get("estimateId"), "Estimate")
  const selectedOption =
    nullableString(formData.get("selectedOption")) ?? undefined

  await prisma.estimate.updateMany({
    where: { id: estimateId, organizationId },
    data: {
      status: EstimateStatus.APPROVED,
      selectedOption,
      approvedAt: new Date(),
    },
  })

  revalidatePath("/estimates")
  revalidatePath(`/estimates/${estimateId}`)
}

export async function convertEstimateToWorkOrder(formData: FormData) {
  const organizationId = await requireOrganizationId()
  const estimateId = requiredString(formData.get("estimateId"), "Estimate")

  const estimate = await prisma.estimate.findFirst({
    where: { id: estimateId, organizationId },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
      workOrder: { select: { id: true } },
    },
  })

  if (!estimate) {
    throw new Error("Estimate was not found for this organization.")
  }

  if (estimate.workOrder) {
    redirect(`/work-orders/${estimate.workOrder.id}`)
  }

  const workOrder = await prisma.workOrder.create({
    data: {
      organizationId,
      customerId: estimate.customerId,
      estimateId: estimate.id,
      number: await nextWorkOrderNumber(organizationId),
      title: estimate.title,
      description: estimate.customerNotes,
      status: WorkOrderStatus.RECEIVED,
      grandTotal: estimate.grandTotal,
      laborTotal: estimate.subtotal,
      taxTotal: estimate.taxTotal,
      discountTotal: estimate.discountTotal,
      lineItems: {
        create: estimate.lineItems.map((item) => ({
          type: item.type,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitCost: item.unitCost,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          priceBookItemId: item.priceBookItemId,
          inventoryItemId: item.inventoryItemId,
          sortOrder: item.sortOrder,
        })),
      },
      activities: {
        create: {
          entityType: "WORK_ORDER",
          action: "ESTIMATE_CONVERTED",
          summary: `Converted from estimate ${estimate.number}.`,
        },
      },
    },
    select: { id: true },
  })

  await prisma.estimate.update({
    where: { id: estimate.id },
    data: { status: EstimateStatus.CONVERTED },
  })

  revalidatePath("/estimates")
  revalidatePath("/work-orders")
  revalidatePath("/dashboard")
  redirect(`/work-orders/${workOrder.id}`)
}
