const DEFAULT_BASE = 'https://api.housecallpro.com'

export interface HCPClientOptions {
  apiKey: string
  baseUrl?: string
  companyId?: string
}

export class HCPClient {
  private apiKey: string
  private baseUrl: string
  private companyId?: string

  constructor(options: HCPClientOptions) {
    this.apiKey = options.apiKey
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE).replace(/\/$/, '')
    this.companyId = options.companyId
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      Authorization: `Token ${this.apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
    if (this.companyId) h['X-Company-Id'] = this.companyId
    return h
  }

  async request<T>(
    method: string,
    path: string,
    query?: Record<string, string | number | undefined>,
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`
    if (query) {
      const params = new URLSearchParams()
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) params.set(k, String(v))
      }
      const qs = params.toString()
      if (qs) url += `?${qs}`
    }

    const res = await fetch(url, { method: method.toUpperCase(), headers: this.headers() })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`HCP API ${method} ${path} → HTTP ${res.status}: ${body.slice(0, 500)}`)
    }
    const text = await res.text()
    return text ? (JSON.parse(text) as T) : ({} as T)
  }

  async get<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
    return this.request<T>('GET', path, query)
  }

  async getCompany(): Promise<Record<string, unknown>> {
    for (const path of ['/company', '/v1/company', '/api/company']) {
      try {
        return await this.get<Record<string, unknown>>(path)
      } catch {
        continue
      }
    }
    throw new Error('Could not fetch company — check API key permissions')
  }

  async listJobs(page = 1, pageSize = 50): Promise<unknown> {
    for (const path of ['/jobs', '/v1/jobs', '/api/jobs']) {
      try {
        return await this.get(path, { page, page_size: pageSize })
      } catch {
        continue
      }
    }
    throw new Error('Could not list jobs')
  }

  async listAllJobs(maxPages = 10): Promise<HCPJob[]> {
    const all: HCPJob[] = []
    for (let page = 1; page <= maxPages; page++) {
      const data = await this.listJobs(page, 50)
      const jobs = extractList<HCPJob>(data, ['jobs', 'data', 'results'])
      if (!jobs.length) break
      all.push(...jobs)
      if (jobs.length < 50) break
    }
    return all
  }

  async testConnection(): Promise<{ ok: boolean; company?: Record<string, unknown> }> {
    const company = await this.getCompany()
    return { ok: true, company }
  }
}

export interface HCPCustomer {
  id?: string
  first_name?: string
  last_name?: string
  company?: string | null
  kind?: string
  tags?: string[]
}

export interface HCPJob {
  id: string
  invoice_number?: string
  description?: string
  work_status?: string
  total_amount?: number
  outstanding_balance?: number
  subtotal?: number
  created_at?: string
  updated_at?: string
  canceled_at?: string | null
  deleted_at?: string | null
  customer?: HCPCustomer
  assigned_employees?: Array<{ id?: string; first_name?: string; last_name?: string }>
  tags?: string[]
  work_timestamps?: {
    on_my_way_at?: string | null
    started_at?: string | null
    completed_at?: string | null
  }
  notes?: Array<{ content?: string }>
}

export interface HCPJobsExport {
  synced_at?: string
  count?: number
  jobs: HCPJob[]
}

function extractList<T>(data: unknown, keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    for (const key of keys) {
      const val = obj[key]
      if (Array.isArray(val)) return val as T[]
    }
  }
  return []
}

export function createHCPClientFromEnv(): HCPClient | null {
  const apiKey = process.env.HCP_API_KEY?.trim()
  if (!apiKey) return null
  return new HCPClient({
    apiKey,
    baseUrl: process.env.HCP_BASE_URL,
    companyId: process.env.HCP_COMPANY_ID,
  })
}
