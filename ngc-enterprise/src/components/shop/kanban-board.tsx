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
import type { WorkOrderStatus } from "@prisma/client"
import { motion } from "framer-motion"
import {
  CalendarClock,
  Gauge,
  GripVertical,
  PanelTop,
  Sparkles,
  UserRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { updateWorkOrderStatus } from "@/lib/actions/shop-floor"
import { cn, formatCurrency, formatDate } from "@/lib/utils"

type KanbanStatus = {
  key: WorkOrderStatus
  label: string
  description: string
  color: string
}

export type ShopFloorWorkOrder = {
  id: string
  number: string
  title: string
  status: WorkOrderStatus
  priority: number
  promisedDate: string | null
  customerName: string
  equipmentName: string
  bayName: string | null
  assignmentNames: string[]
  grandTotal: number
  tags: string[]
}

const columns: KanbanStatus[] = [
  {
    key: "RECEIVED" as WorkOrderStatus,
    label: "Received",
    description: "Intake complete",
    color: "bg-sky-500",
  },
  {
    key: "DIAGNOSIS" as WorkOrderStatus,
    label: "Diagnosis",
    description: "Tech inspection",
    color: "bg-blue-500",
  },
  {
    key: "AWAITING_APPROVAL" as WorkOrderStatus,
    label: "Awaiting Approval",
    description: "Customer decision",
    color: "bg-amber-500",
  },
  {
    key: "AWAITING_PARTS" as WorkOrderStatus,
    label: "Awaiting Parts",
    description: "Parts blocker",
    color: "bg-orange-500",
  },
  {
    key: "IN_PROGRESS" as WorkOrderStatus,
    label: "In Progress",
    description: "On the floor",
    color: "bg-cyan-500",
  },
  {
    key: "QUALITY_CHECK" as WorkOrderStatus,
    label: "QC",
    description: "Final inspection",
    color: "bg-teal-500",
  },
  {
    key: "READY_FOR_PICKUP" as WorkOrderStatus,
    label: "Ready",
    description: "Pickup/delivery ready",
    color: "bg-emerald-500",
  },
]

function priorityLabel(priority: number) {
  if (priority <= 1) return "Urgent"
  if (priority === 2) return "High"
  if (priority >= 5) return "Low"
  return "Normal"
}

function KanbanColumn({
  column,
  orders,
  tabletMode,
  pendingId,
}: {
  column: KanbanStatus
  orders: ShopFloorWorkOrder[]
  tabletMode: boolean
  pendingId: string | null
}) {
  const { isOver, setNodeRef } = useDroppable({ id: column.key })

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[34rem] w-[21rem] shrink-0 flex-col rounded-3xl border bg-white/80 p-3 shadow-sm transition-all dark:bg-white/[0.04]",
        isOver
          ? "border-blue-400 bg-blue-50 shadow-lg shadow-blue-500/10 dark:bg-blue-950/30"
          : "border-border/80"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn("relative size-2.5 rounded-full", column.color)}>
              <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-40" />
            </span>
            <h2 className="font-bold tracking-tight">{column.label}</h2>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {column.description}
          </p>
        </div>
        <Badge variant="outline" className="rounded-full bg-background/80">
          {orders.length}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {orders.length ? (
          orders.map((order, index) => (
            <ShopOrderCard
              key={order.id}
              order={order}
              index={index}
              pending={pendingId === order.id}
              tabletMode={tabletMode}
            />
          ))
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-blue-100 bg-blue-50/40 p-5 text-center text-sm text-muted-foreground dark:border-blue-900/60 dark:bg-blue-950/20">
            Drop work here to move it into {column.label.toLowerCase()}.
          </div>
        )}
      </div>
    </section>
  )
}

