"use server"

import { revalidatePath } from "next/cache"
import { LineItemType } from "@prisma/client"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const validLineItemTypes = new Set<string>(Object.values(LineItemType))

async function requireOrganizationId() {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    throw new Error("You must be signed in to update the price book.")
  }

  return organizationId
}

function readMoney(value: FormDataEntryValue | null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export async function createPriceBookItem(formData: FormData) {
  const organizationId = await requireOrganizationId()
  const name = String(formData.get("name") ?? "").trim()
  const sku = String(formData.get("sku") ?? "").trim()
  const category = String(formData.get("category") ?? "").trim()
  const subcategory = String(formData.get("subcategory") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const type = String(formData.get("type") ?? LineItemType.SERVICE) as LineItemType

  if (!name) {
    throw new Error("Name is required.")
  }

  if (!validLineItemTypes.has(type)) {
    throw new Error("Invalid price book item type.")
  }

  await prisma.priceBookItem.create({
    data: {
      organizationId,
      name,
      sku: sku || undefined,
      category: category || "General",
      subcategory: subcategory || undefined,
      description: description || undefined,
      type,
      unitCost: readMoney(formData.get("unitCost")),
      unitPrice: readMoney(formData.get("unitPrice")),
      taxable: formData.get("taxable") !== "false",
      isFavorite: formData.get("isFavorite") === "on",
    },
  })

  revalidatePath("/price-book")
}
