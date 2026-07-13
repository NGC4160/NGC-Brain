import { StaticWorkOrderDetailPage } from "@/components/demo/static-app-pages"
import { demoWorkOrders } from "@/lib/demo-data"
import { isStaticExport } from "@/lib/static"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  CalendarClock,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Package,
  ReceiptText,
  Route,
  UserRound,
  Wrench,
} from "lucide-react"
import { WorkOrderStatus } from "@prisma/client"

import { updateWorkOrderStatusFromForm } from "@/lib/actions/work-orders"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils"


export function generateStaticParams() {
  if (!isStaticExport()) return []

  return demoWorkOrders.map((workOrder) => ({ id: workOrder.id }))
}

type WorkOrderDetailPageProps = {
  params: Promise<{ id: string }>
}

type ChecklistItem = {
  id?: string
  label?: string
  required?: boolean
  completed?: boolean
  completedAt?: string
}

const statusSequence: WorkOrderStatus[] = [
  WorkOrderStatus.RECEIVED,
  WorkOrderStatus.DIAGNOSIS,
  WorkOrderStatus.AWAITING_APPROVAL,
  WorkOrderStatus.AWAITING_PARTS,
  WorkOrderStatus.IN_PROGRESS,
  WorkOrderStatus.QUALITY_CHECK,
  WorkOrderStatus.READY_FOR_PICKUP,
  WorkOrderStatus.READY_FOR_DELIVERY,
  WorkOrderStatus.COMPLETED,
  WorkOrderStatus.DELIVERED,
  WorkOrderStatus.PICKED_UP,
]

const actionStatuses = [
  WorkOrderStatus.DIAGNOSIS,
  WorkOrderStatus.AWAITING_APPROVAL,
  WorkOrderStatus.AWAITING_PARTS,
  WorkOrderStatus.IN_PROGRESS,
  WorkOrderStatus.QUALITY_CHECK,
  WorkOrderStatus.READY_FOR_PICKUP,
  WorkOrderStatus.READY_FOR_DELIVERY,
  WorkOrderStatus.COMPLETED,
  WorkOrderStatus.ON_HOLD,
  WorkOrderStatus.CANCELLED,
]

function checklistItems(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is ChecklistItem => typeof item === "object" && item !== null)
}

