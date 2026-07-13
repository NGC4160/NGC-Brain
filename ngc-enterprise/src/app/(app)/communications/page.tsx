import { StaticCommunicationsPage } from "@/components/demo/static-app-pages"
import { isStaticExport } from "@/lib/static"
import { MessageChannel } from "@prisma/client"
import { Mail, MessageSquare, Send, Smartphone, Sparkles } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { cn, formatDateTime } from "@/lib/utils"

const channelIcons = {
  [MessageChannel.SMS]: Smartphone,
  [MessageChannel.EMAIL]: Mail,
  [MessageChannel.IN_APP]: Sparkles,
  [MessageChannel.NOTE]: MessageSquare,
}

export default async function CommunicationsPage() {
  if (isStaticExport()) {
    return <StaticCommunicationsPage />
  }

  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No organization selected"
        description="Your user account is not connected to an organization yet."
      />
    )
  }

  const [communications, templates] = await Promise.all([
    prisma.communication.findMany({
      where: { organizationId },
      include: {
        customer: { select: { displayName: true, phone: true, email: true } },
        sender: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.messageTemplate.findMany({
      where: { organizationId, isActive: true },
      orderBy: [{ channel: "asc" }, { name: "asc" }],
    }),
  ])

  const inbound = communications.filter((message) => message.direction === "INBOUND")
  const outbound = communications.length - inbound.length

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff_52%,#e0f2fe)] p-6 shadow-sm dark:border-blue-900/60 dark:bg-[linear-gradient(135deg,#071827,#0c1728)]">
        <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          Unified inbox
        </Badge>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Communications</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              SMS, email, notes, and automated templates in one advisor-friendly
              timeline.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-blue-100 dark:bg-white/10 dark:ring-white/10">
              <p className="text-xs text-muted-foreground">Inbound</p>
              <p className="text-2xl font-black">{inbound.length}</p>
            </div>
            <div className="rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-blue-100 dark:bg-white/10 dark:ring-white/10">
              <p className="text-xs text-muted-foreground">Outbound</p>
              <p className="text-2xl font-black">{outbound}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardHeader>
            <CardTitle>Inbox</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {communications.length ? (
              communications.map((message) => {
                const Icon = channelIcons[message.channel]
                const inboundMessage = message.direction === "INBOUND"

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "rounded-3xl border p-4 shadow-sm",
                      inboundMessage
                        ? "border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/20"
                        : "bg-card"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-extrabold">
                              {message.customer?.displayName ?? "Unlinked customer"}
                            </p>
                            <Badge variant="outline" className="rounded-full bg-background">
                              {message.channel.toLowerCase()}
                            </Badge>
                          </div>
                          {message.subject ? (
                            <p className="mt-1 text-sm font-semibold">
                              {message.subject}
                            </p>
                          ) : null}
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                            {message.body}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs text-muted-foreground">
                        <p>{formatDateTime(message.createdAt)}</p>
                        <p className="mt-1">
                          {inboundMessage ? "Customer" : message.sender?.name ?? "System"}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="No communications yet"
                description="Customer SMS, email, notes, and automated messages will appear here."
              />
            )}
          </CardContent>
        </Card>

        <Card className="h-fit border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="size-4 text-primary" />
              Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {templates.length ? (
              templates.map((template) => (
                <div key={template.id} className="rounded-3xl border bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold">{template.name}</p>
                    <Badge variant="outline" className="rounded-full bg-background">
                      {template.channel.toLowerCase()}
                    </Badge>
                  </div>
                  {template.subject ? (
                    <p className="mt-2 text-sm font-semibold">{template.subject}</p>
                  ) : null}
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {template.body}
                  </p>
                  {template.trigger ? (
                    <p className="mt-3 text-xs font-semibold text-primary">
                      Trigger: {template.trigger.replaceAll("_", " ")}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Add templates for status updates, estimate follow-ups, review
                requests, and pickup reminders.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
