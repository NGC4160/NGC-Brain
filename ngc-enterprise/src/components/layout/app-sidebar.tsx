"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CarFront,
  ClipboardList,
  FileText,
  Gauge,
  Handshake,
  Megaphone,
  MessageSquare,
  Package,
  ReceiptText,
  Route,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
  Wrench,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const navGroups = [
  {
    label: "Operations",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: Gauge },
      { title: "Shop Floor", href: "/shop-floor", icon: Wrench, badge: "12" },
      { title: "Schedule", href: "/schedule", icon: CalendarDays },
      { title: "Dispatch", href: "/dispatch", icon: Route },
    ],
  },
  {
    label: "Work",
    items: [
      { title: "Work Orders", href: "/work-orders", icon: ClipboardList },
      { title: "Estimates", href: "/estimates", icon: FileText },
      { title: "Invoices", href: "/invoices", icon: ReceiptText, badge: "$18k" },
      { title: "Customers", href: "/customers", icon: Users },
      { title: "Leads", href: "/leads", icon: Handshake },
    ],
  },
  {
    label: "Catalog",
    items: [
      { title: "Price Book", href: "/price-book", icon: BookOpen },
      { title: "Inventory", href: "/inventory", icon: Package },
    ],
  },
  {
    label: "Growth",
    items: [
      { title: "Communications", href: "/communications", icon: MessageSquare },
      { title: "Marketing", href: "/marketing", icon: Megaphone },
      { title: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Team", href: "/team", icon: UserCog },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
]

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar
      collapsible="icon"
      className="border-sidebar-border/80 bg-sidebar"
    >
      <SidebarHeader className="gap-3 border-b border-sidebar-border/80 p-3">
        <Link
          href="/dashboard"
          className="group/brand flex items-center gap-3 rounded-xl px-1 py-1.5 outline-none transition-colors hover:bg-sidebar-accent/70 focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-blue-500/20 group-data-[collapsible=icon]:size-8">
            <Sparkles className="size-5 group-data-[collapsible=icon]:size-4" />
            <span className="absolute inset-x-0 bottom-0 h-1/2 bg-white/10" />
          </span>
          <span className="grid min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
              NGC Enterprise
            </span>
            <span className="truncate text-xs font-medium text-sidebar-foreground/60">
              Shop operations suite
            </span>
          </span>
        </Link>
        <div className="group-data-[collapsible=icon]:hidden">
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
            Live shop command
          </Badge>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = isActivePath(pathname, item.href)

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        className={cn(
                          "h-9 rounded-lg text-sidebar-foreground/78 hover:bg-sidebar-accent/80",
                          active &&
                            "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-border/70"
                        )}
                        render={<Link href={item.href} />}
                      >
                        <Icon
                          className={cn(
                            "text-sidebar-foreground/52 transition-colors",
                            active && "text-sidebar-accent-foreground"
                          )}
                        />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                      {item.badge ? (
                        <SidebarMenuBadge
                          className={cn(
                            "right-2 rounded-full bg-white/70 px-2 text-[10px] text-sidebar-foreground/70 ring-1 ring-sidebar-border dark:bg-white/10",
                            active && "text-sidebar-accent-foreground"
                          )}
                        >
                          {item.badge}
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />
      <SidebarFooter className="gap-3 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Driver"
              isActive={isActivePath(pathname, "/driver")}
              className="h-10 rounded-xl bg-white/55 text-sidebar-foreground shadow-sm ring-1 ring-sidebar-border hover:bg-sidebar-accent dark:bg-white/5"
              render={<Link href="/driver" />}
            >
              <CarFront className="text-sidebar-primary" />
              <span>Driver</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="rounded-xl border border-sidebar-border bg-white/60 p-3 shadow-sm group-data-[collapsible=icon]:hidden dark:bg-white/5">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-sidebar-primary" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-sidebar-foreground">
                Northshore ready
              </p>
              <p className="text-xs leading-5 text-sidebar-foreground/65">
                Pickup, repair, deliver, and grow from one shop dashboard.
              </p>
            </div>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
