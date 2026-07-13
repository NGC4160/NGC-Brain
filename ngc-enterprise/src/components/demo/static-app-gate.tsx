"use client"

import type { ReactNode } from "react"
import { useEffect, useSyncExternalStore } from "react"
import { Loader2 } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { appBasePath } from "@/lib/static"
import {
  DEMO_SESSION_STORAGE_KEY,
  getDemoSession,
  type DemoSession,
} from "@/lib/demo-session"

type StaticAppGateProps = {
  children: ReactNode
  defaultUser: {
    name?: string | null
    email?: string | null
    role?: string | null
  }
}

let cachedRaw: string | null | undefined
let cachedSession: DemoSession | null | undefined

function subscribeToStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)
  return () => window.removeEventListener("storage", onStoreChange)
}

function getSessionSnapshot() {
  const raw = window.localStorage.getItem(DEMO_SESSION_STORAGE_KEY)
  if (raw === cachedRaw) return cachedSession

  cachedRaw = raw
  cachedSession = getDemoSession()
  return cachedSession
}

export function StaticAppGate({ children, defaultUser }: StaticAppGateProps) {
  const session = useSyncExternalStore(
    subscribeToStorage,
    getSessionSnapshot,
    () => undefined
  )

  useEffect(() => {
    if (session === null) {
      window.location.replace(`${appBasePath()}/login`)
    }
  }, [session])

  if (!session) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[linear-gradient(135deg,#eff6ff,#ffffff,#e0f2fe)]">
        <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-100 backdrop-blur">
          <Loader2 className="size-4 animate-spin" />
          Opening GitHub Pages demo...
        </div>
      </div>
    )
  }

  return <AppShell user={session ?? defaultUser}>{children}</AppShell>
}
