import { StaticShopFloorPage } from "@/components/demo/static-app-pages"
import { isStaticExport } from "@/lib/static"
import { WorkOrderStatus } from "@prisma/client"
import { Activity, AlertTriangle, Clock3, Wrench } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import {
  KanbanBoard,
  type ShopFloorWorkOrder,
} from "@/components/shop/kanban-board"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { formatDate } from "@/lib/utils"

const boardStatuses: WorkOrderStatus[] = [
  WorkOrderStatus.RECEIVED,
  WorkOrderStatus.DIAGNOSIS,
  WorkOrderStatus.AWAITING_APPROVAL,
  WorkOrderStatus.AWAITING_PARTS,
  WorkOrderStatus.IN_PROGRESS,
  WorkOrderStatus.QUALITY_CHECK,
  WorkOrderStatus.READY_FOR_PICKUP,
  WorkOrderStatus.READY_FOR_DELIVERY,
]
const waitingStatuses = new Set<WorkOrderStatus>([
  WorkOrderStatus.AWAITING_APPROVAL,
  WorkOrderStatus.AWAITING_PARTS,
])
const readyStatuses = new Set<WorkOrderStatus>([
  WorkOrderStatus.READY_FOR_PICKUP,
  WorkOrderStatus.READY_FOR_DELIVERY,
])

function equipmentLabel(
  equipment:
    | { year: number | null; make: string | null; model: string | null; name: string }
    | null
    | undefined
) {
  if (!equipment) return "Equipment not attached"
  return [equipment.year, equipment.make, equipment.model].filter(Boolean).join(" ") || equipment.name
}

export default async function ShopFloorPage() {
  if (isStaticExport()) {
    return <StaticShopFloorPage />
  }

  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return (
      <EmptyState
        icon={Wrench}
        title="No organization selected"
        description="Your user account is not connected to an organization yet."
      />
    )
  }

  const [workOrders, bays] = await Promise.all([
    prisma.workOrder.findMany({
      where: {
        organizationId,
        status: { in: boardStatuses },
      },
      include: {
        customer: { select: { displayName: true } },
        equipment: {
          select: { year: true, make: true, model: true, name: true },
        },
        bay: { select: { name: true, code: true } },
        assignments: {
          include: { user: { select: { name: true, email: true } } },
          orderBy: { assignedAt: "asc" },
        },
      },
      orderBy: [{ priority: "asc" }, { promisedDate: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.bay.findMany({
      where: { organizationId },
      include: { workOrders: { where: { status: { in: boardStatuses } } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ])

  const kanbanOrders: ShopFloorWorkOrder[] = workOrders.map((workOrder) => ({
    id: workOrder.id,
    number: workOrder.number,
    title: workOrder.title,
    status: workOrder.status,
    priority: workOrder.priority,
    promisedDate: workOrder.promisedDate?.toISOString() ?? null,
    customerName: workOrder.customer?.displayName ?? "Unknown customer",
    equipmentName: equipmentLabel(workOrder.equipment),
    bayName: workOrder.bay?.name ?? workOrder.bay?.code ?? null,
    assignmentNames: workOrder.assignments.map(
      (assignment) => assignment.user.name ?? assignment.user.email
    ),
    grandTotal: Number(workOrder.grandTotal),
    tags: workOrder.tags,
  }))

  const urgentCount = workOrders.filter((workOrder) => workOrder.priority <= 2).length
  const awaitingCount = workOrders.filter((workOrder) =>
    waitingStatuses.has(workOrder.status)
  ).length
  const readyCount = workOrders.filter((workOrder) =>
    readyStatuses.has(workOrder.status)
  ).length
  const bayCapacity = bays.reduce((sum, bay) => sum + bay.capacity, 0)
  const bayLoad = bays.reduce((sum, bay) => sum + bay.workOrders.length, 0)

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff_48%,#e0f2fe)] p-6 shadow-sm dark:border-blue-900/60 dark:bg-[linear-gradient(135deg,#071827,#0c1728)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
              Live shop command
            </Badge>
            <h1 className="text-4xl font-black tracking-tight">Shop Floor</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Visual status control from received through QC and ready. Designed
              for tablet use at the bay with live-feeling status pulses.
            </p>
          </div>
          <div className="rounded-3xl bg-white/80 p-4 text-sm shadow-sm ring-1 ring-blue-100 dark:bg-white/10 dark:ring-white/10">
            <p className="font-semibold">Bay load</p>
            <p className="mt-1 text-3xl font-black text-primary">
              {bayLoad}/{bayCapacity || "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Capacity across {bays.length} bays
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardContent className="flex items-center gap-4 p-5">
            <Activity className="size-9 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Active work</p>
              <p className="text-2xl font-black">{workOrders.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardContent className="flex items-center gap-4 p-5">
            <AlertTriangle className="size-9 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Urgent / waiting</p>
              <p className="text-2xl font-black">
                {urgentCount} / {awaitingCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardContent className="flex items-center gap-4 p-5">
            <Clock3 className="size-9 text-emerald-500" />
            <div>
              <p className="text-sm text-muted-foreground">Ready / next promise</p>
              <p className="text-2xl font-black">{readyCount}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(workOrders[0]?.promisedDate)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {kanbanOrders.length ? (
        <KanbanBoard workOrders={kanbanOrders} />
      ) : (
        <EmptyState
          icon={Wrench}
          title="No active work on the floor"
          description="New work orders will appear here as soon as they are received or scheduled for diagnosis."
        />
      )}
    </div>
  )
}
