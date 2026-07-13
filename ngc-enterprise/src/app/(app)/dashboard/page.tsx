import Link from "next/link"
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Gauge,
  Plus,
  Route,
  Wrench,
} from "lucide-react"
import {
  DispatchStatus,
  InvoiceStatus,
  WorkOrderStatus,
} from "@prisma/client"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils"

import { RevenueChart } from "./revenue-chart"

const terminalStatuses: ReadonlySet<WorkOrderStatus> = new Set([
  WorkOrderStatus.COMPLETED,
  WorkOrderStatus.DELIVERED,
  WorkOrderStatus.PICKED_UP,
  WorkOrderStatus.CANCELLED,
])

const activeStatuses: WorkOrderStatus[] = Object.values(WorkOrderStatus).filter(
  (status) => !terminalStatuses.has(status)
)

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function welcomeForRole(role?: string | null) {
  switch (role) {
    case "OWNER":
    case "MANAGER":
      return "Revenue, bay flow, approvals, and risk are ready for review."
    case "SERVICE_ADVISOR":
      return "Customer promises, approvals, and new intake are centered here."
    case "SHOP_TECHNICIAN":
      return "Open work, bay load, parts waits, and QC handoffs are up front."
    case "DISPATCHER":
    case "PICKUP_DRIVER":
    case "DELIVERY_DRIVER":
      return "Pickup and delivery windows are highlighted for today."
    case "ACCOUNTANT":
      return "Paid revenue, open invoices, and customer billing are in view."
    default:
      return "Your shop command center is ready."
  }
}

function buildRevenueChart(
  invoices: { grandTotal: unknown; issuedAt: Date | null; createdAt: Date }[]
) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  })
  const today = startOfDay(new Date())
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = addDays(today, index - 13)
    return {
      key: date.toISOString().slice(0, 10),
      label: formatter.format(date),
      revenue: 0,
    }
  })
  const byKey = new Map(days.map((day) => [day.key, day]))

  invoices.forEach((invoice) => {
    const date = startOfDay(invoice.issuedAt ?? invoice.createdAt)
    const key = date.toISOString().slice(0, 10)
    const point = byKey.get(key)

    if (point) {
      point.revenue += Number(invoice.grandTotal)
    }
  })

  return days
}

