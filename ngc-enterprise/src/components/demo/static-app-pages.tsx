"use client"

import Link from "next/link"
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CarFront,
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  FileText,
  Gauge,
  Handshake,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Plus,
  ReceiptText,
  Route,
  Send,
  Sparkles,
  Truck,
  UserCog,
  Users,
  Wrench,
} from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  demoBays,
  demoCommunications,
  demoCustomers,
  demoDispatches,
  demoEstimates,
  demoInventory,
  demoInvoices,
  demoLeads,
  demoLineItems,
  demoLocation,
  demoOrganization,
  demoPriceBookItems,
  demoTaxRate,
  demoTemplates,
  demoUsers,
  demoVehicles,
  demoWorkOrders,
  getDemoCustomer,
  getDemoCustomerByPortalToken,
  getDemoDispatchesForWorkOrder,
  getDemoEquipment,
  getDemoEquipmentForCustomer,
  getDemoEstimatesForCustomer,
  getDemoInvoicesForCustomer,
  getDemoLineItems,
  getDemoUser,
  getDemoWorkOrder,
  getDemoWorkOrdersForCustomer,
} from "@/lib/demo-data"
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils"

const panelClass =
  "border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70"

const activeWorkOrderStatuses = [
  "RECEIVED",
  "DIAGNOSIS",
  "AWAITING_APPROVAL",
  "AWAITING_PARTS",
  "IN_PROGRESS",
  "QUALITY_CHECK",
  "READY_FOR_PICKUP",
  "READY_FOR_DELIVERY",
]

const statusClasses: Record<string, string> = {
  RECEIVED: "border-blue-200 bg-blue-50 text-blue-700",
  DIAGNOSIS: "border-sky-200 bg-sky-50 text-sky-700",
  AWAITING_APPROVAL: "border-amber-200 bg-amber-50 text-amber-700",
  AWAITING_PARTS: "border-orange-200 bg-orange-50 text-orange-700",
  IN_PROGRESS: "border-blue-200 bg-blue-100 text-blue-800",
  QUALITY_CHECK: "border-cyan-200 bg-cyan-50 text-cyan-700",
  READY_FOR_PICKUP: "border-emerald-200 bg-emerald-50 text-emerald-700",
  READY_FOR_DELIVERY: "border-emerald-200 bg-emerald-50 text-emerald-700",
  COMPLETED: "border-emerald-200 bg-emerald-100 text-emerald-800",
  SCHEDULED: "border-blue-200 bg-blue-50 text-blue-700",
  ASSIGNED: "border-sky-200 bg-sky-50 text-sky-700",
  EN_ROUTE: "border-cyan-200 bg-cyan-50 text-cyan-700",
  ARRIVED: "border-amber-200 bg-amber-50 text-amber-700",
  SENT: "border-blue-200 bg-blue-50 text-blue-700",
  VIEWED: "border-sky-200 bg-sky-50 text-sky-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PAID: "border-emerald-200 bg-emerald-100 text-emerald-800",
  PARTIALLY_PAID: "border-cyan-200 bg-cyan-50 text-cyan-700",
  OVERDUE: "border-red-200 bg-red-50 text-red-700",
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
  NEW: "border-blue-200 bg-blue-50 text-blue-700",
  CONTACTED: "border-sky-200 bg-sky-50 text-sky-700",
  QUALIFIED: "border-cyan-200 bg-cyan-50 text-cyan-700",
  ESTIMATE_SENT: "border-amber-200 bg-amber-50 text-amber-700",
  WON: "border-emerald-200 bg-emerald-100 text-emerald-800",
  OPEN: "border-emerald-200 bg-emerald-50 text-emerald-700",
  BUSY: "border-blue-200 bg-blue-50 text-blue-700",
  READY: "border-emerald-200 bg-emerald-50 text-emerald-700",
}

function labelFor(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function StatusPill({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 rounded-full border px-2.5 font-semibold dark:border-white/10 dark:bg-white/10",
        statusClasses[status] ?? "border-slate-200 bg-slate-100 text-slate-700"
      )}
    >
      {labelFor(status)}
    </Badge>
  )
}

function DemoNotice() {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm leading-6 text-blue-800 dark:border-blue-950 dark:bg-blue-950/30 dark:text-blue-100">
      GitHub Pages demo mode: all records below are simulated locally. No API,
      Auth.js, Prisma, cookies, or server actions run on this path.
    </div>
  )
}

