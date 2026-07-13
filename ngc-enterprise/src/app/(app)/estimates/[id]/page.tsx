import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2, FileText, Send, Wrench } from "lucide-react"

import {
  approveEstimate,
  convertEstimateToWorkOrder,
} from "@/lib/actions/estimates"
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

type EstimateDetailPageProps = {
  params: Promise<{ id: string }>
}

type EstimateOption = {
  key: string
  name: string
  description?: string | null
  price: number
}

function parseOptions(value: unknown): EstimateOption[] {
  if (!Array.isArray(value)) return []

  return value
    .map<EstimateOption | null>((item, index) => {
      if (!item || typeof item !== "object") return null
      const record = item as Record<string, unknown>
      const key = String(record.key ?? record.name ?? `option-${index}`).toLowerCase()
      return {
        key,
        name: String(record.name ?? key),
        description:
          typeof record.description === "string" ? record.description : null,
        price: Number(record.price ?? record.total ?? record.amount ?? 0),
      }
    })
    .filter((option): option is EstimateOption => option !== null)
}

export default async function EstimateDetailPage({
  params,
}: EstimateDetailPageProps) {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  const { id } = await params

  if (!organizationId) {
    return (
      <EmptyState
        title="No organization attached"
        description="Estimate details require an organization-scoped session."
      />
    )
  }

  const estimate = await prisma.estimate.findFirst({
    where: { id, organizationId },
    include: {
      customer: { select: { id: true, displayName: true, email: true, phone: true } },
      lineItems: { orderBy: { sortOrder: "asc" } },
      workOrder: { select: { id: true, number: true, status: true } },
    },
  })

  if (!estimate) {
    notFound()
  }

  const options = parseOptions(estimate.options)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Estimate"
        title={`${estimate.number} · ${estimate.title}`}
        description={`${estimate.customer.displayName} · ${formatCurrency(Number(estimate.grandTotal))}`}
        actions={
          <>
            <Link
              href="/estimates"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-xl bg-white/70 dark:bg-white/5")}
            >
              <ArrowLeft className="size-4" />
              Estimates
            </Link>
            {estimate.workOrder ? (
              <Link
                href={`/work-orders/${estimate.workOrder.id}`}
                className={cn(buttonVariants({ size: "lg" }), "rounded-xl shadow-sm shadow-blue-600/20")}
              >
                <Wrench className="size-4" />
                {estimate.workOrder.number}
              </Link>
            ) : (
              <form action={convertEstimateToWorkOrder}>
                <input type="hidden" name="estimateId" value={estimate.id} />
                <Button size="lg" className="h-9 rounded-xl shadow-sm shadow-blue-600/20">
                  <Wrench className="size-4" />
                  Convert to WO
                </Button>
              </form>
            )}
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Status" value={<StatusBadge status={estimate.status} />} />
        <StatCard label="Selected option" value={<span className="capitalize">{estimate.selectedOption ?? "—"}</span>} />
        <StatCard label="Expires" value={formatDate(estimate.expiresAt)} />
        <StatCard label="Grand total" value={formatCurrency(Number(estimate.grandTotal))} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.72fr]">
        <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5 text-blue-600" />
              Good / Better / Best
            </CardTitle>
            <CardDescription>Customer-facing package options.</CardDescription>
          </CardHeader>
          <CardContent>
            {options.length ? (
              <div className="grid gap-4 lg:grid-cols-3">
                {options.map((option) => {
                  const selected = estimate.selectedOption === option.key

                  return (
                    <div
                      key={option.key}
                      className={cn(
                        "rounded-2xl border bg-background/70 p-5",
                        selected
                          ? "border-blue-300 bg-blue-50/80 shadow-sm shadow-blue-950/5 dark:border-blue-800 dark:bg-blue-950/30"
                          : "border-border"
                      )}
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-black capitalize">{option.name}</p>
                          <p className="text-2xl font-black text-blue-700 dark:text-blue-200">
                            {formatCurrency(option.price)}
                          </p>
                        </div>
                        {selected ? (
                          <Badge className="bg-blue-600 text-white">Selected</Badge>
                        ) : null}
                      </div>
                      <p className="min-h-20 text-sm leading-6 text-muted-foreground">
                        {option.description ?? "No description entered."}
                      </p>
                      <form action={approveEstimate} className="mt-5">
                        <input type="hidden" name="estimateId" value={estimate.id} />
                        <input type="hidden" name="selectedOption" value={option.key} />
                        <Button
                          type="submit"
                          variant={selected ? "secondary" : "outline"}
                          className="w-full rounded-xl bg-white/70 dark:bg-white/5"
                        >
                          <CheckCircle2 className="size-4" />
                          Approve {option.name}
                        </Button>
                      </form>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                title="No package options"
                description="Good, better, best options will appear here when saved on the estimate."
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle>Customer & notes</CardTitle>
            <CardDescription>Quote context and delivery details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href={`/customers/${estimate.customer.id}`}
              className="block rounded-2xl border border-blue-100 bg-blue-50/50 p-4 hover:bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20 dark:hover:bg-blue-950/30"
            >
              <p className="font-bold">{estimate.customer.displayName}</p>
              <p className="text-sm text-muted-foreground">
                {estimate.customer.email ?? estimate.customer.phone ?? "No contact info"}
              </p>
            </Link>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="mb-2 flex items-center gap-2 font-bold">
                <Send className="size-4 text-blue-600" />
                Quote timing
              </p>
              <p className="text-sm text-muted-foreground">
                Sent: {formatDateTime(estimate.sentAt)} · Approved:{" "}
                {formatDateTime(estimate.approvedAt)}
              </p>
            </div>
            {estimate.customerNotes ? (
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="font-bold">Customer notes</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {estimate.customerNotes}
                </p>
              </div>
            ) : null}
            {estimate.notes ? (
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="font-bold">Internal notes</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {estimate.notes}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
        <CardHeader>
          <CardTitle>Line items</CardTitle>
          <CardDescription>Estimate charges that can copy into the work order.</CardDescription>
        </CardHeader>
        <CardContent>
          {estimate.lineItems.length ? (
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
                {estimate.lineItems.map((item) => {
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
            <EmptyState title="No line items" description="Package pricing is still shown above." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
