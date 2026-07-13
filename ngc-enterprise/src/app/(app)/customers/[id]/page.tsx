import { StaticCustomerDetailPage } from "@/components/demo/static-app-pages"
import { demoCustomers } from "@/lib/demo-data"
import { isStaticExport } from "@/lib/static"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  CarFront,
  FileText,
  Mail,
  MapPin,
  Phone,
  Plus,
  ReceiptText,
  StickyNote,
  UserRound,
  Wrench,
} from "lucide-react"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils"


export function generateStaticParams() {
  if (!isStaticExport()) return []

  return demoCustomers.map((customer) => ({ id: customer.id }))
}

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params

  if (isStaticExport()) {
    return <StaticCustomerDetailPage id={id} />
  }

  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return (
      <EmptyState
        title="No organization attached"
        description="Customer profiles require an organization-scoped session."
      />
    )
  }

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId },
    include: {
      contacts: { orderBy: [{ isPrimary: "desc" }, { firstName: "asc" }] },
      addresses: { orderBy: [{ isPrimary: "desc" }, { label: "asc" }] },
      equipment: { orderBy: [{ updatedAt: "desc" }, { name: "asc" }] },
      workOrders: {
        include: {
          bay: { select: { name: true } },
          equipment: { select: { name: true, make: true, model: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 30,
      },
      estimates: { orderBy: { updatedAt: "desc" }, take: 20 },
      invoices: {
        include: { workOrder: { select: { id: true, number: true } } },
        orderBy: { updatedAt: "desc" },
        take: 20,
      },
      communications: { orderBy: { createdAt: "desc" }, take: 25 },
    },
  })

  if (!customer) {
    notFound()
  }

  const openWorkOrders = customer.workOrders.filter(
    (workOrder) =>
      !["COMPLETED", "DELIVERED", "PICKED_UP", "CANCELLED"].includes(
        workOrder.status
      )
  ).length
  const invoiceBalance = customer.invoices.reduce(
    (sum, invoice) => sum + Number(invoice.amountDue),
    0
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM profile"
        title={customer.displayName}
        description={
          customer.companyName ??
          customer.email ??
          customer.phone ??
          "Full customer service profile"
        }
        actions={
          <>
            <Link
              href="/customers"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-xl bg-white/70 dark:bg-white/5")}
            >
              <ArrowLeft className="size-4" />
              Customers
            </Link>
            <Link
              href={`/work-orders/new?customerId=${customer.id}`}
              className={cn(buttonVariants({ size: "lg" }), "rounded-xl shadow-sm shadow-blue-600/20")}
            >
              <Plus className="size-4" />
              New work order
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Lifetime value"
          value={formatCurrency(Number(customer.lifetimeValue))}
          helper="Stored CRM value"
        />
        <StatCard label="Open work orders" value={openWorkOrders} icon={Wrench} />
        <StatCard label="Equipment" value={customer.equipment.length} icon={CarFront} />
        <StatCard
          label="Invoice balance"
          value={formatCurrency(invoiceBalance)}
          icon={ReceiptText}
        />
      </section>

      <Tabs defaultValue="overview" className="gap-5">
        <TabsList className="w-full justify-start overflow-x-auto rounded-2xl bg-blue-50/80 p-1 dark:bg-blue-950/30">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="work">Work orders</TabsTrigger>
          <TabsTrigger value="estimates">Estimates</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-6 xl:grid-cols-3">
          <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="size-5 text-blue-600" />
                Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.contacts.length ? (
                customer.contacts.map((contact) => (
                  <div key={contact.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">
                          {contact.firstName} {contact.lastName ?? ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {contact.role ?? "Contact"}
                        </p>
                      </div>
                      {contact.isPrimary ? (
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                          Primary
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                      {contact.email ? (
                        <p className="flex items-center gap-2">
                          <Mail className="size-4" />
                          {contact.email}
                        </p>
                      ) : null}
                      {contact.phone ? (
                        <p className="flex items-center gap-2">
                          <Phone className="size-4" />
                          {contact.phone}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No contacts" description="Primary contacts will appear here." />
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-5 text-blue-600" />
                Addresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.addresses.length ? (
                customer.addresses.map((address) => (
                  <div key={address.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Badge variant="outline">{address.label}</Badge>
                      {address.isBilling ? <Badge variant="outline">Billing</Badge> : null}
                      {address.isPrimary ? <Badge variant="outline">Primary</Badge> : null}
                    </div>
                    <p className="font-semibold">{address.address1}</p>
                    {address.address2 ? <p>{address.address2}</p> : null}
                    <p className="text-sm text-muted-foreground">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState title="No addresses" description="Billing and dispatch addresses will appear here." />
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CarFront className="size-5 text-blue-600" />
                Equipment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.equipment.length ? (
                customer.equipment.map((equipment) => (
                  <div key={equipment.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <p className="font-bold">{equipment.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {[equipment.year, equipment.make, equipment.model]
                        .filter(Boolean)
                        .join(" ") || "Golf cart"}
                    </p>
                    {equipment.serialNumber ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Serial: {equipment.serialNumber}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <EmptyState title="No equipment" description="Carts and assets tied to this customer will appear here." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work">
          <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle>Work order history</CardTitle>
              <CardDescription>Recent service jobs for this customer.</CardDescription>
            </CardHeader>
            <CardContent>
              {customer.workOrders.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>WO</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Promise</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.workOrders.map((workOrder) => (
                      <TableRow key={workOrder.id}>
                        <TableCell>
                          <Link className="font-bold text-blue-600 hover:underline dark:text-blue-300" href={`/work-orders/${workOrder.id}`}>
                            {workOrder.number}
                          </Link>
                        </TableCell>
                        <TableCell>{workOrder.title}</TableCell>
                        <TableCell><StatusBadge status={workOrder.status} /></TableCell>
                        <TableCell>{workOrder.equipment?.name ?? "—"}</TableCell>
                        <TableCell>{formatDate(workOrder.promisedDate)}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(Number(workOrder.grandTotal))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState icon={Wrench} title="No work orders" description="Work history will appear once service jobs are created." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estimates">
          <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle>Estimates</CardTitle>
              <CardDescription>Good, better, best quotes and approval status.</CardDescription>
            </CardHeader>
            <CardContent>
              {customer.estimates.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estimate</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.estimates.map((estimate) => (
                      <TableRow key={estimate.id}>
                        <TableCell>
                          <Link className="font-bold text-blue-600 hover:underline dark:text-blue-300" href={`/estimates/${estimate.id}`}>
                            {estimate.number}
                          </Link>
                        </TableCell>
                        <TableCell>{estimate.title}</TableCell>
                        <TableCell><StatusBadge status={estimate.status} /></TableCell>
                        <TableCell>{formatDate(estimate.expiresAt)}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(Number(estimate.grandTotal))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState icon={FileText} title="No estimates" description="Quotes for this customer will appear here." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Payment status and open balances.</CardDescription>
            </CardHeader>
            <CardContent>
              {customer.invoices.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Work order</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <Link className="font-bold text-blue-600 hover:underline dark:text-blue-300" href={`/invoices/${invoice.id}`}>
                            {invoice.number}
                          </Link>
                        </TableCell>
                        <TableCell><StatusBadge status={invoice.status} /></TableCell>
                        <TableCell>{formatDate(invoice.issuedAt)}</TableCell>
                        <TableCell>
                          {invoice.workOrder ? (
                            <Link href={`/work-orders/${invoice.workOrder.id}`} className="text-blue-600 hover:underline dark:text-blue-300">
                              {invoice.workOrder.number}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(Number(invoice.amountDue))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState icon={ReceiptText} title="No invoices" description="Invoices and payments will appear here." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications">
          <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle>Communications</CardTitle>
              <CardDescription>SMS, email, in-app messages, and notes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.communications.length ? (
                customer.communications.map((communication) => (
                  <div key={communication.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">
                          {communication.subject ?? communication.channel}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {communication.direction} · {formatDateTime(communication.createdAt)}
                        </p>
                      </div>
                      <Badge variant="outline">{communication.status}</Badge>
                    </div>
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {communication.body}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState icon={Mail} title="No communications" description="Customer messages and notes will appear here." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="size-5 text-blue-600" />
                Notes
              </CardTitle>
              <CardDescription>Internal CRM notes for the shop team.</CardDescription>
            </CardHeader>
            <CardContent>
              {customer.notes ? (
                <div className="whitespace-pre-wrap rounded-2xl border border-blue-100 bg-blue-50/40 p-5 leading-7 dark:border-blue-900 dark:bg-blue-950/20">
                  {customer.notes}
                </div>
              ) : (
                <EmptyState icon={StickyNote} title="No notes" description="Customer preferences and internal context will appear here." />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
