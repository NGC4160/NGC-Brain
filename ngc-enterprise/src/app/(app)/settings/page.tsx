import { StaticSettingsPage } from "@/components/demo/static-app-pages"
import { isStaticExport } from "@/lib/static"
import { Role } from "@prisma/client"
import type { LucideIcon } from "lucide-react"
import {
  Bell,
  Building2,
  CreditCard,
  FileUp,
  Flag,
  MapPin,
  Palette,
  Percent,
  Settings,
  Shield,
  SlidersHorizontal,
} from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const roleMatrix: Record<Role, string[]> = {
  SUPER_ADMIN: ["Everything", "Cross-org support", "Platform configuration"],
  OWNER: ["Revenue", "Settings", "Team", "Reports", "All operations"],
  MANAGER: ["Operations", "Schedule", "Dispatch", "Team visibility"],
  SERVICE_ADVISOR: ["Customers", "Work orders", "Estimates", "Communications"],
  SHOP_TECHNICIAN: ["Shop floor", "Assigned work", "Time", "Checklists"],
  PARTS_MANAGER: ["Inventory", "Price book", "Purchase orders"],
  DISPATCHER: ["Dispatch", "Schedule", "Driver coordination"],
  PICKUP_DRIVER: ["Driver app", "Pickup status", "Proof upload"],
  DELIVERY_DRIVER: ["Driver app", "Delivery status", "Proof upload"],
  ACCOUNTANT: ["Invoices", "Payments", "Reports", "QBO exports"],
  READ_ONLY: ["View-only dashboards", "Limited records"],
}

const settingsTabs: { value: string; icon: LucideIcon; label: string }[] = [
  { value: "company", icon: Building2, label: "Company" },
  { value: "locations", icon: MapPin, label: "Locations" },
  { value: "statuses", icon: SlidersHorizontal, label: "Work Order Statuses" },
  { value: "notifications", icon: Bell, label: "Notifications" },
  { value: "taxes", icon: Percent, label: "Taxes" },
  { value: "integrations", icon: CreditCard, label: "Integrations" },
  { value: "roles", icon: Shield, label: "Roles matrix" },
  { value: "import", icon: FileUp, label: "Import / Export" },
  { value: "branding", icon: Palette, label: "Branding" },
]

function jsonSummary(value: unknown) {
  if (!value || typeof value !== "object") return "{}"
  return JSON.stringify(value, null, 2)
}

