import Link from "next/link"
import { Plus, Search, Users } from "lucide-react"
import { Prisma, WorkOrderStatus } from "@prisma/client"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
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

type CustomersPageProps = {
  searchParams?: Promise<{ q?: string }>
}

const closedStatuses: ReadonlySet<WorkOrderStatus> = new Set([
  WorkOrderStatus.COMPLETED,
  WorkOrderStatus.DELIVERED,
  WorkOrderStatus.PICKED_UP,
  WorkOrderStatus.CANCELLED,
])
const openStatuses: WorkOrderStatus[] = Object.values(WorkOrderStatus).filter(
  (status) => !closedStatuses.has(status)
)

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  const params = await searchParams
  const q = params?.q?.trim() ?? ""

  if (!organizationId) {
    return (
      <EmptyState
        title="No organization attached"
        description="Customers appear after your user is attached to an organization."
      />
    )
  }

  const where = {
    organizationId,
    ...(q
      ? {
          OR: [
            { displayName: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { companyName: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { phone: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { tags: { has: q } },
          ],
        }
      : {}),
  } satisfies Prisma.CustomerWhereInput

  const [customers, totalCustomers, lifetimeValue, activeWorkOrders, taggedCount] =
    await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: {
              equipment: true,
              workOrders: true,
              estimates: true,
              invoices: true,
            },
          },
        },
        orderBy: [{ updatedAt: "desc" }, { displayName: "asc" }],
        take: 80,
      }),
      prisma.customer.count({ where: { organizationId } }),
      prisma.customer.aggregate({
        where: { organizationId },
        _sum: { lifetimeValue: true },
      }),
      prisma.workOrder.count({
        where: { organizationId, status: { in: openStatuses } },
      }),
      prisma.customer.count({
        where: { organizationId, tags: { isEmpty: false } },
      }),
    ])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM"
        title="Customers"
        description="Search customer accounts, see lifetime value, and jump into full service history."
        actions={
          <Link
            href="/customers/new"
            className={cn(buttonVariants({ size: "lg" }), "rounded-xl shadow-sm shadow-blue-600/20")}
          >
            <Plus className="size-4" />
            New customer
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total customers" value={totalCustomers} />
        <StatCard
          label="Lifetime value"
          value={formatCurrency(Number(lifetimeValue._sum.lifetimeValue ?? 0))}
          helper="All customer accounts"
        />
        <StatCard
          label="Active WOs"
          value={activeWorkOrders}
          helper="Open shop work"
        />
        <StatCard label="Tagged accounts" value={taggedCount} helper="Segmented CRM" />
      </section>

      <div className="rounded-[1.5rem] border border-blue-100/80 bg-white/82 p-4 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
        <form className="relative max-w-xl" action="/customers">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 rounded-xl bg-white/70 pl-10 dark:bg-white/5"
            defaultValue={q}
            name="q"
            placeholder="Search name, company, email, phone, or exact tag..."
          />
        </form>
      </div>

      {customers.length ? (
        <div className="overflow-hidden rounded-[1.5rem] border border-blue-100/80 bg-white/86 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/72">
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-50/70 dark:bg-blue-950/30">
                <TableHead className="px-4">Customer</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Lifetime value</TableHead>
                <TableHead className="text-right">Work orders</TableHead>
                <TableHead>Last updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="px-4">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="font-bold text-slate-950 hover:text-blue-600 dark:text-white dark:hover:text-blue-300"
                    >
                      {customer.displayName}
                    </Link>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {customer.companyName ?? customer.email ?? customer.phone ?? "No contact info"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex max-w-xs flex-wrap gap-1.5">
                      {customer.tags.length ? (
                        customer.tags.slice(0, 4).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200"
                          >
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No tags</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(Number(customer.lifetimeValue))}
                  </TableCell>
                  <TableCell className="text-right">
                    {customer._count.workOrders}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(customer.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={q ? "No customers matched that search" : "No customers yet"}
          description={
            q
              ? "Try a broader name, email, phone, or exact tag."
              : "Create the first CRM account to start tying carts, work orders, estimates, invoices, and communications together."
          }
          action={
            <Link
              href="/customers/new"
              className={cn(buttonVariants({ size: "lg" }), "rounded-xl")}
            >
              <Plus className="size-4" />
              Add customer
            </Link>
          }
        />
      )}
    </div>
  )
}