function customerName(customerId: string) {
  return getDemoCustomer(customerId)?.displayName ?? "Unknown customer"
}

function equipmentName(equipmentId: string) {
  const equipment = getDemoEquipment(equipmentId)
  if (!equipment) return "Unknown cart"
  return `${equipment.year} ${equipment.make} ${equipment.model}`
}

function WorkOrderCard({ id }: { id: string }) {
  const workOrder = getDemoWorkOrder(id)
  if (!workOrder) return null

  return (
    <Link
      href={`/work-orders/${workOrder.id}`}
      className="block rounded-2xl border border-blue-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-blue-950 dark:bg-slate-950"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
            {workOrder.number}
          </p>
          <h3 className="mt-1 font-bold text-slate-950 dark:text-white">
            {workOrder.title}
          </h3>
        </div>
        <StatusPill status={workOrder.status} />
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
        {customerName(workOrder.customerId)} - {equipmentName(workOrder.equipmentId)}
      </p>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDateTime(workOrder.promisedAt)}</span>
        <span className="font-semibold text-foreground">
          {formatCurrency(workOrder.total)}
        </span>
      </div>
    </Link>
  )
}

function MoneyTable({
  rows,
  type,
}: {
  rows: typeof demoEstimates | typeof demoInvoices
  type: "estimates" | "invoices"
}) {
  return (
    <Card className={panelClass}>
      <CardHeader>
        <CardTitle>{type === "estimates" ? "Estimates" : "Invoices"}</CardTitle>
        <CardDescription>Static NGC financial records</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-semibold">
                  <Link href={`/${type}/${row.id}`} className="text-blue-700">
                    {row.number}
                  </Link>
                </TableCell>
                <TableCell>{customerName(row.customerId)}</TableCell>
                <TableCell>
                  <StatusPill status={row.status} />
                </TableCell>
                <TableCell>{formatDate(row.updatedAt)}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(row.total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function DetailShell({
  backHref,
  backLabel,
  title,
  eyebrow,
  description,
  children,
}: {
  backHref: string
  backLabel: string
  title: string
  eyebrow: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <Link
            href={backHref}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "rounded-xl bg-white/70 dark:bg-white/5"
            )}
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
        }
      />
      {children}
    </div>
  )
}

