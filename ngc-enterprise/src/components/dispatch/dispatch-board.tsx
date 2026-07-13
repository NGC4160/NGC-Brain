"use client"

import * as React from "react"
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import type { DispatchStatus, DispatchType } from "@prisma/client"
import { motion } from "framer-motion"
import {
  Clock3,
  GripVertical,
  MapPin,
  Navigation,
  PackageCheck,
  Route,
  Truck,
  UserRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  assignDispatchDriver,
  updateDispatchStatus,
} from "@/lib/actions/dispatch"
import { cn } from "@/lib/utils"

export type DispatchDriver = {
  id: string
  name: string
  role: string
  initials: string
}

export type DispatchStop = {
  id: string
  type: DispatchType
  status: DispatchStatus
  customerName: string
  workOrderNumber: string | null
  address: string
  windowLabel: string
  scheduledLabel: string
  etaMinutes: number | null
  driverId: string | null
  vehicleName: string | null
  routeOrder: number
  notes: string | null
  latitude: number | null
  longitude: number | null
}

type BoardType = "PICKUP" | "DELIVERY"

const statusStyles: Record<string, string> = {
  SCHEDULED: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200",
  ASSIGNED: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
  EN_ROUTE: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
  ARRIVED: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-200",
  COMPLETED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
}

const nextStatusButtons: { label: string; status: DispatchStatus }[] = [
  { label: "En Route", status: "EN_ROUTE" as DispatchStatus },
  { label: "Arrived", status: "ARRIVED" as DispatchStatus },
  { label: "Done", status: "COMPLETED" as DispatchStatus },
]

function DropLane({
  id,
  title,
  subtitle,
  icon: Icon,
  children,
  highlight,
}: {
  id: string
  title: string
  subtitle: string
  icon: typeof UserRound
  children: React.ReactNode
  highlight?: boolean
}) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[32rem] w-[22rem] shrink-0 flex-col rounded-[2rem] border bg-white/82 p-3 shadow-sm transition-all dark:bg-white/[0.04]",
        isOver
          ? "border-blue-400 bg-blue-50 shadow-xl shadow-blue-500/10 dark:bg-blue-950/30"
          : "border-border/80",
        highlight && "border-blue-200 bg-blue-50/60 dark:bg-blue-950/20"
      )}
    >
      <div className="mb-3 flex items-center gap-3 rounded-3xl bg-background/80 p-3 shadow-sm ring-1 ring-border/60">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-extrabold tracking-tight">
            {title}
          </h3>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3">{children}</div>
    </section>
  )
}

