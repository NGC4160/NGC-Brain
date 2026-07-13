import { LeadStatus } from "@prisma/client"
import { Gift, Megaphone, MessageSquareHeart, Star, Target, TrendingUp } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"

export default async function MarketingPage() {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return (
      <EmptyState
        icon={Megaphone}
        title="No organization selected"
        description="Your user account is not connected to an organization yet."
      />
    )
  }

  const [leads, templates, customers] = await Promise.all([
    prisma.lead.findMany({
      where: { organizationId },
      include: { customer: { select: { displayName: true } } },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.messageTemplate.findMany({
      where: {
        organizationId,
        trigger: { in: ["REVIEW_REQUEST", "ESTIMATE_SENT", "WORK_ORDER_COMPLETED"] },
      },
      orderBy: { name: "asc" },
    }),
    prisma.customer.count({ where: { organizationId } }),
  ])

  const pipelineValue = leads.reduce((sum, lead) => sum + Number(lead.value ?? 0), 0)
  const won = leads.filter((lead) => lead.status === LeadStatus.WON).length
  const closedStatuses = new Set<LeadStatus>([LeadStatus.WON, LeadStatus.LOST])
  const open = leads.filter((lead) => !closedStatuses.has(lead.status)).length

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-blue-100 bg-[radial-gradient(circle_at_22%_16%,rgba(14,165,233,0.20),transparent_24rem),linear-gradient(135deg,#eff6ff,#ffffff_52%,#e0f2fe)] p-6 shadow-sm dark:border-blue-900/60 dark:bg-[linear-gradient(135deg,#071827,#0c1728)]">
        <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          Growth engine
        </Badge>
        <h1 className="text-4xl font-black tracking-tight">Marketing</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Review automation, lifecycle campaigns, referral motion, and lead
          pipeline visibility for NGC Enterprise.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardContent className="flex items-center gap-4 p-5">
            <Target className="size-9 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Open leads</p>
              <p className="text-2xl font-black">{open}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardContent className="flex items-center gap-4 p-5">
            <TrendingUp className="size-9 text-emerald-500" />
            <div>
              <p className="text-sm text-muted-foreground">Pipeline</p>
              <p className="text-2xl font-black">{formatCurrency(pipelineValue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardContent className="flex items-center gap-4 p-5">
            <Star className="size-9 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Won leads</p>
              <p className="text-2xl font-black">{won}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardContent className="flex items-center gap-4 p-5">
            <MessageSquareHeart className="size-9 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Audience</p>
              <p className="text-2xl font-black">{customers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="size-5 text-amber-500" />
              Review automation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl bg-blue-50/70 p-4 dark:bg-blue-950/20">
              <p className="font-black">Trigger: work order completed</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Send a friendly SMS/email 2 hours after pickup or delivery asking
                happy customers for a Google review.
              </p>
            </div>
            {templates.length ? (
              templates.map((template) => (
                <div key={template.id} className="rounded-3xl border bg-muted/30 p-4">
                  <p className="font-bold">{template.name}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                    {template.body}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No review templates configured yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="size-5 text-primary" />
              Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Lithium conversion follow-up", "Target lead source + aged lead status."],
              ["Seasonal tune-up reminder", "Service plan and annual maintenance audience."],
              ["Dormant customer reactivation", "No work order in 12+ months."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-3xl border bg-muted/30 p-4">
                <p className="font-bold">{title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy}</p>
                <Badge variant="outline" className="mt-3 rounded-full bg-background">
                  Draft placeholder
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="size-5 text-emerald-500" />
              Referral hub
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-3xl bg-emerald-50/70 p-4 dark:bg-emerald-950/20">
              <p className="font-black">Give $50, get $50</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Placeholder referral mechanic for completed repair and lithium
                customers after final payment.
              </p>
            </div>
            <div className="rounded-3xl border bg-muted/30 p-4">
              <p className="font-bold">Referral landing page</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Future customer portal link with share tracking and attribution.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
        <CardHeader>
          <CardTitle>Recent lead pipeline</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {leads.length ? (
            leads.map((lead) => (
              <div key={lead.id} className="rounded-3xl border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black">{lead.title}</p>
                  <Badge variant="outline" className="rounded-full bg-background">
                    {lead.status.toLowerCase()}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {lead.customer?.displayName ?? lead.source ?? "Unlinked lead"}
                </p>
                <p className="mt-3 text-lg font-black text-primary">
                  {formatCurrency(Number(lead.value ?? 0))}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Leads will appear here as campaigns and referral forms generate
              demand.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
