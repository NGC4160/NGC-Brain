"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import {
  Bell,
  CheckCircle2,
  Laptop,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  User,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { initials } from "@/lib/utils"

type AppHeaderProps = {
  user?: {
    name?: string | null
    email?: string | null
    role?: string | null
  } | null
}

export function AppHeader({ user }: AppHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const name = user?.name ?? "Ryan Palmer"
  const email = user?.email ?? "owner@ngcgolfcarts.com"
  const isDark = resolvedTheme === "dark"

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/80 bg-background/88 px-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/72 sm:px-5">
      <SidebarTrigger className="md:hidden" />

      <div className="relative hidden flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Global search"
          className="h-10 max-w-xl rounded-full border-border/80 bg-card/80 pl-9 shadow-sm"
          placeholder="Search work orders, customers, invoices, carts..."
        />
      </div>

      <div className="flex flex-1 items-center gap-2 md:hidden">
        <p className="text-sm font-semibold tracking-tight">NGC Enterprise</p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Badge
          variant="outline"
          className="hidden gap-1.5 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/70 dark:text-blue-200 lg:inline-flex"
        >
          <CheckCircle2 className="size-3.5" />
          Shop online
        </Badge>

        <Button
          aria-label="Notifications"
          variant="ghost"
          size="icon-lg"
          className="relative rounded-full"
        >
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-background" />
        </Button>

        <Button
          aria-label="Toggle theme"
          variant="ghost"
          size="icon-lg"
          className="rounded-full"
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Open user menu"
            className="flex items-center gap-2 rounded-full p-1 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar className="size-9 bg-primary/10">
              <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="px-2 py-2">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials(name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/profile" />}>
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/settings" />}>
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Laptop className="size-4" />
              Use system theme
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
