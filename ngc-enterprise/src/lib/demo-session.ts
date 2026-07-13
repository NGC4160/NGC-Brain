"use client"

import type { DemoRole } from "@/lib/static"

export const DEMO_SESSION_STORAGE_KEY = "ngc-enterprise-demo-session"

export type DemoSession = {
  id: string
  name: string
  email: string
  role: DemoRole
  organizationId: string
}

type DemoAccount = {
  email: string
  role: DemoRole
  name: string
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage)
}

export function getDemoSession(): DemoSession | null {
  if (!canUseStorage()) return null

  try {
    const raw = window.localStorage.getItem(DEMO_SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<DemoSession>

    if (!parsed.id || !parsed.name || !parsed.email || !parsed.role) {
      return null
    }

    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
      organizationId: parsed.organizationId ?? "org-ngc",
    }
  } catch {
    clearDemoSession()
    return null
  }
}

export function setDemoSession(account: DemoAccount): DemoSession | null {
  if (!canUseStorage()) return null

  const session: DemoSession = {
    id: `demo-${account.email.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`,
    name: account.name,
    email: account.email,
    role: account.role,
    organizationId: "org-ngc",
  }

  window.localStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify(session))
  return session
}

export function clearDemoSession() {
  if (!canUseStorage()) return
  window.localStorage.removeItem(DEMO_SESSION_STORAGE_KEY)
}
