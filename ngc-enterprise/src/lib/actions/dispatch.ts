"use server"

import { revalidatePath } from "next/cache"
import { DispatchStatus, Role } from "@prisma/client"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const validDispatchStatuses = new Set<string>(Object.values(DispatchStatus))
const driverRoles = new Set<Role>([Role.PICKUP_DRIVER, Role.DELIVERY_DRIVER])

async function requireOrganizationId() {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    throw new Error("You must be signed in to update dispatch.")
  }

  return organizationId
}

export async function assignDispatchDriver(
  dispatchId: string,
  driverId: string | null
) {
  const organizationId = await requireOrganizationId()

  if (!dispatchId) {
    throw new Error("Dispatch stop is required.")
  }

  if (driverId) {
    const driver = await prisma.user.findFirst({
      where: {
        id: driverId,
        organizationId,
        isActive: true,
        role: { in: Array.from(driverRoles) },
      },
      select: { id: true },
    })

    if (!driver) {
      throw new Error("Driver was not found for this organization.")
    }
  }

  await prisma.dispatch.updateMany({
    where: {
      id: dispatchId,
      organizationId,
    },
    data: {
      driverId,
      status: driverId ? DispatchStatus.ASSIGNED : DispatchStatus.SCHEDULED,
    },
  })

  revalidatePath("/dispatch")
  revalidatePath("/driver")
  revalidatePath("/schedule")
}

export async function updateDispatchStatus(
  dispatchId: string,
  status: DispatchStatus
) {
  const organizationId = await requireOrganizationId()

  if (!dispatchId || !validDispatchStatuses.has(status)) {
    throw new Error("Invalid dispatch status update.")
  }

  await prisma.dispatch.updateMany({
    where: {
      id: dispatchId,
      organizationId,
    },
    data: {
      status,
      completedAt: status === DispatchStatus.COMPLETED ? new Date() : undefined,
    },
  })

  revalidatePath("/dispatch")
  revalidatePath("/driver")
  revalidatePath("/schedule")
}

export async function updateDispatchStatusFromForm(formData: FormData) {
  const dispatchId = String(formData.get("dispatchId") ?? "")
  const status = String(formData.get("status") ?? "") as DispatchStatus

  await updateDispatchStatus(dispatchId, status)
}
