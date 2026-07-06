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

export async function fetchHCPDashboard(): Promise<HCPDashboardPayload> {
  const urls = [
    `${API_BASE}/api/dms/dashboard`,
    `${API_BASE}/api/hcp/dashboard`,
    `${import.meta.env.BASE_URL}data/hcp-dashboard.json`,
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url)
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
      return 'Housecall Pro (cached)'
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
