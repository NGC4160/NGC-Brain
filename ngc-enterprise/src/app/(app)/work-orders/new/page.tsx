import Link from "next/link"
import { ArrowLeft, Save, Wrench } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createWorkOrder } from "@/lib/actions/work-orders"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { cn } from "@/lib/utils"

type NewWorkOrderPageProps = {
  searchParams?: Promise<{ customerId?: string }>
}

export default async function NewWorkOrderPage({
  searchParams,
}: NewWorkOrderPageProps) {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  const params = await searchParams
  const selectedCustomerId = params?.customerId ?? ""

  if (!organizationId) {
    return (
      <EmptyState
        title="No organization attached"
        description="Work orders require an organization-scoped session."
      />
    )
  }

  const [customers, bays, locations] = await Promise.all([
    prisma.customer.findMany({
      where: { organizationId },
      include: { equipment: { orderBy: { name: "asc" } } },
      orderBy: { displayName: "asc" },
    }),
    prisma.bay.findMany({
      where: { organizationId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.location.findMany({
      where: { organizationId },
      orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
    }),
  ])

  if (!customers.length) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Shop work"
          title="Create work order"
          description="A customer account is required before intake."
        />
        <EmptyState
          title="Create a customer first"
          description="Work orders need a customer so service history, estimates, invoices, and communication stay connected."
          action={
            <Link
              href="/customers/new"
              className={cn(buttonVariants({ size: "lg" }), "rounded-xl")}
            >
              Add customer
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Shop intake"
        title="Create work order"
        description="Start a shop job with customer, cart, promise, bay, notes, and optional first charge."
        actions={
          <Link
            href="/work-orders"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-xl bg-white/70 dark:bg-white/5")}
          >
            <ArrowLeft className="size-4" />
            Back to work orders
          </Link>
        }
      />

      <form action={createWorkOrder} className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="size-5 text-blue-600" />
              Intake details
            </CardTitle>
            <CardDescription>Core information for the shop board and customer profile.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required placeholder="Lithium conversion inspection" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer</Label>
              <select
                id="customerId"
                name="customerId"
                required
                defaultValue={selectedCustomerId}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipmentId">Equipment</Label>
              <select
                id="equipmentId"
                name="equipmentId"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">No equipment selected</option>
                {customers.flatMap((customer) =>
                  customer.equipment.map((equipment) => (
                    <option key={equipment.id} value={equipment.id}>
                      {customer.displayName} · {equipment.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                name="priority"
                defaultValue="3"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="1">Urgent</option>
                <option value="2">High</option>
                <option value="3">Normal</option>
                <option value="4">Low</option>
                <option value="5">Backlog</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="promisedDate">Promised date</Label>
              <Input id="promisedDate" name="promisedDate" type="datetime-local" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationId">Location</Label>
              <select
                id="locationId"
                name="locationId"
                defaultValue={locations[0]?.id ?? ""}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">No location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bayId">Bay</Label>
              <select
                id="bayId"
                name="bayId"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">Unassigned</option>
                {bays.map((bay) => (
                  <option key={bay.id} value={bay.id}>
                    {bay.name} ({bay.status.toLowerCase()})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="intakeSource">Intake source</Label>
              <Input id="intakeSource" name="intakeSource" placeholder="Shop, pickup, estimate..." className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" name="tags" placeholder="lithium, urgent" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Customer concern</Label>
              <Textarea id="description" name="description" placeholder="Customer-reported issue or requested work..." />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Internal and customer-facing context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="internalNotes">Internal notes</Label>
                <Textarea id="internalNotes" name="internalNotes" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerNotes">Customer notes</Label>
                <Textarea id="customerNotes" name="customerNotes" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle>Optional first line item</CardTitle>
              <CardDescription>Add an initial diagnostic, fee, or service charge.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="lineItemName">Item name</Label>
                <Input id="lineItemName" name="lineItemName" placeholder="Diagnostic minimum" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lineItemQuantity">Quantity</Label>
                <Input id="lineItemQuantity" name="lineItemQuantity" type="number" step="0.001" min="0" defaultValue="1" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lineItemUnitPrice">Unit price</Label>
                <Input id="lineItemUnitPrice" name="lineItemUnitPrice" type="number" step="0.01" min="0" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="lineItemDescription">Description</Label>
                <Textarea id="lineItemDescription" name="lineItemDescription" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" className="h-11 rounded-xl shadow-sm shadow-blue-600/20">
              <Save className="size-4" />
              Create work order
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
