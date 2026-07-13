"use server"

import { revalidatePath } from "next/cache"
import { InvoiceStatus, PaymentMethod } from "@prisma/client"

import {
  nullableString,
  numberFromForm,
  requireOrganizationId,
  requiredString,
} from "@/lib/actions/context"
import { prisma } from "@/lib/db"

const validPaymentMethods = new Set<string>(Object.values(PaymentMethod))

export async function recordInvoicePayment(formData: FormData) {
  const organizationId = await requireOrganizationId()
  const invoiceId = requiredString(formData.get("invoiceId"), "Invoice")
  const requestedMethod = requiredString(formData.get("method"), "Payment method")
  const method = validPaymentMethods.has(requestedMethod)
    ? (requestedMethod as PaymentMethod)
    : PaymentMethod.OTHER

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
    select: {
      id: true,
      customerId: true,
      amountPaid: true,
      amountDue: true,
      grandTotal: true,
    },
  })

  if (!invoice) {
    throw new Error("Invoice was not found for this organization.")
  }

  const currentPaid = Number(invoice.amountPaid)
  const currentDue = Number(invoice.amountDue)
  const grandTotal = Number(invoice.grandTotal)
  const enteredAmount = numberFromForm(formData.get("amount"), currentDue)
  const amount = Math.max(0, Math.min(enteredAmount, currentDue || grandTotal))

  if (amount <= 0) {
    throw new Error("Payment amount must be greater than zero.")
  }

  const amountPaid = Math.min(grandTotal, currentPaid + amount)
  const amountDue = Math.max(0, grandTotal - amountPaid)

  await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      amount,
      method,
      reference: nullableString(formData.get("reference")),
      notes: nullableString(formData.get("notes")),
      paidAt: new Date(),
    },
  })

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      amountPaid,
      amountDue,
      status:
        amountDue <= 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID,
    },
  })

  revalidatePath("/invoices")
  revalidatePath(`/invoices/${invoice.id}`)
  revalidatePath("/dashboard")
}
