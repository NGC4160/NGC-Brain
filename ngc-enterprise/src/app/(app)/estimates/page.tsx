import { StaticEstimatesPage } from "@/components/demo/static-app-pages"
import { isStaticExport } from "@/lib/static"
import Link from "next/link"
import { FileText, Plus } from "lucide-react"
import { EstimateStatus } from "@prisma/client"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { buttonVariants } from "@/components/ui/button"
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
import { cn, formatCurrency, formatDate } from "@/lib/utils"

export default async function EstimatesPage() {
  if (isStaticExport()) {
    return <StaticEstimatesPage />
  }

  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return (
      <EmptyState
        title="No organization attached"
        description="Estimates require an organization-scoped session."
      />
    )
  }

  const [estimates, statusCounts] = await Promise.all([
    prisma.estimate.findMany({
      where: { organizationId },
      include: { customer: { select: { displayName: true } } },
      orderBy: [{ updatedAt: "desc" }],
      take: 100,
    }),
    prisma.estimate.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { _all: true },
    }),
  ])
  const counts = Object.fromEntries(
    statusCounts.map((item) => [item.status, item._count._all])
  ) as Partial<Record<EstimateStatus, number>>
  const openEstimateStatuses: ReadonlySet<EstimateStatus> = new Set([
    EstimateStatus.DRAFT,
    EstimateStatus.SENT,
    EstimateStatus.VIEWED,
  ])
  const openEstimateValue = estimates
    .filter((estimate) => openEstimateStatuses.has(estimate.status))
    .reduce((sum, estimate) => sum + Number(estimate.grandTotal), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quotes"
        title="Estimates"
        description="Track good, better, best packages from draft through approval and conversion."
        actions={
          <Link
            href="/estimates/new"
            className={cn(buttonVariants({ size: "lg" }), "rounded-xl shadow-sm shadow-blue-600/20")}
          >
            <Plus className="size-4" />
            New estimate
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FileText} label="Total estimates" value={estimates.length} />
        <StatCard label="Open value" value={formatCurrency(openEstimateValue)} />
        <StatCard label="Approved" value={counts.APPROVED ?? 0} />
        <StatCard label="Converted" value={counts.CONVERTED ?? 0} />
      </section>

      {estimates.length ? (
        <div className="overflow-hidden rounded-[1.5rem] border border-blue-100/80 bg-white/86 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/72">
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-50/70 dark:bg-blue-950/30">
                <TableHead className="px-4">Estimate</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Selected</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estimates.map((estimate) => (
                <TableRow key={estimate.id}>
                  <TableCell className="px-4">
                    <Link
                      href={`/estimates/${estimate.id}`}
                      className="font-bold text-slate-950 hover:text-blue-600 dark:text-white dark:hover:text-blue-300"
                    >
                      {estimate.number}
                    </Link>
                    <div className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                      {estimate.title}
                    </div>
                  </TableCell>
                  <TableCell>{estimate.customer.displayName}</TableCell>
                  <TableCell><StatusBadge status={estimate.status} /></TableCell>
                  <TableCell className="capitalize">{estimate.selectedOption ?? "—"}</TableCell>
                  <TableCell>{formatDate(estimate.expiresAt)}</TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(Number(estimate.grandTotal))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No estimates yet"
          description="Create a good/better/best estimate for lithium, repair, or accessory work."
          action={
            <Link
              href="/estimates/new"
              className={cn(buttonVariants({ size: "lg" }), "rounded-xl")}
            >
              <Plus className="size-4" />
              New estimate
            </Link>
          }
        />
      )}
    </div>
  )
}