export default async function WorkOrderDetailPage({
  params,
}: WorkOrderDetailPageProps) {
  const { id } = await params

  if (isStaticExport()) {
    return <StaticWorkOrderDetailPage id={id} />
  }

  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return (
      <EmptyState
        title="No organization attached"
        description="Work order details require an organization-scoped session."
      />
    )
  }

  const workOrder = await prisma.workOrder.findFirst({
    where: { id, organizationId },
    include: {
      customer: { select: { id: true, displayName: true, email: true, phone: true } },
      equipment: true,
      bay: { select: { name: true, status: true } },
      location: { select: { name: true } },
      estimate: { select: { id: true, number: true, status: true } },
      lineItems: { orderBy: { sortOrder: "asc" } },
      assignments: {
        include: { user: { select: { name: true, role: true, email: true } } },
        orderBy: { assignedAt: "desc" },
      },
      checklists: true,
      partsReserved: {
        include: { inventoryItem: { select: { name: true, sku: true } } },
        orderBy: { createdAt: "desc" },
      },
      attachments: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 25 },
      invoices: { orderBy: { createdAt: "desc" } },
      dispatches: {
        include: {
          driver: { select: { name: true } },
          vehicle: { select: { name: true } },
        },
        orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
      },
    },
  })

  if (!workOrder) {
    notFound()
  }

  const currentIndex = statusSequence.findIndex(
    (status: WorkOrderStatus) => status === workOrder.status
  )
  const checklistTotal = workOrder.checklists.reduce(
    (sum, checklist) => sum + checklistItems(checklist.items).length,
    0
  )
  const checklistCompleted = workOrder.checklists.reduce(
    (sum, checklist) =>
      sum + checklistItems(checklist.items).filter((item) => item.completed).length,
    0
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Work order"
        title={`${workOrder.number} · ${workOrder.title}`}
        description={`${workOrder.customer.displayName} ${
          workOrder.equipment ? `· ${workOrder.equipment.name}` : ""
        }`}
        actions={
          <>
            <Link
              href="/work-orders"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-xl bg-white/70 dark:bg-white/5")}
            >
              <ArrowLeft className="size-4" />
              Work orders
            </Link>
            <Link
              href={`/customers/${workOrder.customer.id}`}
              className={cn(buttonVariants({ size: "lg" }), "rounded-xl shadow-sm shadow-blue-600/20")}
            >
              <UserRound className="size-4" />
              Customer profile
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Status"
          value={<StatusBadge status={workOrder.status} />}
          helper="Current shop state"
          icon={Wrench}
        />
        <StatCard label="Promised" value={formatDate(workOrder.promisedDate)} icon={CalendarClock} />
        <StatCard label="Bay" value={workOrder.bay?.name ?? "Unassigned"} helper={workOrder.location?.name ?? undefined} />
        <StatCard label="Total" value={formatCurrency(Number(workOrder.grandTotal))} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle>Status timeline</CardTitle>
            <CardDescription>Current operational phase from intake through pickup or delivery.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {statusSequence.map((status, index) => {
                const active = index <= currentIndex
                const current = status === workOrder.status

                return (
                  <div
                    key={status}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-3",
                      active
                        ? "border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/30"
                        : "border-border bg-background/60"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full text-xs font-black",
                        active
                          ? "bg-blue-600 text-white"
                          : "bg-muted text-muted-foreground",
                        current && "ring-4 ring-blue-100 dark:ring-blue-950"
                      )}
                    >
                      {active ? <CheckCircle2 className="size-4" /> : index + 1}
                    </span>
                    <StatusBadge status={status} />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Move this work order to the next shop state.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {actionStatuses.map((status) => (
              <form key={status} action={updateWorkOrderStatusFromForm}>
                <input type="hidden" name="workOrderId" value={workOrder.id} />
                <input type="hidden" name="status" value={status} />
                <Button
                  type="submit"
                  variant={status === workOrder.status ? "secondary" : "outline"}
                  disabled={status === workOrder.status}
                  className="rounded-xl bg-white/70 dark:bg-white/5"
                >
                  {status.replaceAll("_", " ").toLowerCase()}
                </Button>
              </form>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
        <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle>Line items</CardTitle>
            <CardDescription>Labor, services, parts, fees, and discounts.</CardDescription>
          </CardHeader>
          <CardContent>
            {workOrder.lineItems.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrder.lineItems.map((item) => {
                    const quantity = Number(item.quantity)
                    const unitPrice = Number(item.unitPrice)
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-bold">{item.name}</p>
                          {item.description ? (
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          ) : null}
                        </TableCell>
                        <TableCell>{item.type}</TableCell>
                        <TableCell className="text-right">{quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(unitPrice)}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(quantity * unitPrice)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <EmptyState title="No line items" description="Add labor, parts, and services as the job is estimated or approved." />
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
            <CardDescription>Team members currently attached to the job.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {workOrder.assignments.length ? (
              workOrder.assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <p className="font-bold">{assignment.user.name ?? assignment.user.email}</p>
                  <p className="text-sm text-muted-foreground">{assignment.role} · {assignment.user.role}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Assigned {formatDateTime(assignment.assignedAt)}</p>
                </div>
              ))
            ) : (
              <EmptyState icon={UserRound} title="No assignments" description="Technician and advisor assignments will appear here." />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="size-5 text-blue-600" />
              Checklists
            </CardTitle>
            <CardDescription>{checklistCompleted} of {checklistTotal} items complete</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workOrder.checklists.length ? (
              workOrder.checklists.map((checklist) => (
                <div key={checklist.id} className="space-y-2 rounded-2xl border border-border/70 bg-background/70 p-4">
                  <p className="font-bold">{checklist.name}</p>
                  {checklistItems(checklist.items).map((item, index) => (
                    <div key={item.id ?? index} className="flex items-center gap-2 text-sm">
                      <span className={cn("size-2 rounded-full", item.completed ? "bg-emerald-500" : "bg-slate-300")} />
                      <span className={item.completed ? "text-foreground" : "text-muted-foreground"}>
                        {item.label ?? `Checklist item ${index + 1}`}
                      </span>
                      {item.required ? <Badge variant="outline">Required</Badge> : null}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <EmptyState icon={ClipboardCheck} title="No checklists" description="Inspection and QC checklists will appear here." />
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-5 text-blue-600" />
              Parts
            </CardTitle>
            <CardDescription>Reserved, consumed, or released inventory.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {workOrder.partsReserved.length ? (
              workOrder.partsReserved.map((part) => (
                <div key={part.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <p className="font-bold">{part.inventoryItem.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {part.inventoryItem.sku ?? "No SKU"} · Qty {part.quantity}
                  </p>
                  <Badge variant="outline" className="mt-3">{part.status}</Badge>
                </div>
              ))
            ) : (
              <EmptyState icon={Package} title="No parts reserved" description="Parts reservations will appear here." />
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="size-5 text-blue-600" />
              Photos
            </CardTitle>
            <CardDescription>Intake, progress, and completion photo placeholders.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[...workOrder.photos, ...workOrder.attachments.map((attachment) => attachment.url)]
                .slice(0, 6)
                .map((photo, index) => (
                  <div key={`${photo}-${index}`} className="flex aspect-square items-center justify-center rounded-2xl border border-blue-100 bg-blue-50/70 text-center text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
                    Photo {index + 1}
                  </div>
                ))}
              {workOrder.photos.length + workOrder.attachments.length === 0
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 text-center text-xs font-semibold text-blue-600 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-300">
                      Photo slot
                    </div>
                  ))
                : null}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="size-5 text-blue-600" />
              Dispatch & invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm font-bold">Dispatches</p>
              {workOrder.dispatches.length ? (
                workOrder.dispatches.map((dispatch) => (
                  <div key={dispatch.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <StatusBadge status={dispatch.status} />
                    <p className="mt-2 font-bold">{dispatch.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(dispatch.windowStart ?? dispatch.scheduledAt)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {dispatch.driver?.name ?? "Driver unassigned"}
                      {dispatch.vehicle ? ` · ${dispatch.vehicle.name}` : ""}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState icon={Route} title="No dispatches" />
              )}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-bold">Invoices</p>
              {workOrder.invoices.length ? (
                workOrder.invoices.map((invoice) => (
                  <Link key={invoice.id} href={`/invoices/${invoice.id}`} className="block rounded-2xl border border-border/70 bg-background/70 p-4 hover:bg-blue-50/50 dark:hover:bg-blue-950/20">
                    <StatusBadge status={invoice.status} />
                    <p className="mt-2 font-bold">{invoice.number}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {formatCurrency(Number(invoice.amountDue))}
                    </p>
                  </Link>
                ))
              ) : (
                <EmptyState icon={ReceiptText} title="No invoices" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle>Activity feed</CardTitle>
            <CardDescription>System and team updates on this work order.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workOrder.activities.length ? (
              workOrder.activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <span className="mt-1 flex size-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-950" />
                  <div>
                    <p className="text-sm font-semibold">{activity.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.action} · {formatDateTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No activity" description="Status changes and job events will appear here." />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