function StopCard({
  stop,
  index,
  pendingId,
  onStatusChange,
}: {
  stop: DispatchStop
  index: number
  pendingId: string | null
  onStatusChange: (stopId: string, status: DispatchStatus) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: stop.id })
  const style = { transform: CSS.Translate.toString(transform) }
  const pending = pendingId === stop.id

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
    >
      <Card
        ref={setNodeRef}
        style={style}
        className={cn(
          "overflow-hidden border-blue-100 bg-card/95 shadow-sm shadow-blue-950/5",
          isDragging && "z-20 rotate-1 opacity-75 shadow-2xl",
          pending && "ring-2 ring-blue-300"
        )}
      >
        <div className="h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-400" />
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    "rounded-full",
                    statusStyles[stop.status] ?? statusStyles.SCHEDULED
                  )}
                >
                  {stop.status.replaceAll("_", " ")}
                </Badge>
                {stop.workOrderNumber ? (
                  <span className="font-mono text-xs font-bold text-primary">
                    {stop.workOrderNumber}
                  </span>
                ) : null}
              </div>
              <h4 className="mt-2 truncate text-base font-extrabold tracking-tight">
                {stop.customerName}
              </h4>
            </div>
            <button
              aria-label={`Drag stop for ${stop.customerName}`}
              className="touch-none rounded-xl p-2 text-muted-foreground hover:bg-muted"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-4" />
            </button>
          </div>

          <div className="space-y-2 rounded-2xl bg-muted/55 p-3 text-sm">
            <p className="flex items-start gap-2 leading-5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{stop.address}</span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock3 className="size-3.5 text-primary" />
                {stop.windowLabel}
              </span>
              <span className="flex items-center justify-end gap-1.5">
                <Navigation className="size-3.5 text-primary" />
                {stop.etaMinutes ? `${stop.etaMinutes} min ETA` : "ETA open"}
              </span>
            </div>
          </div>

          {stop.notes ? (
            <p className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3 text-xs leading-5 text-muted-foreground dark:border-blue-900/60 dark:bg-blue-950/20">
              {stop.notes}
            </p>
          ) : null}

          <div className="grid grid-cols-3 gap-1.5">
            {nextStatusButtons.map((button) => (
              <Button
                key={button.status}
                type="button"
                variant={stop.status === button.status ? "default" : "outline"}
                size="sm"
                className="rounded-full text-xs"
                onClick={() => onStatusChange(stop.id, button.status)}
              >
                {button.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function BoardByType({
  type,
  stops,
  drivers,
  pendingId,
  onStatusChange,
}: {
  type: BoardType
  stops: DispatchStop[]
  drivers: DispatchDriver[]
  pendingId: string | null
  onStatusChange: (stopId: string, status: DispatchStatus) => void
}) {
  const stopsForType = stops
    .filter((stop) => stop.type === type)
    .sort((a, b) => a.routeOrder - b.routeOrder)

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]">
      <DropLane
        id="unassigned"
        title="Unassigned stops"
        subtitle={`${stopsForType.filter((stop) => !stop.driverId).length} need a driver`}
        icon={PackageCheck}
        highlight
      >
        {stopsForType.filter((stop) => !stop.driverId).length ? (
          stopsForType
            .filter((stop) => !stop.driverId)
            .map((stop, index) => (
              <StopCard
                key={stop.id}
                stop={stop}
                index={index}
                pendingId={pendingId}
                onStatusChange={onStatusChange}
              />
            ))
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-blue-200 bg-blue-50/50 p-6 text-center text-sm text-muted-foreground dark:border-blue-900/70 dark:bg-blue-950/20">
            Every {type.toLowerCase()} stop has a driver.
          </div>
        )}
      </DropLane>

      {drivers.map((driver) => {
        const driverStops = stopsForType.filter(
          (stop) => stop.driverId === driver.id
        )

        return (
          <DropLane
            key={driver.id}
            id={`driver:${driver.id}`}
            title={driver.name}
            subtitle={`${driverStops.length} stops assigned`}
            icon={Truck}
          >
            {driverStops.length ? (
              driverStops.map((stop, index) => (
                <StopCard
                  key={stop.id}
                  stop={stop}
                  index={index}
                  pendingId={pendingId}
                  onStatusChange={onStatusChange}
                />
              ))
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                Drop a stop here to assign {driver.name.split(" ")[0]}.
              </div>
            )}
          </DropLane>
        )
      })}
    </div>
  )
}

function DispatchMap({ stops }: { stops: DispatchStop[] }) {
  const pins = stops.filter((stop) => stop.latitude && stop.longitude).slice(0, 8)
  const fallbackPins = stops.slice(0, 8)

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div className="relative min-h-[34rem] overflow-hidden rounded-[2rem] border border-blue-100 bg-[radial-gradient(circle_at_25%_20%,rgba(14,165,233,0.28),transparent_18rem),radial-gradient(circle_at_75%_65%,rgba(37,99,235,0.22),transparent_20rem),linear-gradient(135deg,#eaf6ff,#f8fafc)] shadow-sm dark:border-blue-900 dark:bg-[linear-gradient(135deg,#081627,#0b1f36)]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute left-6 top-6 rounded-2xl bg-white/80 p-4 shadow-xl backdrop-blur dark:bg-slate-950/70">
          <p className="flex items-center gap-2 text-sm font-extrabold">
            <Route className="size-4 text-primary" />
            Mapbox-ready route preview
          </p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
            Add a Mapbox token to replace this styled operations map with live
            routing, traffic, and driver telemetry.
          </p>
        </div>
        {(pins.length ? pins : fallbackPins).map((stop, index) => (
          <div
            key={stop.id}
            className="absolute rounded-full bg-primary text-primary-foreground shadow-xl shadow-blue-500/25 ring-4 ring-white/80 dark:ring-slate-950/80"
            style={{
              left: `${18 + ((index * 17) % 62)}%`,
              top: `${24 + ((index * 23) % 52)}%`,
            }}
          >
            <div className="relative flex size-10 items-center justify-center text-sm font-black">
              {index + 1}
              <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-30" />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="rounded-[2rem] border bg-card p-4 shadow-sm">
          <p className="font-extrabold tracking-tight">Pinned stops</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Address list for the map fallback.
          </p>
        </div>
        {fallbackPins.map((stop, index) => (
          <div
            key={stop.id}
            className="rounded-3xl border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{stop.customerName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {stop.address}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DispatchBoard({
  drivers,
  stops,
}: {
  drivers: DispatchDriver[]
  stops: DispatchStop[]
}) {
  const [optimisticStops, setOptimisticStops] = React.useState<
    DispatchStop[] | null
  >(null)
  const [pendingId, setPendingId] = React.useState<string | null>(null)
  const localStops = optimisticStops ?? stops
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const stopId = String(active.id)
    const target = String(over.id)
    const driverId = target.startsWith("driver:")
      ? target.replace("driver:", "")
      : null
    const current = localStops.find((stop) => stop.id === stopId)

    if (!current || current.driverId === driverId) return

    setOptimisticStops((currentStops) =>
      (currentStops ?? stops).map((stop) =>
        stop.id === stopId
          ? {
              ...stop,
              driverId,
              status: driverId
                ? ("ASSIGNED" as DispatchStatus)
                : ("SCHEDULED" as DispatchStatus),
            }
          : stop
      )
    )
    setPendingId(stopId)

    React.startTransition(async () => {
      try {
        await assignDispatchDriver(stopId, driverId)
      } catch {
        setOptimisticStops(null)
      } finally {
        setPendingId(null)
      }
    })
  }

  function handleStatusChange(stopId: string, status: DispatchStatus) {
    setOptimisticStops((currentStops) =>
      (currentStops ?? stops).map((stop) =>
        stop.id === stopId ? { ...stop, status } : stop
      )
    )
    setPendingId(stopId)

    React.startTransition(async () => {
      try {
        await updateDispatchStatus(stopId, status)
      } catch {
        setOptimisticStops(null)
      } finally {
        setPendingId(null)
      }
    })
  }

  const pickups = localStops.filter((stop) => stop.type === "PICKUP").length
  const deliveries = localStops.filter((stop) => stop.type === "DELIVERY").length

  return (
    <Tabs defaultValue="pickup" className="gap-5">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-blue-100 bg-white/75 p-4 shadow-sm dark:border-blue-900/60 dark:bg-white/[0.04] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            Pickup • Delivery • Route command
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">
            Dispatch control tower
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign stops to drivers, advance route status, and keep customers
            moving without leaving the board.
          </p>
        </div>
        <TabsList className="h-11 rounded-full bg-blue-50 p-1 dark:bg-blue-950/40">
          <TabsTrigger value="pickup" className="rounded-full px-4">
            Pickup Board
            <Badge variant="outline" className="ml-1 rounded-full bg-background">
              {pickups}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="delivery" className="rounded-full px-4">
            Delivery Board
            <Badge variant="outline" className="ml-1 rounded-full bg-background">
              {deliveries}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="map" className="rounded-full px-4">
            Map
          </TabsTrigger>
        </TabsList>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <TabsContent value="pickup">
          <BoardByType
            type="PICKUP"
            stops={localStops}
            drivers={drivers}
            pendingId={pendingId}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>
        <TabsContent value="delivery">
          <BoardByType
            type="DELIVERY"
            stops={localStops}
            drivers={drivers}
            pendingId={pendingId}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>
      </DndContext>

      <TabsContent value="map">
        <DispatchMap stops={localStops} />
      </TabsContent>

      {!localStops.length ? (
        <div className="rounded-[2rem] border border-dashed border-blue-200 bg-blue-50/60 p-8 text-center text-sm text-muted-foreground dark:border-blue-900 dark:bg-blue-950/20">
          No scheduled stops yet. When pickup or delivery dispatches are created,
          they will appear here by board and driver.
        </div>
      ) : null}
    </Tabs>
  )
}
