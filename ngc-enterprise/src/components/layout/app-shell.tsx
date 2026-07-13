"use client"

import * as React from "react"

import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

type AppShellProps = {
  children: React.ReactNode
  user?: {
    name?: string | null
    email?: string | null
    role?: string | null
  } | null
}

export function AppShell({ children, user }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_28rem),var(--background)]">
        <AppHeader user={user} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
