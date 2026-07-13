import { auth } from "@/lib/auth"

export async function requireOrganizationId() {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    throw new Error("You must be signed in to continue.")
  }

  return organizationId
}

export function nullableString(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : ""
  return text.length > 0 ? text : null
}

export function requiredString(value: FormDataEntryValue | null, label: string) {
  const text = nullableString(value)

  if (!text) {
    throw new Error(`${label} is required.`)
  }

  return text
}

export function numberFromForm(value: FormDataEntryValue | null, fallback = 0) {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function dateFromForm(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function tagsFromForm(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return []
  }

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}
