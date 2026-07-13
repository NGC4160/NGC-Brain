import { WorkOrderStatus } from "@prisma/client"
import { CalendarDays, Gauge, PanelTop, Route } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { cn, formatDate, formatDateTime } from "@/lib/utils"

const activeStatuses = [
  WorkOrderStatus.RECEIVED,
  WorkOrderStatus.DIAGNOSIS,
  WorkOrderStatus.AWAITING_APPROVAL,
  WorkOrderStatus.AWAITING_PARTS,
  WorkOrderStatus.IN_PROGRESS,
  WorkOrderStatus.QUALITY_CHECK,
  WorkOrderStatus.READY_FOR_PICKUP,
  WorkOrderStatus.READY_FOR_DELIVERY,
]

function startOfWeek(date: Date) {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const start = new Date(date)
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)
  return start
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(date.getDate() + days)
  return next
}

function isSameDay(left?: Date | null, right?: Date | null) {
  if (!left || !right) return false
  return left.toDateString() === right.toDateString()
}

function addressLine(
  address:
    | { address1: string; city: string; state: string; postalCode: string }
    | null
    | undefined
) {
  if (!address) return "Address pending"
  return [address.address1, address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(", ")
}

export default async function SchedulePage() {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No organization selected"
        description="Your user account is not connected to an organization yet."
      />
    )
  }

  const weekStart = startOfWeek(new Date())
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  const weekEnd = addDays(weekStart, 7)

  const [bays, workOrders, dispatches] = await Promise.all([
    prisma.bay.findMany({
      where: { organizationId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.workOrder.findMany({
      where: {
        organizationId,
        status: { in: activeStatuses },
        promisedDate: { gte: weekStart, lt: weekEnd },
      },
      include: {
        bay: { select: { id: true, name: true } },
        customer: { select: { displayName: true } },
      },
      orderBy: [{ promisedDate: "asc" }, { priority: "asc" }],
    }),
    prisma.dispatch.findMany({
      where: {
        organizationId,
        scheduledAt: { gte: weekStart, lt: weekEnd },
      },
      include: {
        driver: { select: { name: true, email: true } },
        address: { select: { address1: true, city: true, state: true, postalCode: true } },
        workOrder: {
          include: { customer: { select: { displayName: true } } },
        },
      },
      orderBy: [{ scheduledAt: "asc" }, { routeOrder: "asc" }],
    }),
  ])

  const unassignedWork = workOrders.filter((workOrder) => !workOrder.bayId)
  const bayCapacity = bays.reduce((sum, bay) => sum + bay.capacity, 0)
  const scheduledBayWork = workOrders.filter((workOrder) => workOrder.bayId).length
  const dispatchCount = dispatches.length

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff_52%,#e0f2fe)] p-6 shadow-sm dark:border-blue-900/60 dark:bg-[linear-gradient(135deg,#071827,#0c1728)]">
        <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          Week view
        </Badge>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Schedule</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Bay work, promised dates, and pickup/delivery movements for the
              current operating week.
            </p>
          </div>
          <p className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold shadow-sm ring-1 ring-blue-100 dark:bg-white/10 dark:ring-white/10">
            {formatDate(weekStart)} - {formatDate(addDays(weekEnd, -1))}
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardContent className="flex items-center gap-4 p-5">
            <PanelTop className="size-9 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Bay capacity</p>
              <p className="text-2xl font-black">
                {scheduledBayWork}/{bayCapacity || "—"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardContent className="flex items-center gap-4 p-5">
            <Gauge className="size-9 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Unassigned work</p>
              <p className="text-2xl font-black">{unassignedWork.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardContent className="flex items-center gap-4 p-5">
            <Route className="size-9 text-emerald-500" />
            <div>
              <p className="text-sm text-muted-foreground">Dispatches</p>
              <p className="text-2xl font-black">{dispatchCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {bays.length ? (
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[68rem] rounded-[2rem] border border-blue-100 bg-white/80 p-3 shadow-sm dark:border-blue-900/60 dark:bg-white/[0.04]">
            <div className="grid grid-cols-[12rem_repeat(7,minmax(8rem,1fr))] gap-2">
              <div className="rounded-2xl bg-muted/60 p-3 text-sm font-bold">
                Bay
              </div>
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "rounded-2xl bg-muted/60 p-3 text-sm font-bold",
                    isSameDay(day, new Date()) && "bg-blue-100 text-blue-700"
                  )}
                >
                  {day.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              ))}

              {bays.map((bay) => (
                <div key={bay.id} className="contents">
                  <div className="rounded-2xl border bg-card p-3">
                    <p className="font-extrabold">{bay.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Capacity {bay.capacity} • {bay.status.toLowerCase()}
                    </p>
                  </div>
                  {days.map((day) => {
                    const dayWork = workOrders.filter(
                      (workOrder) =>
                        workOrder.bayId === bay.id &&
                        isSameDay(workOrder.promisedDate, day)
                    )

                    return (
                      <div
                        key={`${bay.id}-${day.toISOString()}`}
                        className="min-h-32 rounded-2xl border border-dashed border-blue-100 bg-blue-50/30 p-2 dark:border-blue-900/60 dark:bg-blue-950/10"
                      >
                        {dayWork.map((workOrder) => (
                          <div
                            key={workOrder.id}
                            className="mb-2 rounded-xl bg-card p-2 text-xs shadow-sm ring-1 ring-border/70"
                          >
                            <p className="font-bold">{workOrder.number}</p>
                            <p className="mt-1 line-clamp-2 text-muted-foreground">
                              {workOrder.customer?.displayName} • {workOrder.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={PanelTop}
          title="No bays configured"
          description="Add shop bays in settings to unlock capacity planning for promised dates."
        />
      )}

      <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
        <CardHeader>
          <CardTitle>Dispatches this week</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {dispatches.length ? (
            dispatches.map((dispatch) => (
              <div
                key={dispatch.id}
                className="rounded-3xl border bg-muted/30 p-4"
              >
                <Badge variant="outline" className="rounded-full bg-background">
                  {dispatch.type.toLowerCase()} • {dispatch.status.toLowerCase()}
                </Badge>
                <p className="mt-3 font-bold">
                  {dispatch.workOrder?.customer?.displayName ?? "Customer pending"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {addressLine(dispatch.address)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatDateTime(dispatch.scheduledAt)} •{" "}
                  {dispatch.driver?.name ?? dispatch.driver?.email ?? "Unassigned"}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No pickup or delivery dispatches are scheduled this week.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
