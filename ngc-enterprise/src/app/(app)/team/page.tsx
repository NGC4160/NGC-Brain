import { StaticTeamPage } from "@/components/demo/static-app-pages"
import { isStaticExport } from "@/lib/static"
import { Role } from "@prisma/client"
import { ShieldCheck, UserCog, Users, Wrench } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { formatDate, initials } from "@/lib/utils"

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  OWNER: "Owner",
  MANAGER: "Manager",
  SERVICE_ADVISOR: "Service Advisor",
  SHOP_TECHNICIAN: "Shop Technician",
  PARTS_MANAGER: "Parts Manager",
  DISPATCHER: "Dispatcher",
  PICKUP_DRIVER: "Pickup Driver",
  DELIVERY_DRIVER: "Delivery Driver",
  ACCOUNTANT: "Accountant",
  READ_ONLY: "Read Only",
}
const driverRoles = new Set<Role>([Role.PICKUP_DRIVER, Role.DELIVERY_DRIVER])

export default async function TeamPage() {
  if (isStaticExport()) {
    return <StaticTeamPage />
  }

  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return (
      <EmptyState
        icon={Users}
        title="No organization selected"
        description="Your user account is not connected to an organization yet."
      />
    )
  }

  const users = await prisma.user.findMany({
    where: { organizationId },
    include: {
      assignedWorkOrders: {
        where: {
          workOrder: {
            completedAt: null,
          },
        },
        select: { id: true },
      },
      dispatchedJobs: {
        where: { completedAt: null },
        select: { id: true },
      },
      locations: {
        include: { location: { select: { name: true } } },
      },
    },
    orderBy: [{ isActive: "desc" }, { role: "asc" }, { name: "asc" }],
  })

  const activeCount = users.filter((user) => user.isActive).length
  const techCount = users.filter((user) => user.role === Role.SHOP_TECHNICIAN).length
  const driverCount = users.filter((user) => driverRoles.has(user.role)).length

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff_52%,#e0f2fe)] p-6 shadow-sm dark:border-blue-900/60 dark:bg-[linear-gradient(135deg,#071827,#0c1728)]">
        <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          People operations
        </Badge>
        <h1 className="text-4xl font-black tracking-tight">Team</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Employee cards with role, skills, active work, route assignments, and
          shop readiness.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardContent className="flex items-center gap-4 p-5">
            <Users className="size-9 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Active team</p>
              <p className="text-2xl font-black">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardContent className="flex items-center gap-4 p-5">
            <Wrench className="size-9 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Technicians</p>
              <p className="text-2xl font-black">{techCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardContent className="flex items-center gap-4 p-5">
            <UserCog className="size-9 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Drivers</p>
              <p className="text-2xl font-black">{driverCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {users.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {users.map((user) => (
            <Card
              key={user.id}
              className="border-blue-100 shadow-sm dark:border-blue-900/60"
            >
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="size-14">
                    <AvatarFallback className="bg-primary/10 text-lg font-black text-primary">
                      {initials(user.name ?? user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-lg font-black tracking-tight">
                        {user.name ?? user.email}
                      </h2>
                      {user.isActive ? (
                        <span className="size-2.5 rounded-full bg-emerald-500" />
                      ) : (
                        <span className="size-2.5 rounded-full bg-slate-300" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                    <ShieldCheck className="size-3" />
                    {roleLabels[user.role]}
                  </Badge>
                  {user.locations.slice(0, 2).map((location) => (
                    <Badge
                      key={location.id}
                      variant="outline"
                      className="rounded-full bg-background"
                    >
                      {location.location.name}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-sm">
                  <div className="rounded-2xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Open work</p>
                    <p className="font-black">{user.assignedWorkOrders.length}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Routes</p>
                    <p className="font-black">{user.dispatchedJobs.length}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                    Skills
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {user.skills.length ? (
                      user.skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="rounded-full bg-background"
                        >
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No skills listed yet.
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Last login {formatDate(user.lastLoginAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No team members yet"
          description="Invite advisors, technicians, dispatchers, drivers, and managers to start operating NGC Enterprise."
        />
      )}
    </div>
  )
}