export default async function SettingsPage() {
  if (isStaticExport()) {
    return <StaticSettingsPage />
  }

  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return (
      <EmptyState
        icon={Settings}
        title="No organization selected"
        description="Your user account is not connected to an organization yet."
      />
    )
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      locations: { orderBy: [{ isPrimary: "desc" }, { name: "asc" }] },
      workOrderStatuses: { orderBy: { sortOrder: "asc" } },
      taxRates: { orderBy: [{ isDefault: "desc" }, { name: "asc" }] },
    },
  })

  if (!organization) {
    return (
      <EmptyState
        icon={Settings}
        title="Organization not found"
        description="The organization connected to this user could not be loaded."
      />
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff_52%,#e0f2fe)] p-6 shadow-sm dark:border-blue-900/60 dark:bg-[linear-gradient(135deg,#071827,#0c1728)]">
        <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          Organization controls
        </Badge>
        <h1 className="text-4xl font-black tracking-tight">Settings</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Company, locations, workflow statuses, taxes, integrations, roles,
          imports, notifications, and NGC Enterprise branding.
        </p>
      </section>

      <Tabs defaultValue="company" orientation="vertical" className="grid gap-5 lg:grid-cols-[18rem_1fr]">
        <TabsList className="h-fit w-full flex-col items-stretch rounded-[2rem] border bg-card p-2 shadow-sm">
          {settingsTabs.map(({ value, icon: Icon, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="h-11 justify-start rounded-2xl px-4"
            >
              <Icon className="size-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="space-y-5">
          <TabsContent value="company">
            <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
              <CardHeader>
                <CardTitle>Company profile</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {[
                  ["Name", organization.name],
                  ["Legal name", organization.legalName ?? "Not set"],
                  ["Slug", organization.slug],
                  ["Phone", organization.phone ?? "Not set"],
                  ["Email", organization.email ?? "Not set"],
                  ["Website", organization.website ?? "Not set"],
                  ["Timezone", organization.timezone],
                  ["Plan", organization.plan],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-3xl border bg-muted/30 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                      {label}
                    </p>
                    <p className="mt-2 font-semibold">{value}</p>
                  </div>
                ))}
                <div className="rounded-3xl border bg-muted/30 p-4 md:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                    Settings JSON from DB
                  </p>
                  <pre className="mt-3 max-h-72 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-blue-50">
                    {jsonSummary(organization.settings)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations">
            <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
              <CardHeader>
                <CardTitle>Locations</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {organization.locations.map((location) => (
                  <div key={location.id} className="rounded-3xl border bg-muted/30 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black">{location.name}</p>
                      {location.isPrimary ? <Badge>Primary</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {[location.address1, location.city, location.state, location.postalCode]
                        .filter(Boolean)
                        .join(", ") || "Address not set"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {location.phone ?? "No phone"} • {location.email ?? "No email"}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statuses">
            <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
              <CardHeader>
                <CardTitle>Work order statuses</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {organization.workOrderStatuses.length ? (
                  organization.workOrderStatuses.map((status) => (
                    <div key={status.id} className="rounded-3xl border bg-muted/30 p-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="size-3 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <p className="font-bold">{status.label}</p>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Key {status.key} • sort {status.sortOrder} •{" "}
                        {status.customerVisible ? "customer visible" : "internal"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No custom status definitions found. The platform enum
                    statuses are still available.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {["Estimate approved", "Parts below reorder", "Driver arrived"].map(
                  (item) => (
                    <div key={item} className="rounded-3xl border bg-muted/30 p-4">
                      <Bell className="size-6 text-primary" />
                      <p className="mt-3 font-bold">{item}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Email, SMS, and in-app routing controls placeholder.
                      </p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="taxes">
            <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
              <CardHeader>
                <CardTitle>Taxes</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {organization.taxRates.length ? (
                  organization.taxRates.map((tax) => (
                    <div key={tax.id} className="rounded-3xl border bg-muted/30 p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-bold">{tax.name}</p>
                        {tax.isDefault ? <Badge>Default</Badge> : null}
                      </div>
                      <p className="mt-2 text-2xl font-black text-primary">
                        {(Number(tax.rate) * 100).toFixed(2)}%
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No tax rates configured.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {[
                  ["Stripe", "Payments, cards, deposits", "Not connected"],
                  ["QuickBooks Online", "Invoices, payments, taxes", "Not connected"],
                  ["Mapbox", "Live route maps and ETAs", "Token needed"],
                ].map(([name, copy, status]) => (
                  <div key={name} className="rounded-3xl border bg-muted/30 p-4">
                    <CreditCard className="size-6 text-primary" />
                    <p className="mt-3 font-black">{name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
                    <Badge variant="outline" className="mt-4 rounded-full bg-background">
                      {status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles">
            <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
              <CardHeader>
                <CardTitle>Roles matrix (read-only)</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {Object.entries(roleMatrix).map(([role, permissions]) => (
                  <div key={role} className="rounded-3xl border bg-muted/30 p-4">
                    <p className="font-black">{role.replaceAll("_", " ")}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="rounded-full bg-background">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import">
            <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
              <CardHeader>
                <CardTitle>Import / Export</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {[
                  ["Upload HCP export", "CSV intake for customers, jobs, and price book."],
                  ["Map columns", "Review required fields and transformation rules."],
                  ["Dry run + import", "Validate counts before writing records."],
                ].map(([title, copy], index) => (
                  <div key={title} className="rounded-3xl border bg-muted/30 p-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                      {index + 1}
                    </div>
                    <p className="mt-4 font-black">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {copy}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding">
            <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
              <CardHeader>
                <CardTitle>Branding</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border bg-muted/30 p-4">
                  <Palette className="size-6 text-primary" />
                  <p className="mt-3 font-black">Primary color</p>
                  <div className="mt-3 flex items-center gap-3">
                    <span
                      className="size-10 rounded-2xl border shadow-sm"
                      style={{ backgroundColor: organization.primaryColor }}
                    />
                    <p className="font-mono text-sm">{organization.primaryColor}</p>
                  </div>
                </div>
                <div className="rounded-3xl border bg-muted/30 p-4">
                  <Flag className="size-6 text-primary" />
                  <p className="mt-3 font-black">Customer-facing brand</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Logo URL: {organization.logoUrl ?? "Not set"}.
                    Portal, estimate, and invoice branding will inherit this
                    profile.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
