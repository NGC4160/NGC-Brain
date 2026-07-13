"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { LineItemType, WorkOrderStatus } from "@prisma/client"

import {
  dateFromForm,
  nullableString,
  numberFromForm,
  requireOrganizationId,
  requiredString,
  tagsFromForm,
} from "@/lib/actions/context"
import { prisma } from "@/lib/db"

const validWorkOrderStatuses = new Set<string>(Object.values(WorkOrderStatus))
const terminalStatuses = new Set<WorkOrderStatus>([
  WorkOrderStatus.COMPLETED,
  WorkOrderStatus.DELIVERED,
  WorkOrderStatus.PICKED_UP,
])

async function nextWorkOrderNumber(organizationId: string) {
  const year = String(new Date().getFullYear()).slice(2)
  const count = await prisma.workOrder.count({ where: { organizationId } })
  return `WO-${year}-${String(count + 1).padStart(4, "0")}`
}

export async function createWorkOrder(formData: FormData) {
  const organizationId = await requireOrganizationId()
  const customerId = requiredString(formData.get("customerId"), "Customer")
  const title = requiredString(formData.get("title"), "Work order title")
  const equipmentId = nullableString(formData.get("equipmentId"))
  const bayId = nullableString(formData.get("bayId"))
  const locationId = nullableString(formData.get("locationId"))
  const unitPrice = numberFromForm(formData.get("lineItemUnitPrice"))
  const quantity = numberFromForm(formData.get("lineItemQuantity"), 1)
  const lineItemName = nullableString(formData.get("lineItemName"))
  const lineSubtotal = Math.max(0, quantity * unitPrice)

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId },
    select: { id: true },
  })

  if (!customer) {
    throw new Error("Customer was not found for this organization.")
  }

  if (equipmentId) {
    const equipment = await prisma.equipment.findFirst({
      where: { id: equipmentId, customerId },
      select: { id: true },
    })

    if (!equipment) {
      throw new Error("Equipment does not belong to the selected customer.")
    }
  }

  if (bayId) {
    const bay = await prisma.bay.findFirst({
      where: { id: bayId, organizationId },
      select: { id: true },
    })

    if (!bay) {
      throw new Error("Bay was not found for this organization.")
    }
  }

  if (locationId) {
    const location = await prisma.location.findFirst({
      where: { id: locationId, organizationId },
      select: { id: true },
    })

    if (!location) {
      throw new Error("Location was not found for this organization.")
    }
  }

  const workOrder = await prisma.workOrder.create({
    data: {
      organizationId,
      customerId,
      equipmentId,
      bayId,
      locationId,
      number: await nextWorkOrderNumber(organizationId),
      title,
      description: nullableString(formData.get("description")),
      priority: Math.min(5, Math.max(1, numberFromForm(formData.get("priority"), 3))),
      promisedDate: dateFromForm(formData.get("promisedDate")),
      internalNotes: nullableString(formData.get("internalNotes")),
      customerNotes: nullableString(formData.get("customerNotes")),
      intakeSource: nullableString(formData.get("intakeSource")),
      tags: tagsFromForm(formData.get("tags")),
      laborTotal: lineSubtotal,
      grandTotal: lineSubtotal,
      lineItems:
        lineItemName && lineSubtotal > 0
          ? {
              create: {
                type: LineItemType.SERVICE,
                name: lineItemName,
                description: nullableString(formData.get("lineItemDescription")),
                quantity,
                unitPrice,
                sortOrder: 0,
              },
            }
          : undefined,
      activities: {
        create: {
          action: "WORK_ORDER_CREATED",
          summary: "Work order created from NGC Enterprise.",
          entityType: "WORK_ORDER",
        },
      },
    },
    select: { id: true },
  })

  revalidatePath("/work-orders")
  revalidatePath("/dashboard")
  redirect(`/work-orders/${workOrder.id}`)
}

export async function updateWorkOrderStatus(
  workOrderId: string,
  status: WorkOrderStatus
) {
  const organizationId = await requireOrganizationId()

  if (!workOrderId || !validWorkOrderStatuses.has(status)) {
    throw new Error("Invalid work order status update.")
  }

  const workOrder = await prisma.workOrder.findFirst({
    where: { id: workOrderId, organizationId },
    select: { id: true },
  })

  if (!workOrder) {
    throw new Error("Work order was not found for this organization.")
  }

  await prisma.workOrder.update({
    where: { id: workOrder.id },
    data: {
      status,
      startedAt: status === WorkOrderStatus.IN_PROGRESS ? new Date() : undefined,
      completedAt: terminalStatuses.has(status) ? new Date() : undefined,
    },
  })

  await prisma.activity.create({
    data: {
      workOrderId: workOrder.id,
      entityType: "WORK_ORDER",
      entityId: workOrder.id,
      action: "STATUS_UPDATED",
      summary: `Status updated to ${status.replaceAll("_", " ").toLowerCase()}.`,
    },
  })

  revalidatePath("/work-orders")
  revalidatePath(`/work-orders/${workOrder.id}`)
  revalidatePath("/dashboard")
}

export async function updateWorkOrderStatusFromForm(formData: FormData) {
  const workOrderId = requiredString(formData.get("workOrderId"), "Work order")
  const status = requiredString(formData.get("status"), "Status") as WorkOrderStatus

  await updateWorkOrderStatus(workOrderId, status)
}