export function StaticDashboardPage() {
  const activeWork = demoWorkOrders.filter((workOrder) =>
    activeWorkOrderStatuses.includes(workOrder.status)
  )
  const openInvoiceTotal = demoInvoices.reduce(
    (sum, invoice) => sum + invoice.amountDue,
    0
  )
  const todayDispatches = demoDispatches.filter((dispatch) =>
    dispatch.scheduledAt.startsWith("2026-07-13")
  )
  const lithiumPipeline = demoLeads
    .filter((lead) => lead.interest.toLowerCase().includes("lithium"))
    .reduce((sum, lead) => sum + lead.value, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Covington shop command"
        title="Dashboard"
        description="A static but interactive demo snapshot for Neighborhood Golf Carts operations."
        actions={
          <Link
            href="/work-orders"
            className={cn(buttonVariants({ size: "lg" }), "rounded-xl")}
          >
            <Plus className="size-4" />
            Review work
          </Link>
        }
      />
      <DemoNotice />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active work orders" value={activeWork.length} icon={ClipboardList} trend="+3 today" helper="Across intake, bays, QC, and ready lanes" />
        <StatCard label="Open invoice balance" value={formatCurrency(openInvoiceTotal)} icon={DollarSign} helper="Sent, partial, and overdue demo invoices" />
        <StatCard label="Today's dispatches" value={todayDispatches.length} icon={Route} helper="Pickup, delivery, and customer pickup windows" />
        <StatCard label="Lithium pipeline" value={formatCurrency(lithiumPipeline)} icon={Sparkles} trend="High intent" helper="Professional kit opportunities" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className={panelClass}>
          <CardHeader>
            <CardTitle>Shop pulse</CardTitle>
            <CardDescription>Status mix by active work order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeWorkOrderStatuses.map((status) => {
              const count = activeWork.filter((wo) => wo.status === status).length
              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <StatusPill status={status} />
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-blue-50 dark:bg-blue-950">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{ width: `${Math.max(8, count * 24)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className={panelClass}>
          <CardHeader>
            <CardTitle>Priority queue</CardTitle>
            <CardDescription>Jobs most likely to impact promises</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoWorkOrders
              .filter((workOrder) => workOrder.priority <= 2)
              .map((workOrder) => (
                <WorkOrderCard key={workOrder.id} id={workOrder.id} />
              ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export function StaticShopFloorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bay flow"
        title="Shop Floor"
        description="Kanban-style board for Covington intake, diagnosis, parts waits, install work, and QC."
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {demoBays.map((bay) => (
          <Card key={bay.id} className={panelClass}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{bay.name}</CardTitle>
                <StatusPill status={bay.status} />
              </div>
              <CardDescription>
                {bay.currentWorkOrderId
                  ? getDemoWorkOrder(bay.currentWorkOrderId)?.number
                  : "Ready for next cart"}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
      <div className="grid gap-4 lg:grid-cols-4">
        {activeWorkOrderStatuses.map((status) => (
          <section
            key={status}
            className="min-h-72 rounded-[1.5rem] border border-blue-100 bg-blue-50/45 p-3 dark:border-blue-950 dark:bg-blue-950/20"
          >
            <div className="mb-3 flex items-center justify-between">
              <StatusPill status={status} />
              <Badge variant="outline">
                {demoWorkOrders.filter((wo) => wo.status === status).length}
              </Badge>
            </div>
            <div className="space-y-3">
              {demoWorkOrders
                .filter((workOrder) => workOrder.status === status)
                .map((workOrder) => (
                  <WorkOrderCard key={workOrder.id} id={workOrder.id} />
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export function StaticDispatchPage() {
  const pickup = demoDispatches.filter((dispatch) => dispatch.type === "PICKUP")
  const delivery = demoDispatches.filter(
    (dispatch) => dispatch.type === "DELIVERY"
  )
  const boards = [
    { title: "Pickup board", dispatches: pickup, icon: Truck },
    { title: "Delivery board", dispatches: delivery, icon: CarFront },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Routes"
        title="Dispatch"
        description="Pickup, delivery, Southshore fee, and vehicle planning for the static demo."
      />
      <section className="grid gap-4 lg:grid-cols-2">
        {boards.map(({ title, dispatches, icon: Icon }) => (
          <Card key={title} className={panelClass}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="size-5 text-blue-600" />
                {title}
              </CardTitle>
              <CardDescription>Scheduled route cards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dispatches.map((dispatch) => (
                <Link
                  key={dispatch.id}
                  href={`/work-orders/${dispatch.workOrderId}`}
                  className="block rounded-2xl border border-blue-100 bg-white p-4 dark:border-blue-950 dark:bg-slate-950"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold">{customerName(dispatch.customerId)}</div>
                    <StatusPill status={dispatch.status} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatDateTime(dispatch.scheduledAt)} - {dispatch.notes}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">{formatCurrency(dispatch.fee)} fee</Badge>
                    <Badge variant="outline">
                      {demoVehicles.find((vehicle) => vehicle.id === dispatch.vehicleId)?.name ??
                        "Customer pickup"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}

export function StaticDriverPage() {
  const assigned = demoDispatches.filter((dispatch) =>
    ["SCHEDULED", "ASSIGNED", "EN_ROUTE", "ARRIVED"].includes(dispatch.status)
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Driver mode"
        title="Today's route"
        description="Mobile-friendly route list using simulated local data."
      />
      <div className="grid gap-4">
        {assigned.map((dispatch) => {
          const customer = getDemoCustomer(dispatch.customerId)
          const address = customer?.addresses[0]
          return (
            <Card key={dispatch.id} className={panelClass}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>
                    {dispatch.type === "PICKUP" ? "Pickup" : "Delivery"} -{" "}
                    {customer?.displayName}
                  </CardTitle>
                  <StatusPill status={dispatch.status} />
                </div>
                <CardDescription>{formatDateTime(dispatch.scheduledAt)}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <MapPin className="size-4 text-blue-600" />
                    {address?.line1}, {address?.city}, {address?.state}{" "}
                    {address?.postalCode}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="size-4 text-blue-600" />
                    {customer?.phone}
                  </p>
                  <p className="text-muted-foreground">{dispatch.notes}</p>
                </div>
                <Link
                  href={`/work-orders/${dispatch.workOrderId}`}
                  className={cn(buttonVariants({ size: "lg" }), "rounded-xl")}
                >
                  Open work order
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export function StaticCustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM"
        title="Customers"
        description="Eight demo customer profiles with carts, addresses, and portal tokens."
      />
      <Card className={panelClass}>
        <CardHeader>
          <CardTitle>Customer list</CardTitle>
          <CardDescription>Click a customer to open the static detail page.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Lifetime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-semibold">
                    <Link href={`/customers/${customer.id}`} className="text-blue-700">
                      {customer.displayName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>{customer.phone}</div>
                    <div className="text-xs text-muted-foreground">{customer.email}</div>
                  </TableCell>
                  <TableCell>{getDemoEquipmentForCustomer(customer.id).length} carts</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(customer.lifetimeValue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export function StaticCustomerDetailPage({ id }: { id: string }) {
  const customer = getDemoCustomer(id)
  if (!customer) {
    return <EmptyState title="Demo customer not found" description={id} />
  }

  const workOrders = getDemoWorkOrdersForCustomer(id)
  const estimates = getDemoEstimatesForCustomer(id)
  const invoices = getDemoInvoicesForCustomer(id)
  const equipment = getDemoEquipmentForCustomer(id)

  return (
    <DetailShell
      backHref="/customers"
      backLabel="Customers"
      eyebrow="CRM profile"
      title={customer.displayName}
      description={customer.companyName ?? customer.email}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Lifetime value" value={formatCurrency(customer.lifetimeValue)} icon={DollarSign} />
        <StatCard label="Open work" value={workOrders.filter((wo) => activeWorkOrderStatuses.includes(wo.status)).length} icon={Wrench} />
        <StatCard label="Equipment" value={equipment.length} icon={CarFront} />
      </section>
      <Tabs defaultValue="overview" className="gap-5">
        <TabsList className="w-full justify-start overflow-x-auto rounded-2xl bg-blue-50/80 p-1 dark:bg-blue-950/30">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="work">Work orders</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="grid gap-6 lg:grid-cols-2">
          <Card className={panelClass}>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="flex items-center gap-2"><Phone className="size-4 text-blue-600" />{customer.phone}</p>
              <p className="flex items-center gap-2"><Mail className="size-4 text-blue-600" />{customer.email}</p>
              <p className="flex items-center gap-2"><MapPin className="size-4 text-blue-600" />{customer.addresses[0].line1}, {customer.addresses[0].city}, {customer.addresses[0].state}</p>
              <p className="font-mono text-xs text-muted-foreground">Portal token: {customer.portalToken}</p>
            </CardContent>
          </Card>
          <Card className={panelClass}>
            <CardHeader>
              <CardTitle>Equipment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {equipment.map((cart) => (
                <div key={cart.id} className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-950 dark:bg-blue-950/20">
                  <div className="font-semibold">{cart.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {cart.year} {cart.make} {cart.model} - {cart.batteryVoltage} {cart.powertrain}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="work" className="grid gap-3">
          {workOrders.map((workOrder) => (
            <WorkOrderCard key={workOrder.id} id={workOrder.id} />
          ))}
        </TabsContent>
        <TabsContent value="billing" className="grid gap-6 lg:grid-cols-2">
          <MoneyTable rows={estimates} type="estimates" />
          <MoneyTable rows={invoices} type="invoices" />
        </TabsContent>
      </Tabs>
    </DetailShell>
  )
}

export function StaticWorkOrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Service"
        title="Work Orders"
        description="Ten work orders spanning intake, diagnosis, approvals, parts waits, bay work, QC, ready lanes, and completion."
      />
      <Card className={panelClass}>
        <CardHeader>
          <CardTitle>All work orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>WO</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Cart</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Promise</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoWorkOrders.map((workOrder) => (
                <TableRow key={workOrder.id}>
                  <TableCell className="font-semibold">
                    <Link href={`/work-orders/${workOrder.id}`} className="text-blue-700">
                      {workOrder.number}
                    </Link>
                  </TableCell>
                  <TableCell>{customerName(workOrder.customerId)}</TableCell>
                  <TableCell>{equipmentName(workOrder.equipmentId)}</TableCell>
                  <TableCell><StatusPill status={workOrder.status} /></TableCell>
                  <TableCell>{formatDateTime(workOrder.promisedAt)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(workOrder.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export function StaticWorkOrderDetailPage({ id }: { id: string }) {
  const workOrder = getDemoWorkOrder(id)
  if (!workOrder) return <EmptyState title="Demo work order not found" description={id} />

  const customer = getDemoCustomer(workOrder.customerId)
  const equipment = getDemoEquipment(workOrder.equipmentId)
  const assigned = getDemoUser(workOrder.assignedUserId)
  const dispatches = getDemoDispatchesForWorkOrder(workOrder.id)
  const lineItems = getDemoLineItems(workOrder.id)

  return (
    <DetailShell
      backHref="/work-orders"
      backLabel="Work orders"
      eyebrow="Work order"
      title={`${workOrder.number} - ${workOrder.title}`}
      description={`${customer?.displayName} / ${equipmentName(workOrder.equipmentId)}`}
    >
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Status" value={<StatusPill status={workOrder.status} />} icon={Gauge} />
        <StatCard label="Promise" value={formatDate(workOrder.promisedAt)} icon={Clock} />
        <StatCard label="Assigned" value={assigned?.name ?? "Unassigned"} icon={UserCog} />
        <StatCard label="Total" value={formatCurrency(workOrder.total)} icon={DollarSign} />
      </section>
      <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <Card className={panelClass}>
          <CardHeader>
            <CardTitle>Concern and checklist</CardTitle>
            <CardDescription>{workOrder.concern}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {workOrder.checklist.map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-2xl bg-blue-50/60 px-3 py-2 text-sm dark:bg-blue-950/20">
                <CheckCircle2 className="size-4 text-blue-600" />
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className={panelClass}>
          <CardHeader>
            <CardTitle>Customer and cart</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="font-semibold">{customer?.displayName}</p>
            <p className="text-muted-foreground">{customer?.phone} / {customer?.email}</p>
            <p>{equipment?.year} {equipment?.make} {equipment?.model}</p>
            <p className="text-muted-foreground">{equipment?.batteryVoltage} {equipment?.powertrain}</p>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <Card className={panelClass}>
          <CardHeader><CardTitle>Line items</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className={panelClass}>
          <CardHeader><CardTitle>Dispatch</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {dispatches.length ? dispatches.map((dispatch) => (
              <div key={dispatch.id} className="rounded-2xl border border-blue-100 p-4 dark:border-blue-950">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{labelFor(dispatch.type)}</span>
                  <StatusPill status={dispatch.status} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(dispatch.scheduledAt)} - {dispatch.notes}</p>
              </div>
            )) : <EmptyState title="No dispatches" description="This demo job has no route events yet." />}
          </CardContent>
        </Card>
      </section>
    </DetailShell>
  )
}

export function StaticEstimatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Revenue" title="Estimates" description="Demo estimates for lithium approvals and repair authorizations." />
      <MoneyTable rows={demoEstimates} type="estimates" />
    </div>
  )
}

export function StaticEstimateDetailPage({ id }: { id: string }) {
  const estimate = demoEstimates.find((item) => item.id === id)
  if (!estimate) return <EmptyState title="Demo estimate not found" description={id} />

  return (
    <DetailShell
      backHref="/estimates"
      backLabel="Estimates"
      eyebrow="Estimate"
      title={estimate.number}
      description={`${customerName(estimate.customerId)} - expires ${formatDate(estimate.expiresAt)}`}
    >
      <DocumentDetail status={estimate.status} rows={estimate.lineItems} subtotal={estimate.subtotal} tax={estimate.tax} total={estimate.total} />
    </DetailShell>
  )
}

export function StaticInvoicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Billing" title="Invoices" description="Static invoice board with paid, partial, sent, and overdue examples." />
      <MoneyTable rows={demoInvoices} type="invoices" />
    </div>
  )
}

export function StaticInvoiceDetailPage({ id }: { id: string }) {
  const invoice = demoInvoices.find((item) => item.id === id)
  if (!invoice) return <EmptyState title="Demo invoice not found" description={id} />

  return (
    <DetailShell
      backHref="/invoices"
      backLabel="Invoices"
      eyebrow="Invoice"
      title={invoice.number}
      description={`${customerName(invoice.customerId)} - due ${formatDate(invoice.dueDate)}`}
    >
      <DocumentDetail status={invoice.status} rows={invoice.lineItems} subtotal={invoice.subtotal} tax={invoice.tax} total={invoice.total} amountDue={invoice.amountDue} />
    </DetailShell>
  )
}

function DocumentDetail({
  status,
  rows,
  subtotal,
  tax,
  total,
  amountDue,
}: {
  status: string
  rows: typeof demoLineItems
  subtotal: number
  tax: number
  total: number
  amountDue?: number
}) {
  return (
    <Card className={panelClass}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Line items</CardTitle>
          <StatusPill status={status} />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.description}</TableCell>
                <TableCell className="text-right">{row.quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.unitPrice)}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(row.total)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} className="text-right">Subtotal</TableCell>
              <TableCell className="text-right">{formatCurrency(subtotal)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} className="text-right">Tax</TableCell>
              <TableCell className="text-right">{formatCurrency(tax)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(total)}</TableCell>
            </TableRow>
            {amountDue !== undefined ? (
              <TableRow>
                <TableCell colSpan={3} className="text-right font-bold">Amount due</TableCell>
                <TableCell className="text-right font-bold text-blue-700">{formatCurrency(amountDue)}</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function StaticLeadsPage() {
  return <SimpleTablePage eyebrow="Growth" title="Leads" description="Lithium and service leads in a static pipeline." icon={Handshake} rows={demoLeads.map((lead) => [lead.name, lead.source, <StatusPill key={lead.id} status={lead.status} />, lead.interest, formatCurrency(lead.value), lead.nextStep])} headers={["Name", "Source", "Status", "Interest", "Value", "Next step"]} />
}

export function StaticPriceBookPage() {
  return <SimpleTablePage eyebrow="Catalog" title="Price Book" description={`Tax rate ${(demoTaxRate * 100).toFixed(1)}%. Diagnostic minimum is fixed at $179; lithium SKUs are Professional kits only.`} icon={BookOpen} rows={demoPriceBookItems.map((item) => [item.sku, item.name, item.category, formatCurrency(item.price), item.taxable ? "Taxable" : "Non-taxable", item.active ? "Active" : "Inactive"])} headers={["SKU", "Name", "Category", "Price", "Tax", "State"]} />
}

export function StaticInventoryPage() {
  return <SimpleTablePage eyebrow="Parts" title="Inventory" description="On-hand and reserved demo stock, highlighting lithium kit availability." icon={Package} rows={demoInventory.map((item) => [item.sku, item.name, item.category, item.onHand, item.reserved, item.onHand - item.reserved <= item.reorderPoint ? <Badge key={item.id} variant="destructive">Reorder</Badge> : <Badge key={item.id} variant="outline">Healthy</Badge>])} headers={["SKU", "Item", "Category", "On hand", "Reserved", "Signal"]} />
}

function SimpleTablePage({
  eyebrow,
  title,
  description,
  icon: Icon,
  headers,
  rows,
}: {
  eyebrow: string
  title: string
  description: string
  icon: typeof Users
  headers: string[]
  rows: Array<Array<React.ReactNode>>
}) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <Card className={panelClass}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="size-5 text-blue-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>{headers.map((header) => <TableHead key={header}>{header}</TableHead>)}</TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export function StaticSchedulePage() {
  const schedule = [...demoWorkOrders, ...demoDispatches].sort((a, b) => {
    const first = "scheduledStart" in a ? a.scheduledStart : a.scheduledAt
    const second = "scheduledStart" in b ? b.scheduledStart : b.scheduledAt
    return first.localeCompare(second)
  })

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Calendar" title="Schedule" description="Shop starts and route windows from the demo dataset." />
      <div className="grid gap-3">
        {schedule.map((item) => {
          const isWorkOrder = "number" in item
          return (
            <Card key={item.id} className={panelClass}>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-bold">
                    {isWorkOrder ? item.number : labelFor(item.type)} - {isWorkOrder ? item.title : customerName(item.customerId)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(isWorkOrder ? item.scheduledStart : item.scheduledAt)}
                  </p>
                </div>
                <StatusPill status={item.status} />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export function StaticReportsPage() {
  const revenue = demoInvoices.reduce((sum, invoice) => sum + invoice.total, 0)
  const paid = demoInvoices.reduce((sum, invoice) => sum + invoice.amountPaid, 0)
  const estimatePipeline = demoEstimates.reduce((sum, estimate) => sum + estimate.total, 0)

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Analytics" title="Reports" description="Demo KPIs for revenue, pipeline, shop load, and lead source mix." />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Invoice revenue" value={formatCurrency(revenue)} icon={ReceiptText} />
        <StatCard label="Paid cash" value={formatCurrency(paid)} icon={DollarSign} />
        <StatCard label="Estimate pipeline" value={formatCurrency(estimatePipeline)} icon={FileText} />
      </section>
      <Card className={panelClass}>
        <CardHeader>
          <CardTitle>Lead source mix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {["Website", "Referral", "Facebook", "Google", "Walk-in"].map((source) => {
            const count = demoLeads.filter((lead) => lead.source === source).length
            return (
              <div key={source}>
                <div className="mb-1 flex justify-between text-sm"><span>{source}</span><span>{count}</span></div>
                <div className="h-3 rounded-full bg-blue-50 dark:bg-blue-950"><div className="h-3 rounded-full bg-blue-600" style={{ width: `${count * 20}%` }} /></div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

export function StaticTeamPage() {
  return <SimpleTablePage eyebrow="Team" title="Team" description="Demo accounts match the static login quick-fill roles." icon={UserCog} headers={["Name", "Email", "Role", "Status"]} rows={demoUsers.map((user) => [user.name, user.email, labelFor(user.role), user.active ? <Badge key={user.id}>Active</Badge> : "Inactive"])} />
}

export function StaticSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="System" title="Settings" description="Static organization settings for Neighborhood Golf Carts." />
      <Tabs defaultValue="company" orientation="vertical" className="grid gap-5 lg:grid-cols-[18rem_1fr]">
        <TabsList className="h-fit w-full flex-col items-stretch rounded-[2rem] border bg-card p-2 shadow-sm">
          {["company", "location", "policies"].map((tab) => (
            <TabsTrigger key={tab} value={tab} className="justify-start capitalize">{tab}</TabsTrigger>
          ))}
        </TabsList>
        <div className="space-y-5">
          <TabsContent value="company"><SettingsCard title="Company" rows={[["Name", demoOrganization.name], ["Phone", demoOrganization.phone], ["Email", demoOrganization.email], ["Tax rate", `${(demoOrganization.taxRate * 100).toFixed(1)}%`]]} /></TabsContent>
          <TabsContent value="location"><SettingsCard title="Location" rows={[["Shop", demoLocation.name], ["Address", `${demoLocation.addressLine1}, ${demoLocation.addressLine2}`], ["City", `${demoLocation.city}, ${demoLocation.state} ${demoLocation.postalCode}`]]} /></TabsContent>
          <TabsContent value="policies"><SettingsCard title="Policies" rows={[["Service model", "Shop-only; no mobile service"], ["Diagnostic", "$179 minimum"], ["Pickup/delivery", "Free within 40 mi Northshore; $99 outside 40 mi or Southshore"], ["Lithium", "Professional Kits only"]]} /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

function SettingsCard({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <Card className={panelClass}>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 rounded-2xl bg-blue-50/50 px-4 py-3 text-sm dark:bg-blue-950/20">
            <span className="font-semibold">{label}</span>
            <span className="text-right text-muted-foreground">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function StaticCommunicationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Messages" title="Communications" description="Customer touchpoints and reusable templates for the static demo." />
      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card className={panelClass}>
          <CardHeader><CardTitle>Recent messages</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {demoCommunications.map((message) => (
              <div key={message.id} className="rounded-2xl border border-blue-100 p-4 dark:border-blue-950">
                <div className="flex items-center justify-between gap-2"><strong>{customerName(message.customerId)}</strong><Badge variant="outline">{message.channel}</Badge></div>
                <p className="mt-2 text-sm font-semibold">{message.subject}</p>
                <p className="text-sm text-muted-foreground">{message.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className={panelClass}>
          <CardHeader><CardTitle>Templates</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {demoTemplates.map((template) => (
              <div key={template.id} className="rounded-2xl bg-blue-50/50 p-4 dark:bg-blue-950/20">
                <div className="font-semibold">{template.name}</div>
                <p className="mt-1 text-sm text-muted-foreground">{template.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export function StaticMarketingPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Growth" title="Marketing" description="Demo campaign view focused on Professional lithium conversions." />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Lithium leads" value={demoLeads.filter((lead) => lead.interest.toLowerCase().includes("lithium")).length} icon={Sparkles} trend="This week" />
        <StatCard label="Pipeline" value={formatCurrency(demoLeads.reduce((sum, lead) => sum + lead.value, 0))} icon={BarChart3} />
        <StatCard label="Templates ready" value={demoTemplates.length} icon={MessageSquare} />
      </section>
      <Card className={panelClass}>
        <CardHeader><CardTitle>30-day lithium push</CardTitle><CardDescription>Static campaign checklist</CardDescription></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {["Post before/after conversion carousel", "Call viewed estimates within 24 hours", "Text Professional kit savings proof", "Feature Covington shop-only turnaround"].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-2xl bg-blue-50/60 p-3 text-sm dark:bg-blue-950/20"><CheckCircle2 className="size-4 text-blue-600" />{item}</div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function StaticPortalPage({ token }: { token: string }) {
  const customer = getDemoCustomerByPortalToken(token)
  if (!customer) {
    return (
      <main className="min-h-svh bg-blue-50 p-6">
        <EmptyState title="Demo portal not found" description="Use token demo-portal for the static customer portal." />
      </main>
    )
  }

  const workOrder = getDemoWorkOrdersForCustomer(customer.id)[0]
  const estimates = getDemoEstimatesForCustomer(customer.id)
  const invoices = getDemoInvoicesForCustomer(customer.id)

  return (
    <main className="min-h-svh bg-[linear-gradient(135deg,#eff6ff,#ffffff_46%,#e0f2fe)] text-slate-950 dark:bg-[linear-gradient(135deg,#071827,#0c1728)] dark:text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center justify-between rounded-full bg-white/80 px-4 py-3 shadow-sm ring-1 ring-blue-100 backdrop-blur dark:bg-white/10 dark:ring-white/10">
          <Link href="/" className="flex items-center gap-2 font-black">
            <span className="flex size-9 items-center justify-center rounded-full bg-blue-600 text-white"><Sparkles className="size-4" /></span>
            NGC Enterprise Portal
          </Link>
          <span className="hidden text-sm font-semibold text-slate-600 dark:text-slate-300 sm:inline">{demoOrganization.phone}</span>
        </nav>
        <section className="rounded-[2rem] bg-white/86 p-6 shadow-xl shadow-blue-950/5 ring-1 ring-blue-100 backdrop-blur dark:bg-white/10 dark:ring-white/10 md:p-8">
          <Badge className="mb-5 bg-blue-100 text-blue-700">Static customer portal</Badge>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">Hi, {customer.displayName}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Track repair status, approve estimates, pay invoices, and request follow-up from the GitHub Pages demo.</p>
        </section>
        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <Card className="bg-white/90 dark:bg-white/10">
            <CardHeader>
              <CardTitle>{workOrder?.number} - {workOrder?.title}</CardTitle>
              <CardDescription>{workOrder?.concern}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {workOrder ? <StatusPill status={workOrder.status} /> : null}
              <div className="grid gap-2 sm:grid-cols-2">
                {activeWorkOrderStatuses.map((status) => (
                  <div key={status} className={cn("rounded-2xl border p-3 text-sm", workOrder?.status === status ? "border-blue-500 bg-blue-50 text-blue-800" : "border-slate-200 bg-white/60 text-slate-500")}>{labelFor(status)}</div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 dark:bg-white/10">
            <CardHeader><CardTitle>Open items</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {estimates.map((estimate) => <Link key={estimate.id} href={`/estimates/${estimate.id}`} className="block rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-800">{estimate.number}: {formatCurrency(estimate.total)}</Link>)}
              {invoices.map((invoice) => <Link key={invoice.id} href={`/invoices/${invoice.id}`} className="block rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{invoice.number}: {formatCurrency(invoice.amountDue)} due</Link>)}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}

export function StaticBookPage() {
  return (
    <main className="min-h-svh bg-[linear-gradient(135deg,#eff6ff,#ffffff,#e0f2fe)] px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          eyebrow="Static booking"
          title="Request NGC service"
          description="Demo-only form. No request is submitted from GitHub Pages."
          actions={<Link href="/portal/demo-portal" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-xl bg-white/70")}>View demo portal</Link>}
        />
        <Card className="border-blue-100 bg-white/88 shadow-xl shadow-blue-950/5">
          <CardHeader>
            <CardTitle>Tell us about your cart</CardTitle>
            <CardDescription>Neighborhood Golf Carts is shop-only at 71363 Thelma Ln, Suite E, Covington.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Name</Label><Input placeholder="Your name" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input placeholder="985-402-1206" /></div>
            </div>
            <div className="space-y-2"><Label>Service needed</Label><Textarea placeholder="Diagnostic, repair, lithium conversion..." /></div>
            <div className="rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-800">
              Diagnostic minimum is {formatCurrency(179)}. Pickup/delivery is free within 40 miles on the Northshore and {formatCurrency(99)} outside 40 miles or Southshore.
            </div>
            <button className={cn(buttonVariants({ size: "lg" }), "rounded-xl")}>
              <Send className="size-4" />
              Demo request only
            </button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export function StaticCustomerNewPage() {
  return <StaticBookPage />
}

export function StaticWorkOrderNewPage() {
  return <StaticBookPage />
}

export function StaticEstimateNewPage() {
  return <StaticBookPage />
}
