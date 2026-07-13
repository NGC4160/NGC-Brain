"use server"

import { revalidatePath } from "next/cache"
import { WorkOrderStatus } from "@prisma/client"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const validWorkOrderStatuses = new Set<string>(Object.values(WorkOrderStatus))

async function requireOrganizationId() {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    throw new Error("You must be signed in to update shop floor work.")
  }

  return organizationId
}

export async function updateWorkOrderStatus(
  workOrderId: string,
  status: WorkOrderStatus
) {
  const organizationId = await requireOrganizationId()

  if (!workOrderId || !validWorkOrderStatuses.has(status)) {
    throw new Error("Invalid work order status update.")
  }

  await prisma.workOrder.updateMany({
    where: {
      id: workOrderId,
      organizationId,
    },
    data: {
      status,
      startedAt: status === WorkOrderStatus.IN_PROGRESS ? new Date() : undefined,
      completedAt:
        status === WorkOrderStatus.COMPLETED ||
        status === WorkOrderStatus.DELIVERED ||
        status === WorkOrderStatus.PICKED_UP
          ? new Date()
          : undefined,
    },
  })

  revalidatePath("/shop-floor")
  revalidatePath("/schedule")
}

export async function assignWorkOrderBay(formData: FormData) {
  const organizationId = await requireOrganizationId()
  const workOrderId = String(formData.get("workOrderId") ?? "")
  const bayId = String(formData.get("bayId") ?? "")

  if (!workOrderId) {
    throw new Error("Work order is required.")
  }

  const normalizedBayId = bayId === "unassigned" || bayId === "" ? null : bayId

  if (normalizedBayId) {
    const bay = await prisma.bay.findFirst({
      where: { id: normalizedBayId, organizationId },
      select: { id: true },
    })

    if (!bay) {
      throw new Error("Bay was not found for this organization.")
    }
  }

  await prisma.workOrder.updateMany({
    where: {
      id: workOrderId,
      organizationId,
    },
    data: {
      bayId: normalizedBayId,
    },
  })

  revalidatePath("/shop-floor")
  revalidatePath("/schedule")
}