function ShopOrderCard({
  order,
  index,
  pending,
  tabletMode,
}: {
  order: ShopFloorWorkOrder
  index: number
  pending: boolean
  tabletMode: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: order.id })
  const style = {
    transform: CSS.Translate.toString(transform),
  }

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
          "relative overflow-hidden border-blue-100 bg-card/95 shadow-sm shadow-blue-950/5 transition-all",
          "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-950/10",
          tabletMode && "min-h-56 text-base",
          isDragging && "z-20 rotate-1 opacity-75 shadow-2xl",
          pending && "ring-2 ring-blue-300"
        )}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-500" />
        <CardHeader className={cn("gap-3 p-4 pb-2", tabletMode && "p-5 pb-3")}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-xs font-bold text-primary">
                {order.number}
              </p>
              <h3 className="mt-1 line-clamp-2 text-sm font-extrabold leading-5 tracking-tight">
                {order.title}
              </h3>
            </div>
            <button
              aria-label={`Drag ${order.number}`}
              className="touch-none rounded-xl p-2 text-muted-foreground hover:bg-muted"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge
              className={cn(
                "rounded-full",
                order.priority <= 2
                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200"
              )}
            >
              <Gauge className="size-3" />
              {priorityLabel(order.priority)}
            </Badge>
            {order.bayName ? (
              <Badge variant="outline" className="rounded-full bg-background">
                <PanelTop className="size-3" />
                {order.bayName}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className={cn("space-y-3 p-4 pt-1", tabletMode && "p-5 pt-1")}>
          <div className="rounded-2xl bg-muted/60 p-3">
            <p className="truncate text-sm font-semibold">{order.customerName}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {order.equipmentName}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarClock className="size-3.5 text-primary" />
              {formatDate(order.promisedDate)}
            </span>
            <span className="text-right font-semibold text-foreground">
              {formatCurrency(order.grandTotal)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
              <UserRound className="size-3.5 text-primary" />
              <span className="truncate">
                {order.assignmentNames.length
                  ? order.assignmentNames.join(", ")
                  : "Unassigned"}
              </span>
            </span>
            {pending ? (
              <span className="flex items-center gap-1 text-primary">
                <Sparkles className="size-3 animate-pulse" />
                Saving
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function KanbanBoard({ workOrders }: { workOrders: ShopFloorWorkOrder[] }) {
  const [optimisticOrders, setOptimisticOrders] = React.useState<
    ShopFloorWorkOrder[] | null
  >(null)
  const [tabletMode, setTabletMode] = React.useState(false)
  const [pendingId, setPendingId] = React.useState<string | null>(null)
  const orders = optimisticOrders ?? workOrders
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over) return

    const workOrderId = String(active.id)
    const nextStatus = String(over.id) as WorkOrderStatus
    const current = orders.find((order) => order.id === workOrderId)

    if (!current || current.status === nextStatus) return

    setOptimisticOrders((currentOrders) =>
      (currentOrders ?? workOrders).map((order) =>
        order.id === workOrderId ? { ...order, status: nextStatus } : order
      )
    )
    setPendingId(workOrderId)

    React.startTransition(async () => {
      try {
        await updateWorkOrderStatus(workOrderId, nextStatus)
      } catch {
        setOptimisticOrders(null)
      } finally {
        setPendingId(null)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl border border-blue-100 bg-white/75 p-4 shadow-sm dark:border-blue-900/60 dark:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Live shop board</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag cards across status lanes. Cards are sized for tablets and
            shop-floor touch input.
          </p>
        </div>
        <Button
          type="button"
          variant={tabletMode ? "default" : "outline"}
          className="rounded-full"
          onClick={() => setTabletMode((value) => !value)}
        >
          Tablet mode {tabletMode ? "on" : "off"}
        </Button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]">
          {columns.map((column) => (
            <KanbanColumn
              key={column.key}
              column={column}
              orders={orders.filter((order) => {
                if (column.key === "READY_FOR_PICKUP") {
                  return (
                    order.status === "READY_FOR_PICKUP" ||
                    order.status === "READY_FOR_DELIVERY"
                  )
                }

                return order.status === column.key
              })}
              pendingId={pendingId}
              tabletMode={tabletMode}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}
