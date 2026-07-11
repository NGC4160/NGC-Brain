import type { RepairJob } from '@/types'
import type { InvoicingPayload } from '@/types/invoicing'

export interface HCPDashboardExtras {
  fleetAccounts: number
  partsOnOrder: number
  lowStockAlerts: number
}

export interface HCPDashboardPayload {
  source: 'live' | 'cache' | 'dms'
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
  invoicing?: InvoicingPayload
  bookkeeper?: string
}

const API_BASE = import.meta.env.VITE_HCP_API_URL ?? ''

export async function fetchHCPDashboard(options?: {
  bustCache?: boolean
}): Promise<HCPDashboardPayload> {
  const bust = options?.bustCache ? `t=${Date.now()}` : ''
  const withBust = (url: string) => {
    if (!bust) return url
    return url.includes('?') ? `${url}&${bust}` : `${url}?${bust}`
  }

  const urls = [
    withBust(`${API_BASE}/api/dms/dashboard`),
    withBust(`${API_BASE}/api/hcp/dashboard`),
    withBust(`${import.meta.env.BASE_URL}data/hcp-dashboard.json`),
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        cache: options?.bustCache ? 'no-store' : 'default',
      })
      if (!res.ok) continue
      const data = (await res.json()) as HCPDashboardPayload
      if (data.jobs?.length) return data
    } catch {
      continue
    }
  }

  throw new Error('Could not load shop data')
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
  switch (source) {
    case 'live':
      return 'Housecall Pro (live)'
    case 'dms':
      return 'NGC DMS (imported)'
    default:
      return 'GitHub Pages cache'
  }
}

export function describeDataMode(source: HCPDashboardPayload['source'] | undefined): string {
  switch (source) {
    case 'live':
      return 'Live API — refresh pulls the latest jobs from Housecall Pro.'
    case 'dms':
      return 'Local DMS database — imported HCP exports. Writable jobs come in Phase 2.'
    default:
      return 'Static cache on GitHub Pages — pull down to reload the latest published data (keeps jobs you created on this phone).'
  }
}

export async function fetchInvoicing(): Promise<InvoicingPayload> {
  const urls = [
    `${API_BASE}/api/hcp/invoicing`,
    `${import.meta.env.BASE_URL}data/hcp-invoicing.json`,
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      return (await res.json()) as InvoicingPayload
    } catch {
      continue
    }
  }

  const dashboard = await fetchHCPDashboard()
  if (dashboard.invoicing) return dashboard.invoicing

  throw new Error('Could not load invoicing data')
}