export default async function DashboardPage() {
  const session = await auth()
  const user = session?.user
  const organizationId = user?.organizationId

  if (!organizationId) {
    return (
      <EmptyState
        title="No organization attached"
        description="Your user account is signed in, but it is not attached to an NGC Enterprise organization yet."
      />
    )
  }

  const now = new Date()
  const todayStart = startOfDay(now)
  const tomorrowStart = addDays(todayStart, 1)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const chartStart = addDays(todayStart, -13)

  const [
    paidInvoices,
    chartInvoices,
    paidInvoiceCount,
    completedJobs,
    openWorkOrderCount,
    bays,
    occupiedBayGroups,
    workOrdersByStatus,
    dispatchesToday,
    atRiskWorkOrders,
    recentActivities,
  ] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        organizationId,
        status: InvoiceStatus.PAID,
        OR: [
          { issuedAt: { gte: monthStart } },
          { issuedAt: null, createdAt: { gte: monthStart } },
        ],
      },
      select: { grandTotal: true },
    }),
    prisma.invoice.findMany({
      where: {
        organizationId,
        status: InvoiceStatus.PAID,
        OR: [
          { issuedAt: { gte: chartStart } },
          { issuedAt: null, createdAt: { gte: chartStart } },
        ],
      },
      select: { grandTotal: true, issuedAt: true, createdAt: true },
      orderBy: [{ issuedAt: "asc" }, { createdAt: "asc" }],
    }),
    prisma.invoice.count({
      where: {
        organizationId,
        status: InvoiceStatus.PAID,
        OR: [
          { issuedAt: { gte: monthStart } },
          { issuedAt: null, createdAt: { gte: monthStart } },
        ],
      },
    }),
    prisma.workOrder.count({
      where: {
        organizationId,
        status: {
          in: [
            WorkOrderStatus.COMPLETED,
            WorkOrderStatus.DELIVERED,
            WorkOrderStatus.PICKED_UP,
          ],
        },
        completedAt: { gte: monthStart },
      },
    }),
    prisma.workOrder.count({
      where: { organizationId, status: { in: activeStatuses } },
    }),
    prisma.bay.findMany({
      where: { organizationId },
      select: { id: true, name: true, status: true, capacity: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.workOrder.groupBy({
      by: ["bayId"],
      where: {
        organizationId,
        bayId: { not: null },
        status: { in: activeStatuses },
      },
      _count: { _all: true },
    }),
    prisma.workOrder.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { _all: true },
    }),
    prisma.dispatch.findMany({
      where: {
        organizationId,
        status: { not: DispatchStatus.CANCELLED },
        OR: [
          { scheduledAt: { gte: todayStart, lt: tomorrowStart } },
          { windowStart: { gte: todayStart, lt: tomorrowStart } },
        ],
      },
      include: {
        driver: { select: { name: true } },
        vehicle: { select: { name: true } },
        address: true,
        workOrder: {
          select: {
            id: true,
            number: true,
            title: true,
            customer: { select: { displayName: true } },
          },
        },
      },
      orderBy: [{ windowStart: "asc" }, { scheduledAt: "asc" }],
    }),
    prisma.workOrder.findMany({
      where: {
        organizationId,
        status: { in: activeStatuses },
        OR: [
          { promisedDate: { lt: now } },
          {
            status: {
              in: [
                WorkOrderStatus.AWAITING_PARTS,
                WorkOrderStatus.AWAITING_APPROVAL,
              ],
            },
          },
        ],
      },
      include: {
        customer: { select: { displayName: true } },
        bay: { select: { name: true } },
      },
      orderBy: [{ promisedDate: "asc" }, { updatedAt: "asc" }],
      take: 6,
    }),
    prisma.activity.findMany({
      where: { workOrder: { organizationId } },
      include: {
        workOrder: {
          select: {
            id: true,
            number: true,
            customer: { select: { displayName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ])

  const totalRevenue = paidInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.grandTotal),
    0
  )
  const averageTicket = paidInvoiceCount > 0 ? totalRevenue / paidInvoiceCount : 0
  const bayCapacity = bays.reduce((sum, bay) => sum + Math.max(1, bay.capacity), 0)
  const occupiedBays = occupiedBayGroups.reduce(
    (sum, group) => sum + group._count._all,
    0
  )
  const bayOccupancy = bayCapacity > 0 ? Math.min(100, (occupiedBays / bayCapacity) * 100) : 0
  const statusCounts = Object.fromEntries(
    workOrdersByStatus.map((item) => [item.status, item._count._all])
  ) as Partial<Record<WorkOrderStatus, number>>
  const chartData = buildRevenueChart(chartInvoices)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Command center"
        title={`Good morning${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        description={welcomeForRole(user?.role)}
        actions={
          <>
            <Link
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-xl bg-white/70 dark:bg-white/5")}
              href="/customers/new"
            >
              <Plus className="size-4" />
              New customer
            </Link>
            <Link
              className={cn(buttonVariants({ size: "lg" }), "rounded-xl shadow-sm shadow-blue-600/20")}
              href="/work-orders/new"
            >
              <ClipboardList className="size-4" />
              New work order
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Paid revenue"
          value={formatCurrency(totalRevenue)}
          helper="Paid invoices this month"
        />
        <StatCard
          icon={CheckCircle2}
          label="Jobs completed"
          value={completedJobs}
          helper="Closed out this month"
        />
        <StatCard
          icon={Gauge}
          label="Avg ticket"
          value={formatCurrency(averageTicket)}
          helper="Paid invoice average"
        />
        <StatCard
          icon={Wrench}
          label="Open work orders"
          value={openWorkOrderCount}
          helper="Active shop backlog"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
        <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle>Paid revenue trend</CardTitle>
            <CardDescription>Last 14 days of paid invoice revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={chartData} />
          </CardContent>
        </Card>

        <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle>Shop status</CardTitle>
            <CardDescription>Bay load and work order flow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl bg-blue-50/70 p-4 ring-1 ring-blue-100 dark:bg-blue-950/30 dark:ring-blue-900/70">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">Bay occupancy</p>
                  <p className="text-xs text-muted-foreground">
                    {occupiedBays} of {bayCapacity || bays.length} capacity slots active
                  </p>
                </div>
                <Badge className="bg-blue-600 text-white">
                  {Math.round(bayOccupancy)}%
                </Badge>
              </div>
              <Progress value={bayOccupancy} className="h-2" />
            </div>

            <div className="grid gap-2">
              {Object.values(WorkOrderStatus).map((status) => {
                const count = statusCounts[status] ?? 0

                if (count === 0) {
                  return null
                }

                return (
                  <div
                    key={status}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/70 px-3 py-2"
                  >
                    <StatusBadge status={status} />
                    <span className="text-sm font-black">{count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="size-5 text-blue-600" />
              Today&apos;s pickups & deliveries
            </CardTitle>
            <CardDescription>Scheduled dispatch work for the shop day</CardDescription>
          </CardHeader>
          <CardContent>
            {dispatchesToday.length ? (
              <div className="space-y-3">
                {dispatchesToday.map((dispatch) => (
                  <div
                    key={dispatch.id}
                    className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900 dark:bg-blue-950/20"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">
                          {dispatch.type === "PICKUP" ? "Pickup" : "Delivery"} ·{" "}
                          {dispatch.workOrder?.customer.displayName ?? "Unassigned customer"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dispatch.windowStart
                            ? formatDateTime(dispatch.windowStart)
                            : formatDateTime(dispatch.scheduledAt)}
                        </p>
                      </div>
                      <StatusBadge status={dispatch.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {dispatch.address
                        ? `${dispatch.address.city}, ${dispatch.address.state}`
                        : dispatch.workOrder?.title ?? "No address attached"}
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {dispatch.driver?.name ?? "Driver unassigned"}
                      {dispatch.vehicle ? ` · ${dispatch.vehicle.name}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarClock}
                title="No dispatches today"
                description="Pickup and delivery work scheduled for today will appear here."
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-600" />
              At-risk work orders
            </CardTitle>
            <CardDescription>Overdue promises, parts waits, and approvals</CardDescription>
          </CardHeader>
          <CardContent>
            {atRiskWorkOrders.length ? (
              <div className="space-y-3">
                {atRiskWorkOrders.map((workOrder) => (
                  <Link
                    key={workOrder.id}
                    href={`/work-orders/${workOrder.id}`}
                    className="block rounded-2xl border border-amber-100 bg-amber-50/40 p-4 transition-colors hover:bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20 dark:hover:bg-amber-950/30"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{workOrder.number}</p>
                        <p className="text-sm text-muted-foreground">
                          {workOrder.customer.displayName}
                        </p>
                      </div>
                      <StatusBadge status={workOrder.status} />
                    </div>
                    <p className="line-clamp-2 text-sm">{workOrder.title}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Promise: {formatDate(workOrder.promisedDate)} · Bay:{" "}
                      {workOrder.bay?.name ?? "Unassigned"}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="No at-risk work"
                description="Nothing is overdue or waiting on approval/parts right now."
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest shop updates and system events</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <span className="mt-1 flex size-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-950" />
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold">{activity.summary}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.workOrder ? (
                          <Link
                            href={`/work-orders/${activity.workOrder.id}`}
                            className="font-semibold text-blue-600 hover:underline dark:text-blue-300"
                          >
                            {activity.workOrder.number}
                          </Link>
                        ) : (
                          activity.action
                        )}{" "}
                        · {activity.workOrder?.customer.displayName ?? "Shop"} ·{" "}
                        {formatDateTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No activity yet"
                description="Status updates, conversions, and shop events will populate this feed."
              />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
