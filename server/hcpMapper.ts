import type { JobPriority, JobStatus, RepairJob } from '../src/types/index.js'
import type { HCPJob, HCPJobsExport } from './hcpClient.js'

const CANCELED_STATUSES = new Set(['user canceled', 'pro canceled'])

const STATUS_MAP: Record<string, JobStatus> = {
  'needs scheduling': 'received',
  scheduled: 'received',
  'in progress': 'in-repair',
  'complete unrated': 'ready',
  'complete rated': 'picked-up',
}

export function mapHCPStatus(workStatus?: string, job?: HCPJob): JobStatus {
  if (!workStatus) return 'received'
  const lower = workStatus.toLowerCase()
  if (CANCELED_STATUSES.has(lower)) return 'received'

  const completedAt = job?.work_timestamps?.completed_at
  if (lower.startsWith('complete')) {
    return completedAt ? 'picked-up' : 'ready'
  }

  if (lower === 'in progress') {
    const started = job?.work_timestamps?.started_at
    if (started && !completedAt) return 'in-repair'
    return 'in-repair'
  }

  if (lower === 'scheduled') return 'diagnosing'

  return STATUS_MAP[lower] ?? 'received'
}

export function mapHCPPriority(job: HCPJob): JobPriority {
  const text = `${job.description ?? ''} ${(job.tags ?? []).join(' ')}`.toLowerCase()
  if (text.includes('urgent') || text.includes('asap')) return 'urgent'
  if (text.includes('priority') || text.includes('fleet')) return 'high'
  return 'normal'
}

function customerName(job: HCPJob): string {
  const c = job.customer
  if (!c) return 'Unknown customer'
  if (c.company?.trim()) return c.company.trim()
  const name = [c.first_name, c.last_name].filter(Boolean).join(' ')
  return name || 'Unknown customer'
}

function parseMakeModel(job: HCPJob): { make: string; model: string; year?: number } {
  const tags = job.customer?.tags ?? job.tags ?? []
  const tagStr = tags.join(' ')
  const desc = job.description ?? ''

  const makes = ['Club Car', 'EZGO', 'EZ-GO', 'Yamaha', 'Star EV', 'Icon']
  let make = 'Other'
  for (const m of makes) {
    if (tagStr.toLowerCase().includes(m.toLowerCase()) || desc.toLowerCase().includes(m.toLowerCase())) {
      make = m === 'EZ-GO' ? 'EZGO' : m
      break
    }
  }

  const models = ['Precedent', 'Onward', 'Tempo', 'RXV', 'TXT', 'Drive2', 'UMAX', 'Drive']
  let model = ''
  for (const m of models) {
    if (tagStr.toLowerCase().includes(m.toLowerCase())) {
      model = m
      break
    }
  }

  const yearMatch = tagStr.match(/\b(19|20)\d{2}\b/)
  const year = yearMatch ? Number(yearMatch[0]) : undefined

  return { make, model: model || 'Golf Cart', year }
}

function assignedTech(job: HCPJob): string | undefined {
  const emp = job.assigned_employees?.[0]
  if (!emp) return undefined
  return [emp.first_name, emp.last_name].filter(Boolean).join('. ') || undefined
}

export function mapHCPJobToRepairJob(job: HCPJob): RepairJob | null {
  const workStatus = job.work_status?.toLowerCase() ?? ''
  if (CANCELED_STATUSES.has(workStatus) || job.deleted_at) return null

  const { make, model, year } = parseMakeModel(job)
  const status = mapHCPStatus(workStatus, job)
  const revenue = job.total_amount ? Math.round(job.total_amount / 100) : undefined

  return {
    id: job.invoice_number ? `HCP-${job.invoice_number}` : job.id,
    customerName: customerName(job),
    make,
    model,
    year,
    issueDescription: job.description ?? 'No description',
    priority: mapHCPPriority(job),
    assignedTech: assignedTech(job),
    status,
    createdAt: job.created_at ?? new Date().toISOString(),
    updatedAt: job.updated_at ?? job.created_at ?? new Date().toISOString(),
    estimatedRevenue: revenue,
    completedAt: job.work_timestamps?.completed_at ?? undefined,
    hcpId: job.id,
    outstandingBalance: job.outstanding_balance
      ? Math.round(job.outstanding_balance / 100)
      : undefined,
  }
}

export function mapHCPJobsExport(exportData: HCPJobsExport): RepairJob[] {
  return exportData.jobs
    .map(mapHCPJobToRepairJob)
    .filter((j): j is RepairJob => j !== null)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function isActiveHCPJob(job: HCPJob): boolean {
  const s = job.work_status?.toLowerCase() ?? ''
  return !CANCELED_STATUSES.has(s) && !s.startsWith('complete') && !job.canceled_at
}

export function computeHCPExtras(jobs: HCPJob[]): {
  fleetAccounts: number
  partsOnOrder: number
  lowStockAlerts: number
} {
  const fleetCustomers = new Set<string>()
  for (const job of jobs) {
    const c = job.customer
    if (!c?.id) continue
    if (c.company?.trim() || c.kind === 'commercial' || c.kind === 'business') {
      fleetCustomers.add(c.id)
    }
  }

  const waitingParts = jobs.filter((j) => {
    const text = `${j.description ?? ''} ${(j.notes ?? []).map((n) => n.content).join(' ')}`.toLowerCase()
    return isActiveHCPJob(j) && (text.includes('part') || text.includes('order'))
  }).length

  return {
    fleetAccounts: fleetCustomers.size,
    partsOnOrder: waitingParts,
    lowStockAlerts: 0,
  }
}

export function trimJobsExport(exportData: HCPJobsExport, maxCompleted = 120): HCPJobsExport {
  const active = exportData.jobs.filter(isActiveHCPJob)
  const completed = exportData.jobs
    .filter((j) => j.work_status?.toLowerCase().startsWith('complete'))
    .sort((a, b) => {
      const aT = a.work_timestamps?.completed_at ?? a.updated_at ?? ''
      const bT = b.work_timestamps?.completed_at ?? b.updated_at ?? ''
      return bT.localeCompare(aT)
    })
    .slice(0, maxCompleted)

  const jobs = [...active, ...completed]
  return {
    synced_at: exportData.synced_at ?? new Date().toISOString(),
    count: jobs.length,
    jobs,
  }
}
