import type { RepairJob } from '@/types'

export interface HCPDashboardExtras {
  fleetAccounts: number
  partsOnOrder: number
  lowStockAlerts: number
}

export interface HCPDashboardPayload {
  source: 'live' | 'cache'
  syncedAt: string
  jobCount: number
  jobs: RepairJob[]
  extras: HCPDashboardExtras
  company?: {
    name?: string
    phone_number?: string
    website?: string
    logo_url?: string
  } | null
}

const API_BASE = import.meta.env.VITE_HCP_API_URL ?? ''

export async function fetchHCPDashboard(): Promise<HCPDashboardPayload> {
  const urls = [
    `${API_BASE}/api/hcp/dashboard`,
    `${import.meta.env.BASE_URL}data/hcp-dashboard.json`,
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      return (await res.json()) as HCPDashboardPayload
    } catch {
      continue
    }
  }

  throw new Error('Could not load Housecall Pro data')
}

export async function refreshHCPSync(): Promise<{ ok: boolean; syncedAt?: string }> {
  const res = await fetch(`${API_BASE}/api/hcp/sync`, { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Sync failed')
  }
  return res.json() as Promise<{ ok: boolean; syncedAt?: string }>
}

export function formatSyncSource(source: HCPDashboardPayload['source']): string {
  return source === 'live' ? 'Housecall Pro (live)' : 'Housecall Pro (cached)'
}
