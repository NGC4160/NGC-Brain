import { StaticDriverPage } from "@/components/demo/static-app-pages"
import { isStaticExport } from "@/lib/static"
import { DispatchStatus } from "@prisma/client"
import {
  Camera,
  CheckCircle2,
  ClipboardSignature,
  MapPin,
  Navigation,
  Route,
  Truck,
} from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { updateDispatchStatusFromForm } from "@/lib/actions/dispatch"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { cn, formatDateTime } from "@/lib/utils"

function todayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

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

const statusButtons = [
  { label: "On My Way", status: DispatchStatus.EN_ROUTE },
  { label: "Arrived", status: DispatchStatus.ARRIVED },
  { label: "Complete", status: DispatchStatus.COMPLETED },
]

export default async function DriverPage() {
  if (isStaticExport()) {
    return <StaticDriverPage />
  }

  const session = await auth()
  const organizationId = session?.user?.organizationId
  const userId = session?.user?.id

  if (!organizationId || !userId) {
    return (
      <EmptyState
        icon={Truck}
        title="Driver access unavailable"
        description="Sign in as an organization user to view route stops."
      />
    )
  }

  const { start, end } = todayRange()
  const stops = await prisma.dispatch.findMany({
    where: {
      organizationId,
      driverId: userId,
      OR: [
        { scheduledAt: { gte: start, lt: end } },
        { scheduledAt: null, status: { in: [DispatchStatus.ASSIGNED, DispatchStatus.EN_ROUTE, DispatchStatus.ARRIVED] } },
      ],
    },
    include: {
      address: {
        include: { customer: { select: { displayName: true, phone: true } } },
      },
      workOrder: {
        include: {
          customer: { select: { displayName: true, phone: true } },
          equipment: { select: { year: true, make: true, model: true, name: true } },
        },
      },
      vehicle: { select: { name: true } },
    },
    orderBy: [{ routeOrder: "asc" }, { windowStart: "asc" }],
  })

  return (
    <div className="mx-auto max-w-md space-y-4 pb-20">
      <section className="sticky top-16 z-20 -mx-4 rounded-b-[2rem] border-x border-b border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff)] p-5 shadow-sm backdrop-blur dark:border-blue-900 dark:bg-[linear-gradient(135deg,#071827,#0c1728)] sm:-mx-6 lg:static lg:mx-0 lg:rounded-[2rem] lg:border">
        <Badge className="mb-3 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          Driver PWA
        </Badge>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Today&apos;s Route</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {stops.length} stops assigned for {formatDateTime(start)}
            </p>
          </div>
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-blue-500/20">
            <Route className="size-7" />
          </div>
        </div>
      </section>

      {stops.length ? (
        <div className="space-y-4">
          {stops.map((stop, index) => {
            const customer =
              stop.workOrder?.customer?.displayName ??
              stop.address?.customer?.displayName ??
              "Customer pending"
            const address = addressLine(stop.address)
            const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`
            const equipment = stop.workOrder?.equipment
            const equipmentLabel = equipment
              ? [equipment.year, equipment.make, equipment.model]
                  .filter(Boolean)
                  .join(" ") || equipment.name
              : "Cart details pending"

            return (
              <Card
                key={stop.id}
                className="overflow-hidden border-blue-100 shadow-sm dark:border-blue-900/60"
              >
                <div className="h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-400" />
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge
                        className={cn(
                          "rounded-full",
                          stop.status === DispatchStatus.COMPLETED
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200"
                        )}
                      >
                        Stop {index + 1} • {stop.type.toLowerCase()}
                      </Badge>
                      <h2 className="mt-3 text-xl font-black tracking-tight">
                        {customer}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {stop.workOrder?.number ?? "No work order"} • {equipmentLabel}
                      </p>
                    </div>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-black text-primary">
                      {index + 1}
                    </span>
                  </div>

                  <div className="rounded-3xl bg-muted/55 p-4">
                    <p className="flex gap-2 text-sm leading-6">
                      <MapPin className="mt-1 size-4 shrink-0 text-primary" />
                      {address}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Scheduled {formatDateTime(stop.scheduledAt)} • ETA{" "}
                      {stop.etaMinutes ? `${stop.etaMinutes} minutes` : "pending"}
                    </p>
                  </div>

                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-blue-500/20"
                  >
                    <Navigation className="size-4" />
                    Navigate
                  </a>

                  <div className="grid grid-cols-3 gap-2">
                    {statusButtons.map((button) => (
                      <form key={button.status} action={updateDispatchStatusFromForm}>
                        <input type="hidden" name="dispatchId" value={stop.id} />
                        <input type="hidden" name="status" value={button.status} />
                        <Button
                          type="submit"
                          variant={
                            stop.status === button.status ? "default" : "outline"
                          }
                          className="h-12 w-full rounded-2xl text-xs"
                        >
                          {button.label}
                        </Button>
                      </form>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/60 p-4 text-center dark:border-blue-900 dark:bg-blue-950/20">
                      <Camera className="mx-auto size-6 text-primary" />
                      <p className="mt-2 text-xs font-semibold">Photo proof</p>
                    </div>
                    <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/60 p-4 text-center dark:border-blue-900 dark:bg-blue-950/20">
                      <ClipboardSignature className="mx-auto size-6 text-primary" />
                      <p className="mt-2 text-xs font-semibold">Signature</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={CheckCircle2}
          title="No stops assigned today"
          description="Assigned pickup and delivery stops for your route will appear here with navigation and proof controls."
        />
      )}
    </div>
  )
}
