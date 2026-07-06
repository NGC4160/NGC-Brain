const API_BASE = import.meta.env.VITE_HCP_API_URL ?? ''

export interface ImportStats {
  customersCreated: number
  customersUpdated: number
  vehiclesCreated: number
  workOrdersCreated: number
  workOrdersUpdated: number
  pricebookCreated: number
  pricebookUpdated: number
  skipped: number
  errors: string[]
}

export interface ImportStatus {
  counts: {
    customers: number
    vehicles: number
    workOrders: number
    pricebookItems: number
  }
  lastImport: {
    id: string
    import_type: string
    source_file: string
    started_at: string
    completed_at: string
    status: string
    stats: string
    errors: string
  } | null
  bookkeeper: string
}

export interface QboStatus {
  configured: boolean
  connected: boolean
  realmId: string | null
  companyName: string | null
  bookkeeper: string
}

export async function fetchImportStatus(): Promise<ImportStatus> {
  const res = await fetch(`${API_BASE}/api/import/status`)
  if (!res.ok) throw new Error('Could not load import status')
  return res.json() as Promise<ImportStatus>
}

export async function runHcpImport(directory?: string): Promise<{ stats: ImportStats; status: ImportStatus }> {
  const res = await fetch(`${API_BASE}/api/import/hcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(directory ? { directory } : {}),
  })
  const data = (await res.json()) as { ok: boolean; stats?: ImportStats; status?: ImportStatus; error?: string }
  if (!res.ok || !data.ok) throw new Error(data.error ?? 'Import failed')
  return { stats: data.stats!, status: data.status! }
}

export async function fetchQboStatus(): Promise<QboStatus> {
  const res = await fetch(`${API_BASE}/api/qbo/status`)
  if (!res.ok) throw new Error('Could not load QBO status')
  return res.json() as Promise<QboStatus>
}

export async function getQboConnectUrl(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/qbo/connect`)
  const data = (await res.json()) as { url?: string; error?: string }
  if (!res.ok) throw new Error(data.error ?? 'QBO not configured')
  return data.url!
}

export const HCP_EXPORT_FILE_LIST = [
  'jobs.json',
  'company.json',
  'pricebook_services.json',
  'pricebook_material_categories.json',
  'NeighborhoodGolfCarts_pricebook_export.csv',
  'api_sync_manifest.json',
] as const
