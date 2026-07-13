import { StaticEstimateNewPage } from "@/components/demo/static-app-pages"
import { isStaticExport } from "@/lib/static"
import Link from "next/link"
import { ArrowLeft, FileText, Save } from "lucide-react"

import { createEstimate } from "@/lib/actions/estimates"
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
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { cn } from "@/lib/utils"

export default async function NewEstimatePage() {
  if (isStaticExport()) {
    return <StaticEstimateNewPage />
  }

  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return (
      <EmptyState
        title="No organization attached"
        description="Estimates require an organization-scoped session."
      />
    )
  }

  const customers = await prisma.customer.findMany({
    where: { organizationId },
    orderBy: { displayName: "asc" },
  })

  if (!customers.length) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Quotes"
          title="Create estimate"
          description="A customer account is required before quoting."
        />
        <EmptyState
          title="Create a customer first"
          description="Estimates need a customer so approvals, conversions, and invoices stay tied to the CRM profile."
          action={
            <Link href="/customers/new" className={cn(buttonVariants({ size: "lg" }), "rounded-xl")}>
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
        eyebrow="Quotes"
        title="Create estimate"
        description="Build a good, better, best quote with optional notes and financing link."
        actions={
          <Link
            href="/estimates"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-xl bg-white/70 dark:bg-white/5")}
          >
            <ArrowLeft className="size-4" />
            Back to estimates
          </Link>
        }
      />

      <form action={createEstimate} className="grid gap-6 xl:grid-cols-[0.8fr_1fr]">
        <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5 text-blue-600" />
              Estimate details
            </CardTitle>
            <CardDescription>High-level quote information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer</Label>
              <select
                id="customerId"
                name="customerId"
                required
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
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required className="h-11 rounded-xl" placeholder="48V lithium conversion" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="selectedOption">Default selected option</Label>
              <select
                id="selectedOption"
                name="selectedOption"
                defaultValue="better"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="good">Good</option>
                <option value="better">Better</option>
                <option value="best">Best</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expires</Label>
              <Input id="expiresAt" name="expiresAt" type="date" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="financingUrl">Financing URL</Label>
              <Input id="financingUrl" name="financingUrl" type="url" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerNotes">Customer notes</Label>
              <Textarea id="customerNotes" name="customerNotes" placeholder="What the customer will see on the estimate." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Internal notes</Label>
              <Textarea id="notes" name="notes" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {(["good", "better", "best"] as const).map((tier) => (
              <Card key={tier} className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
                <CardHeader>
                  <CardTitle className="capitalize">{tier}</CardTitle>
                  <CardDescription>
                    {tier === "good" ? "Baseline fix" : tier === "better" ? "Recommended package" : "Premium outcome"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${tier}Price`}>Price</Label>
                    <Input id={`${tier}Price`} name={`${tier}Price`} type="number" step="0.01" min="0" className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${tier}Description`}>Description</Label>
                    <Textarea id={`${tier}Description`} name={`${tier}Description`} placeholder={`${tier} option scope...`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="lg" className="h-11 rounded-xl shadow-sm shadow-blue-600/20">
              <Save className="size-4" />
              Create estimate
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
