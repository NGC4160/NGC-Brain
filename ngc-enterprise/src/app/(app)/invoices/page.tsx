import Link from "next/link"
import { ReceiptText } from "lucide-react"
import { InvoiceStatus } from "@prisma/client"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/utils"

export default async function InvoicesPage() {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return (
      <EmptyState
        title="No organization attached"
        description="Invoices require an organization-scoped session."
      />
    )
  }

  const [invoices, statusCounts] = await Promise.all([
    prisma.invoice.findMany({
      where: { organizationId },
      include: {
        customer: { select: { displayName: true } },
        workOrder: { select: { id: true, number: true } },
      },
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      take: 100,
    }),
    prisma.invoice.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { _all: true },
    }),
  ])
  const counts = Object.fromEntries(
    statusCounts.map((item) => [item.status, item._count._all])
  ) as Partial<Record<InvoiceStatus, number>>
  const totalDue = invoices.reduce((sum, invoice) => sum + Number(invoice.amountDue), 0)
  const paidRevenue = invoices
    .filter((invoice) => invoice.status === InvoiceStatus.PAID)
    .reduce((sum, invoice) => sum + Number(invoice.grandTotal), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing"
        title="Invoices"
        description="Track invoice status, open balances, paid revenue, and work-order billing."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ReceiptText} label="Invoices" value={invoices.length} />
        <StatCard label="Open balance" value={formatCurrency(totalDue)} />
        <StatCard label="Paid revenue" value={formatCurrency(paidRevenue)} />
        <StatCard label="Overdue" value={counts.OVERDUE ?? 0} />
      </section>

      {invoices.length ? (
        <div className="overflow-hidden rounded-[1.5rem] border border-blue-100/80 bg-white/86 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/72">
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-50/70 dark:bg-blue-950/30">
                <TableHead className="px-4">Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Work order</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="px-4">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="font-bold text-slate-950 hover:text-blue-600 dark:text-white dark:hover:text-blue-300"
                    >
                      {invoice.number}
                    </Link>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatCurrency(Number(invoice.grandTotal))}
                    </div>
                  </TableCell>
                  <TableCell>{invoice.customer.displayName}</TableCell>
                  <TableCell><StatusBadge status={invoice.status} /></TableCell>
                  <TableCell>{formatDate(invoice.issuedAt)}</TableCell>
                  <TableCell>{formatDate(invoice.dueAt)}</TableCell>
                  <TableCell>
                    {invoice.workOrder ? (
                      <Link href={`/work-orders/${invoice.workOrder.id}`} className="text-blue-600 hover:underline dark:text-blue-300">
                        {invoice.workOrder.number}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(Number(invoice.amountDue))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={ReceiptText}
          title="No invoices yet"
          description="Invoices generated from work orders or billing workflows will appear here."
        />
      )}
    </div>
  )
}
