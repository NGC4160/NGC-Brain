import { DispatchStatus, Role } from "@prisma/client"
import { CalendarClock, MapPinned, Route, Truck } from "lucide-react"

import {
  DispatchBoard,
  type DispatchDriver,
  type DispatchStop,
} from "@/components/dispatch/dispatch-board"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { formatDateTime, initials } from "@/lib/utils"

const activeDispatchStatuses = [
  DispatchStatus.SCHEDULED,
  DispatchStatus.ASSIGNED,
  DispatchStatus.EN_ROUTE,
  DispatchStatus.ARRIVED,
]
const routeActiveStatuses = new Set<DispatchStatus>([
  DispatchStatus.EN_ROUTE,
  DispatchStatus.ARRIVED,
])

function addressLine(
  address:
    | {
        address1: string
        address2: string | null
        city: string
        state: string
        postalCode: string
      }
    | null
    | undefined
) {
  if (!address) return "Address pending"
  return [address.address1, address.address2, address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(", ")
}

function windowLabel(start?: Date | null, end?: Date | null) {
  if (!start && !end) return "Open window"
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
  return [start ? formatter.format(start) : null, end ? formatter.format(end) : null]
    .filter(Boolean)
    .join(" - ")
}

export default async function DispatchPage() {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return (
      <EmptyState
        icon={Truck}
        title="No organization selected"
        description="Your user account is not connected to an organization yet."
      />
    )
  }

  const [driversRaw, dispatches] = await Promise.all([
    prisma.user.findMany({
      where: {
        organizationId,
        isActive: true,
        role: { in: [Role.PICKUP_DRIVER, Role.DELIVERY_DRIVER] },
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
    prisma.dispatch.findMany({
      where: {
        organizationId,
        status: { in: activeDispatchStatuses },
      },
      include: {
        driver: { select: { id: true, name: true, email: true } },
        vehicle: { select: { name: true, plateNumber: true } },
        address: {
          include: { customer: { select: { displayName: true } } },
        },
        workOrder: {
          include: {
            customer: { select: { displayName: true } },
          },
        },
      },
      orderBy: [{ scheduledAt: "asc" }, { routeOrder: "asc" }],
    }),
  ])

  const drivers: DispatchDriver[] = driversRaw.map((driver) => ({
    id: driver.id,
    name: driver.name ?? driver.email,
    role: driver.role.replaceAll("_", " "),
    initials: initials(driver.name ?? driver.email),
  }))

  const stops: DispatchStop[] = dispatches.map((dispatch) => ({
    id: dispatch.id,
    type: dispatch.type,
    status: dispatch.status,
    customerName:
      dispatch.workOrder?.customer?.displayName ??
      dispatch.address?.customer?.displayName ??
      "Customer pending",
    workOrderNumber: dispatch.workOrder?.number ?? null,
    address: addressLine(dispatch.address),
    windowLabel: windowLabel(dispatch.windowStart, dispatch.windowEnd),
    scheduledLabel: formatDateTime(dispatch.scheduledAt),
    etaMinutes: dispatch.etaMinutes,
    driverId: dispatch.driverId,
    vehicleName: dispatch.vehicle?.name ?? dispatch.vehicle?.plateNumber ?? null,
    routeOrder: dispatch.routeOrder,
    notes: dispatch.notes,
    latitude: dispatch.latitude,
    longitude: dispatch.longitude,
  }))

  const assigned = stops.filter((stop) => stop.driverId).length
  const enRoute = stops.filter((stop) => routeActiveStatuses.has(stop.status)).length

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-blue-100 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.20),transparent_24rem),linear-gradient(135deg,#eff6ff,#ffffff_52%,#e0f2fe)] p-6 shadow-sm dark:border-blue-900/60 dark:bg-[linear-gradient(135deg,#071827,#0c1728)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
              Differentiator
            </Badge>
            <h1 className="text-4xl font-black tracking-tight">Dispatch</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Pickup and delivery control tower with driver lanes, ETA windows,
              customer addresses, and map-ready routing context.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="bg-white/80 shadow-sm dark:bg-white/10">
              <CardContent className="flex items-center gap-3 p-4">
                <Route className="size-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Active stops</p>
                  <p className="text-2xl font-black">{stops.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 shadow-sm dark:bg-white/10">
              <CardContent className="flex items-center gap-3 p-4">
                <Truck className="size-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Assigned</p>
                  <p className="text-2xl font-black">{assigned}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 shadow-sm dark:bg-white/10">
              <CardContent className="flex items-center gap-3 p-4">
                <MapPinned className="size-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">On route</p>
                  <p className="text-2xl font-black">{enRoute}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {drivers.length || stops.length ? (
        <DispatchBoard drivers={drivers} stops={stops} />
      ) : (
        <EmptyState
          icon={CalendarClock}
          title="No dispatch activity scheduled"
          description="Pickup and delivery dispatches will appear here when work orders need carts moved in or out."
        />
      )}
    </div>
  )
}
