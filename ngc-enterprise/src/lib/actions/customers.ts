"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  nullableString,
  requireOrganizationId,
  requiredString,
  tagsFromForm,
} from "@/lib/actions/context"
import { prisma } from "@/lib/db"

export async function createCustomer(formData: FormData) {
  const organizationId = await requireOrganizationId()
  const displayName = requiredString(formData.get("displayName"), "Customer name")
  const firstName = nullableString(formData.get("contactFirstName"))
  const address1 = nullableString(formData.get("address1"))
  const city = nullableString(formData.get("city"))
  const state = nullableString(formData.get("state"))
  const postalCode = nullableString(formData.get("postalCode"))

  const customer = await prisma.customer.create({
    data: {
      organizationId,
      displayName,
      companyName: nullableString(formData.get("companyName")),
      email: nullableString(formData.get("email")),
      phone: nullableString(formData.get("phone")),
      altPhone: nullableString(formData.get("altPhone")),
      leadSource: nullableString(formData.get("leadSource")),
      tags: tagsFromForm(formData.get("tags")),
      notes: nullableString(formData.get("notes")),
      contacts: firstName
        ? {
            create: {
              firstName,
              lastName: nullableString(formData.get("contactLastName")),
              email: nullableString(formData.get("contactEmail")),
              phone: nullableString(formData.get("contactPhone")),
              role: nullableString(formData.get("contactRole")),
              isPrimary: true,
            },
          }
        : undefined,
      addresses:
        address1 && city && state && postalCode
          ? {
              create: {
                label: nullableString(formData.get("addressLabel")) ?? "Primary",
                address1,
                address2: nullableString(formData.get("address2")),
                city,
                state,
                postalCode,
                isPrimary: true,
                isBilling: true,
              },
            }
          : undefined,
    },
    select: { id: true },
  })

  revalidatePath("/customers")
  redirect(`/customers/${customer.id}`)
}
