import { StaticInvoiceDetailPage } from "@/components/demo/static-app-pages"
import { demoInvoices } from "@/lib/demo-data"
import { isStaticExport } from "@/lib/static"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CreditCard, ReceiptText, UserRound, Wrench } from "lucide-react"
import { PaymentMethod } from "@prisma/client"

import { recordInvoicePayment } from "@/lib/actions/invoices"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils"


export function generateStaticParams() {
  if (!isStaticExport()) return []

  return demoInvoices.map((invoice) => ({ id: invoice.id }))
}

type InvoiceDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const { id } = await params

  if (isStaticExport()) {
    return <StaticInvoiceDetailPage id={id} />
  }

  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return (
      <EmptyState
        title="No organization attached"
        description="Invoice details require an organization-scoped session."
      />
    )
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId },
    include: {
      customer: { select: { id: true, displayName: true, email: true, phone: true } },
      workOrder: { select: { id: true, number: true, title: true } },
      lineItems: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { paidAt: "desc" } },
    },
  })

  if (!invoice) {
    notFound()
  }

  const amountDue = Number(invoice.amountDue)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Invoice"
        title={invoice.number}
        description={`${invoice.customer.displayName} · ${formatCurrency(Number(invoice.grandTotal))}`}
        actions={
          <>
            <Link
              href="/invoices"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-xl bg-white/70 dark:bg-white/5")}
            >
              <ArrowLeft className="size-4" />
              Invoices
            </Link>
            <Link
              href={`/customers/${invoice.customer.id}`}
              className={cn(buttonVariants({ size: "lg" }), "rounded-xl shadow-sm shadow-blue-600/20")}
            >
              <UserRound className="size-4" />
              Customer
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Status" value={<StatusBadge status={invoice.status} />} />
        <StatCard label="Grand total" value={formatCurrency(Number(invoice.grandTotal))} />
        <StatCard label="Amount paid" value={formatCurrency(Number(invoice.amountPaid))} />
        <StatCard label="Amount due" value={formatCurrency(amountDue)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.72fr]">
        <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText className="size-5 text-blue-600" />
              Line items
            </CardTitle>
            <CardDescription>Issued {formatDate(invoice.issuedAt)} · Due {formatDate(invoice.dueAt)}</CardDescription>
          </CardHeader>
          <CardContent>
            {invoice.lineItems.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.lineItems.map((item) => {
                    const quantity = Number(item.quantity)
                    const unitPrice = Number(item.unitPrice)
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-bold">{item.name}</p>
                          {item.description ? (
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          ) : null}
                        </TableCell>
                        <TableCell>{item.type}</TableCell>
                        <TableCell className="text-right">{quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(unitPrice)}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(quantity * unitPrice)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <EmptyState title="No line items" description="Invoice charges will appear here." />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5 text-blue-600" />
                Record payment
              </CardTitle>
              <CardDescription>Post a manual payment against this invoice.</CardDescription>
            </CardHeader>
            <CardContent>
              {amountDue > 0 ? (
                <form action={recordInvoicePayment} className="space-y-4">
                  <input type="hidden" name="invoiceId" value={invoice.id} />
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      defaultValue={amountDue.toFixed(2)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method">Method</Label>
                    <select
                      id="method"
                      name="method"
                      defaultValue={PaymentMethod.CARD}
                      className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    >
                      {Object.values(PaymentMethod).map((method) => (
                        <option key={method} value={method}>
                          {method.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">Reference</Label>
                    <Input id="reference" name="reference" className="h-11 rounded-xl" placeholder="Check #, auth code, note..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" />
                  </div>
                  <Button type="submit" size="lg" className="h-11 w-full rounded-xl shadow-sm shadow-blue-600/20">
                    Record payment
                  </Button>
                </form>
              ) : (
                <EmptyState
                  icon={CreditCard}
                  title="Paid in full"
                  description="This invoice has no remaining balance."
                />
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle>Related work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoice.workOrder ? (
                <Link
                  href={`/work-orders/${invoice.workOrder.id}`}
                  className="block rounded-2xl border border-blue-100 bg-blue-50/50 p-4 hover:bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20 dark:hover:bg-blue-950/30"
                >
                  <p className="flex items-center gap-2 font-bold">
                    <Wrench className="size-4 text-blue-600" />
                    {invoice.workOrder.number}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {invoice.workOrder.title}
                  </p>
                </Link>
              ) : (
                <EmptyState title="No work order" description="This invoice is not connected to a work order." />
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
          <CardDescription>Successful payments posted against this invoice.</CardDescription>
        </CardHeader>
        <CardContent>
          {invoice.payments.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDateTime(payment.paidAt)}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>{payment.reference ?? "—"}</TableCell>
                    <TableCell>{payment.status}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(Number(payment.amount))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title="No payments yet" description="Payments recorded against this invoice will appear here." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
