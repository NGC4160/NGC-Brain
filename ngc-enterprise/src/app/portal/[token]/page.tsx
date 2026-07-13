import Link from "next/link"
import { notFound } from "next/navigation"
import {
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  FileText,
  MapPin,
  PackageCheck,
  Sparkles,
  Truck,
  Wrench,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/db"
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils"

type PortalParams = Promise<{ token: string }>

const tracker = [
  { key: "RECEIVED", label: "Received", icon: PackageCheck },
  { key: "DIAGNOSIS", label: "Diagnosis", icon: Wrench },
  { key: "AWAITING_APPROVAL", label: "Approval", icon: FileText },
  { key: "AWAITING_PARTS", label: "Parts", icon: Truck },
  { key: "IN_PROGRESS", label: "Repair", icon: Wrench },
  { key: "QUALITY_CHECK", label: "QC", icon: ClipboardCheck },
  { key: "READY_FOR_PICKUP", label: "Ready", icon: CheckCircle2 },
]

function trackerIndex(status?: string | null) {
  if (!status) return 0
  if (status === "READY_FOR_DELIVERY") return tracker.length - 1
  if (["COMPLETED", "DELIVERED", "PICKED_UP"].includes(status)) {
    return tracker.length
  }
  const index = tracker.findIndex((step) => step.key === status)
  return index === -1 ? 0 : index
}

export default async function CustomerPortalPage({
  params,
}: {
  params: PortalParams
}) {
  const { token } = await params
  if (!token) notFound()

  const customer = await prisma.customer.findUnique({
    where: { portalToken: token },
    include: {
      organization: {
        select: { name: true, phone: true, email: true, primaryColor: true },
      },
      workOrders: {
        include: {
          equipment: { select: { year: true, make: true, model: true, name: true } },
          dispatches: {
            orderBy: { scheduledAt: "desc" },
            include: { address: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
      },
      estimates: {
        orderBy: { updatedAt: "desc" },
        take: 5,
      },
      invoices: {
        orderBy: { updatedAt: "desc" },
        take: 5,
      },
      addresses: {
        where: { isPrimary: true },
        take: 1,
      },
    },
  })

  if (!customer) notFound()

  const currentWorkOrder = customer.workOrders[0]
  const currentIndex = trackerIndex(currentWorkOrder?.status)
  const activeEstimates = customer.estimates.filter((estimate) =>
    ["SENT", "VIEWED"].includes(estimate.status)
  )
  const openInvoices = customer.invoices.filter((invoice) =>
    ["SENT", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status)
  )
  const primaryAddress = customer.addresses[0]

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.20),transparent_24rem),linear-gradient(135deg,#eff6ff,#ffffff_46%,#e0f2fe)] text-slate-950 dark:bg-[linear-gradient(135deg,#071827,#0c1728)] dark:text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center justify-between rounded-full bg-white/80 px-4 py-3 shadow-sm ring-1 ring-blue-100 backdrop-blur dark:bg-white/10 dark:ring-white/10">
          <Link href="/" className="flex items-center gap-2 font-black">
            <span className="flex size-9 items-center justify-center rounded-full bg-blue-600 text-white">
              <Sparkles className="size-4" />
            </span>
            NGC Enterprise Portal
          </Link>
          <span className="hidden text-sm font-semibold text-slate-600 dark:text-slate-300 sm:inline">
            {customer.organization.phone ?? customer.organization.email ?? "Customer care"}
          </span>
        </nav>

        <section className="overflow-hidden rounded-[2rem] bg-white/86 p-6 shadow-xl shadow-blue-950/5 ring-1 ring-blue-100 backdrop-blur dark:bg-white/10 dark:ring-white/10 md:p-8">
          <Badge className="mb-5 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
            Repair tracker
          </Badge>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                Hi, {customer.displayName}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Track repair status, approve estimates, pay invoices, and request
                pickup or delivery from your customer portal.
              </p>
            </div>
            <div className="rounded-3xl bg-blue-50 p-4 dark:bg-blue-950/40">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-200">
                Current job
              </p>
              <p className="mt-2 text-2xl font-black">
                {currentWorkOrder?.number ?? "No open repair"}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {currentWorkOrder?.title ?? "You are all caught up"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-white/86 p-5 shadow-sm ring-1 ring-blue-100 backdrop-blur dark:bg-white/10 dark:ring-white/10">
          <div className="grid gap-4 md:grid-cols-7">
            {tracker.map((step, index) => {
              const Icon = step.icon
              const complete = index < currentIndex
              const active = index === currentIndex

              return (
                <div key={step.key} className="relative">
                  {index < tracker.length - 1 ? (
                    <div
                      className={cn(
                        "absolute left-8 right-[-1rem] top-6 hidden h-1 rounded-full md:block",
                        index < currentIndex ? "bg-blue-600" : "bg-blue-100"
                      )}
                    />
                  ) : null}
                  <div className="relative flex flex-row items-center gap-3 md:flex-col md:text-center">
                    <div
                      className={cn(
                        "flex size-12 items-center justify-center rounded-2xl shadow-sm ring-4 ring-white dark:ring-slate-950",
                        complete || active
                          ? "bg-blue-600 text-white"
                          : "bg-blue-50 text-blue-300 dark:bg-blue-950"
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-sm font-black",
                          active && "text-blue-700 dark:text-blue-200"
                        )}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-slate-500">
                        {complete ? "Complete" : active ? "Now" : "Next"}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <Card className="rounded-[2rem] border-blue-100 bg-white/86 shadow-sm dark:border-blue-900 dark:bg-white/10">
              <CardHeader>
                <CardTitle>Repair details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer.workOrders.length ? (
                  customer.workOrders.map((workOrder) => {
                    const equipment = workOrder.equipment
                    const equipmentLabel = equipment
                      ? [equipment.year, equipment.make, equipment.model]
                          .filter(Boolean)
                          .join(" ") || equipment.name
                      : "Cart details pending"

                    return (
                      <div key={workOrder.id} className="rounded-3xl border bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-mono text-xs font-bold text-blue-700 dark:text-blue-200">
                              {workOrder.number}
                            </p>
                            <h2 className="mt-1 text-lg font-black">
                              {workOrder.title}
                            </h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                              {equipmentLabel}
                            </p>
                          </div>
                          <Badge className="w-fit bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                            {workOrder.status.replaceAll("_", " ")}
                          </Badge>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl bg-white/80 p-3 dark:bg-white/10">
                            <p className="text-xs text-slate-500">Promised</p>
                            <p className="font-bold">{formatDate(workOrder.promisedDate)}</p>
                          </div>
                          <div className="rounded-2xl bg-white/80 p-3 dark:bg-white/10">
                            <p className="text-xs text-slate-500">Total</p>
                            <p className="font-bold">{formatCurrency(Number(workOrder.grandTotal))}</p>
                          </div>
                          <div className="rounded-2xl bg-white/80 p-3 dark:bg-white/10">
                            <p className="text-xs text-slate-500">Updated</p>
                            <p className="font-bold">{formatDateTime(workOrder.updatedAt)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    No current repairs are linked to this portal.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="rounded-[2rem] border-blue-100 bg-white/86 shadow-sm dark:border-blue-900 dark:bg-white/10">
                <CardHeader>
                  <CardTitle>Estimates to approve</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeEstimates.length ? (
                    activeEstimates.map((estimate) => (
                      <div key={estimate.id} className="rounded-3xl border bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold">{estimate.title}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {estimate.number} • expires {formatDate(estimate.expiresAt)}
                            </p>
                          </div>
                          <p className="font-black">{formatCurrency(Number(estimate.grandTotal))}</p>
                        </div>
                        <Button className="mt-4 w-full rounded-full">
                          Approve estimate
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      No estimates are waiting for approval.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-blue-100 bg-white/86 shadow-sm dark:border-blue-900 dark:bg-white/10">
                <CardHeader>
                  <CardTitle>Invoices to pay</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {openInvoices.length ? (
                    openInvoices.map((invoice) => (
                      <div key={invoice.id} className="rounded-3xl border bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold">Invoice {invoice.number}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              Due {formatDate(invoice.dueAt)} • {invoice.status.toLowerCase()}
                            </p>
                          </div>
                          <p className="font-black">{formatCurrency(Number(invoice.amountDue))}</p>
                        </div>
                        <Button className="mt-4 w-full rounded-full">
                          <CreditCard className="size-4" />
                          Pay invoice
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      No open invoices are due.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <aside className="space-y-6">
            <Card className="rounded-[2rem] border-blue-100 bg-white/86 shadow-sm dark:border-blue-900 dark:bg-white/10">
              <CardHeader>
                <CardTitle>Pickup / delivery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-3xl bg-blue-50/70 p-4 dark:bg-blue-950/20">
                  <Truck className="size-7 text-blue-600 dark:text-blue-200" />
                  <p className="mt-3 font-black">Need a cart moved?</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Request a pickup or delivery window and the shop will confirm
                    route availability.
                  </p>
                </div>
                <Button className="w-full rounded-full">Request pickup</Button>
                <Button variant="outline" className="w-full rounded-full">
                  Request delivery
                </Button>
                {primaryAddress ? (
                  <p className="flex gap-2 rounded-3xl border bg-white/60 p-4 text-sm text-slate-600 dark:bg-white/10 dark:text-slate-300">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-blue-600" />
                    {[primaryAddress.address1, primaryAddress.city, primaryAddress.state, primaryAddress.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-blue-100 bg-white/86 shadow-sm dark:border-blue-900 dark:bg-white/10">
              <CardHeader>
                <CardTitle>Contact the shop</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p className="font-bold text-slate-950 dark:text-white">
                  {customer.organization.name}
                </p>
                <p>{customer.organization.phone ?? "Phone not set"}</p>
                <p>{customer.organization.email ?? "Email not set"}</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  )
}
