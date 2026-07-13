import { StaticLeadsPage } from "@/components/demo/static-app-pages"
import { isStaticExport } from "@/lib/static"
import Link from "next/link"
import { Handshake, Plus } from "lucide-react"
import { LeadStatus } from "@prisma/client"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/utils"

const columns = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.QUALIFIED,
  LeadStatus.ESTIMATE_SENT,
  LeadStatus.WON,
  LeadStatus.LOST,
]

export default async function LeadsPage() {
  if (isStaticExport()) {
    return <StaticLeadsPage />
  }

  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return (
      <EmptyState
        title="No organization attached"
        description="Leads require an organization-scoped session."
      />
    )
  }

  const leads = await prisma.lead.findMany({
    where: { organizationId },
    include: { customer: { select: { id: true, displayName: true, email: true, phone: true } } },
    orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
  })
  const closedLeadStatuses: ReadonlySet<LeadStatus> = new Set([
    LeadStatus.WON,
    LeadStatus.LOST,
  ])
  const pipelineValue = leads
    .filter((lead) => !closedLeadStatuses.has(lead.status))
    .reduce((sum, lead) => sum + Number(lead.value ?? 0), 0)
  const wonValue = leads
    .filter((lead) => lead.status === LeadStatus.WON)
    .reduce((sum, lead) => sum + Number(lead.value ?? 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Growth"
        title="Leads"
        description="A simple kanban view of customer opportunities from new inquiry through won or lost."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Handshake} label="Total leads" value={leads.length} />
        <StatCard label="Open pipeline" value={formatCurrency(pipelineValue)} />
        <StatCard label="Won value" value={formatCurrency(wonValue)} />
        <StatCard
          label="Estimate sent"
          value={leads.filter((lead) => lead.status === LeadStatus.ESTIMATE_SENT).length}
        />
      </section>

      {leads.length ? (
        <div className="grid gap-4 xl:grid-cols-6">
          {columns.map((status) => {
            const statusLeads = leads.filter((lead) => lead.status === status)
            const value = statusLeads.reduce(
              (sum, lead) => sum + Number(lead.value ?? 0),
              0
            )

            return (
              <Card
                key={status}
                className="min-h-[32rem] border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <StatusBadge status={status} />
                      <CardTitle className="mt-3 text-base">
                        {statusLeads.length} cards
                      </CardTitle>
                      <CardDescription>{formatCurrency(value)}</CardDescription>
                    </div>
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
                      {statusLeads.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {statusLeads.length ? (
                    statusLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="rounded-2xl border border-blue-100 bg-blue-50/45 p-4 shadow-sm transition-transform hover:-translate-y-0.5 dark:border-blue-900 dark:bg-blue-950/20"
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold leading-5">{lead.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {lead.source ?? "No source"} · {formatDate(lead.updatedAt)}
                            </p>
                          </div>
                          {lead.value ? (
                            <Badge className="bg-blue-600 text-white">
                              {formatCurrency(Number(lead.value))}
                            </Badge>
                          ) : null}
                        </div>
                        {lead.customer ? (
                          <Link
                            href={`/customers/${lead.customer.id}`}
                            className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-300"
                          >
                            {lead.customer.displayName}
                          </Link>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Unlinked prospect
                          </p>
                        )}
                        {lead.notes ? (
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                            {lead.notes}
                          </p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/30 p-4 text-center text-sm text-muted-foreground dark:border-blue-900 dark:bg-blue-950/10">
                      No leads in this stage
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Handshake}
          title="No leads yet"
          description="Lead cards will appear here as opportunities are captured and moved through the pipeline."
          action={
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Plus className="size-4" />
              Lead creation can be wired when intake forms are added.
            </div>
          }
        />
      )}
    </div>
  )
}
