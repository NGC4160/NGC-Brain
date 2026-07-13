"use server"

import { revalidatePath } from "next/cache"
import { InventoryTxnType } from "@prisma/client"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

async function requireOrganizationId() {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    throw new Error("You must be signed in to update inventory.")
  }

  return organizationId
}

function readNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function updateInventoryReorderPoint(formData: FormData) {
  const organizationId = await requireOrganizationId()
  const itemId = String(formData.get("itemId") ?? "")
  const reorderPoint = Math.max(0, Math.round(readNumber(formData.get("reorderPoint"))))
  const reorderQty = Math.max(0, Math.round(readNumber(formData.get("reorderQty"), 10)))

  if (!itemId) {
    throw new Error("Inventory item is required.")
  }

  await prisma.inventoryItem.updateMany({
    where: {
      id: itemId,
      organizationId,
    },
    data: {
      reorderPoint,
      reorderQty,
    },
  })

  revalidatePath("/inventory")
}

export async function adjustInventoryStock(formData: FormData) {
  const organizationId = await requireOrganizationId()
  const itemId = String(formData.get("itemId") ?? "")
  const locationId = String(formData.get("locationId") ?? "")
  const quantity = Math.round(readNumber(formData.get("quantity")))
  const notes = String(formData.get("notes") ?? "")

  if (!itemId || !locationId || quantity === 0) {
    throw new Error("Item, location, and non-zero quantity are required.")
  }

  const item = await prisma.inventoryItem.findFirst({
    where: {
      id: itemId,
      organizationId,
      stockLevels: {
        some: {
          locationId,
        },
      },
    },
    select: { id: true },
  })

  if (!item) {
    throw new Error("Inventory item was not found for this organization.")
  }

  await prisma.$transaction([
    prisma.stockLevel.update({
      where: {
        inventoryItemId_locationId: {
          inventoryItemId: itemId,
          locationId,
        },
      },
      data: {
        quantityOnHand: {
          increment: quantity,
        },
      },
    }),
    prisma.inventoryTxn.create({
      data: {
        inventoryItemId: itemId,
        type: InventoryTxnType.ADJUST,
        quantity,
        notes: notes || undefined,
      },
    }),
  ])

  revalidatePath("/inventory")
}
