import Link from "next/link"
import { Plus, Search, Wrench } from "lucide-react"
import { Prisma, WorkOrderStatus } from "@prisma/client"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

type WorkOrdersPageProps = {
  searchParams?: Promise<{ status?: string; q?: string }>
}

const statusOptions = Object.values(WorkOrderStatus)

function priorityLabel(priority: number) {
  if (priority <= 1) return "Urgent"
  if (priority === 2) return "High"
  if (priority === 3) return "Normal"
  if (priority === 4) return "Low"
  return "Backlog"
}

function priorityClass(priority: number) {
  if (priority <= 1) return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
  if (priority === 2) return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
  if (priority === 3) return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200"
  return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
}

function filterHref(status: string | null, q: string) {
  const params = new URLSearchParams()
  if (status) params.set("status", status)
  if (q) params.set("q", q)
  const query = params.toString()
  return query ? `/work-orders?${query}` : "/work-orders"
}

export default async function WorkOrdersPage({
  searchParams,
}: WorkOrdersPageProps) {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  const params = await searchParams
  const q = params?.q?.trim() ?? ""
  const requestedStatus = params?.status ?? ""
  const selectedStatus = statusOptions.includes(requestedStatus as WorkOrderStatus)
    ? (requestedStatus as WorkOrderStatus)
    : null

  if (!organizationId) {
    return (
      <EmptyState
        title="No organization attached"
        description="Work orders require an organization-scoped session."
      />
    )
  }

  const where = {
    organizationId,
    ...(selectedStatus ? { status: selectedStatus } : {}),
    ...(q
      ? {
          OR: [
            { number: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { title: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { customer: { displayName: { contains: q, mode: Prisma.QueryMode.insensitive } } },
            { equipment: { name: { contains: q, mode: Prisma.QueryMode.insensitive } } },
          ],
        }
      : {}),
  } satisfies Prisma.WorkOrderWhereInput

  const [workOrders, statusCounts] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      include: {
        customer: { select: { displayName: true } },
        equipment: { select: { name: true } },
        bay: { select: { name: true } },
        assignments: {
          include: { user: { select: { name: true } } },
          take: 3,
        },
      },
      orderBy: [{ priority: "asc" }, { promisedDate: "asc" }, { updatedAt: "desc" }],
      take: 100,
    }),
    prisma.workOrder.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { _all: true },
    }),
  ])
  const counts = Object.fromEntries(
    statusCounts.map((item) => [item.status, item._count._all])
  ) as Partial<Record<WorkOrderStatus, number>>

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Shop work"
        title="Work orders"
        description="Filter shop work by status, priority, customer, promised date, and bay."
        actions={
          <Link
            href="/work-orders/new"
            className={cn(buttonVariants({ size: "lg" }), "rounded-xl shadow-sm shadow-blue-600/20")}
          >
            <Plus className="size-4" />
            New work order
          </Link>
        }
      />

      <div className="space-y-4 rounded-[1.5rem] border border-blue-100/80 bg-white/82 p-4 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
        <form className="relative max-w-xl" action="/work-orders">
          {selectedStatus ? <input type="hidden" name="status" value={selectedStatus} /> : null}
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 rounded-xl bg-white/70 pl-10 dark:bg-white/5"
            defaultValue={q}
            name="q"
            placeholder="Search WO number, title, customer, or equipment..."
          />
        </form>
        <div className="flex flex-wrap gap-2">
          <Link
            href={filterHref(null, q)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
              !selectedStatus
                ? "border-blue-200 bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                : "border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
            )}
          >
            All
          </Link>
          {statusOptions.map((status) => (
            <Link key={status} href={filterHref(status, q)}>
              <StatusBadge
                status={status}
                className={cn(
                  "h-8 cursor-pointer transition-transform hover:-translate-y-0.5",
                  selectedStatus === status && "ring-2 ring-blue-400"
                )}
              />
              <span className="sr-only">{counts[status] ?? 0}</span>
            </Link>
          ))}
        </div>
      </div>

      {workOrders.length ? (
        <div className="overflow-hidden rounded-[1.5rem] border border-blue-100/80 bg-white/86 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/72">
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-50/70 dark:bg-blue-950/30">
                <TableHead className="px-4">Work order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Promised</TableHead>
                <TableHead>Bay</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workOrders.map((workOrder) => (
                <TableRow key={workOrder.id}>
                  <TableCell className="px-4">
                    <Link
                      href={`/work-orders/${workOrder.id}`}
                      className="font-bold text-slate-950 hover:text-blue-600 dark:text-white dark:hover:text-blue-300"
                    >
                      {workOrder.number}
                    </Link>
                    <div className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                      {workOrder.title}
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={workOrder.status} /></TableCell>
                  <TableCell>
                    <Badge variant="outline" className={priorityClass(workOrder.priority)}>
                      {priorityLabel(workOrder.priority)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/customers/${workOrder.customerId}`} className="font-semibold text-blue-600 hover:underline dark:text-blue-300">
                      {workOrder.customer.displayName}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {workOrder.equipment?.name ?? "No equipment"}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(workOrder.promisedDate)}</TableCell>
                  <TableCell>{workOrder.bay?.name ?? "Unassigned"}</TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(Number(workOrder.grandTotal))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={Wrench}
          title="No work orders found"
          description="Create a work order or loosen the filters to see active shop work."
          action={
            <Link
              href="/work-orders/new"
              className={cn(buttonVariants({ size: "lg" }), "rounded-xl")}
            >
              <Plus className="size-4" />
              New work order
            </Link>
          }
        />
      )}
    </div>
  )
}
