import type { JobPriority, JobStatus, RepairJob } from '@/types'
import { evaluateDepositGate } from '@/lib/depositGates'
import { generateId } from '@/lib/utils'

const API_BASE = import.meta.env.VITE_HCP_API_URL ?? ''
const LOCAL_KEY = 'ngc-writable-work-orders-v1'
const hasWritableApi = Boolean(API_BASE)

export interface WorkOrderInput {
  customerName: string
  make: string
  model: string
  year?: number
  serialVin?: string
  issueDescription: string
  priority?: JobPriority
  assignedTech?: string
  status?: JobStatus
  estimatedRevenue?: number
  paidAmount?: number
  force?: boolean
}

/** Drop undefined keys so partial updates do not wipe fields. */
function definedOnly<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>
}

function enrich(job: RepairJob): RepairJob {
  const gate = evaluateDepositGate({
    description: job.issueDescription ?? '',
    totalAmount: job.estimatedRevenue ?? 0,
    paidAmount: job.paidAmount ?? 0,
    status: job.status,
  })
  return {
    ...job,
    outstandingBalance:
      job.outstandingBalance ??
      Math.max(0, (job.estimatedRevenue ?? 0) - (job.paidAmount ?? 0)),
    jobType: gate.jobType,
    requiredDeposit: gate.requiredDeposit || undefined,
    depositGap: gate.gapAmount || undefined,
    depositBlocked: gate.blocked || undefined,
    depositMessage: gate.message || undefined,
  }
}

function loadLocal(): RepairJob[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RepairJob[]
    return Array.isArray(parsed) ? parsed.map(enrich) : []
  } catch {
    return []
  }
}

function saveLocal(jobs: RepairJob[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(jobs))
  } catch (err) {
    console.warn('Could not persist work orders to localStorage', err)
  }
}

/** Prefer the newer copy by updatedAt; local edits win ties. */
function pickNewer(a: RepairJob, b: RepairJob): RepairJob {
  const aTime = new Date(a.updatedAt).getTime()
  const bTime = new Date(b.updatedAt).getTime()
  if (bTime > aTime) return enrich(b)
  if (aTime > bTime) return enrich(a)
  return enrich(b)
}

function mergeJobs(remote: RepairJob[], local: RepairJob[]): RepairJob[] {
  const map = new Map<string, RepairJob>()
  for (const job of remote) map.set(job.id, enrich(job))
  for (const job of local) {
    const existing = map.get(job.id)
    map.set(job.id, existing ? pickNewer(existing, job) : enrich(job))
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

function upsertLocal(job: RepairJob) {
  const next = enrich(job)
  saveLocal([next, ...loadLocal().filter((j) => j.id !== next.id)])
  return next
}

export async function probeWritableApi(): Promise<boolean> {
  if (!hasWritableApi) return false
  try {
    const res = await fetch(`${API_BASE}/api/health`)
    return res.ok
  } catch {
    return false
  }
}

export async function fetchWritableJobs(remoteJobs: RepairJob[] = []): Promise<{
  jobs: RepairJob[]
  mode: 'api' | 'local'
}> {
  if (hasWritableApi) {
    try {
      const res = await fetch(`${API_BASE}/api/dms/jobs`)
      if (res.ok) {
        const data = (await res.json()) as { jobs: RepairJob[] }
        const apiJobs = (data.jobs ?? []).map(enrich)
        const local = loadLocal()
        // Keep device-only drafts and any newer local edits (status moves, etc.)
        const merged = mergeJobs(apiJobs, local)
        saveLocal(merged)
        return { jobs: merged, mode: 'api' }
      }
    } catch {
      // fall through to local
    }
  }

  const local = loadLocal()
  const merged = mergeJobs(remoteJobs, local)
  // Always persist the merge so later status edits find the job in localStorage
  saveLocal(merged)
  return { jobs: merged, mode: 'local' }
}

export async function createWritableJob(input: WorkOrderInput): Promise<RepairJob> {
  const status = input.status ?? 'received'
  const gate = evaluateDepositGate({
    description: input.issueDescription,
    totalAmount: input.estimatedRevenue ?? 0,
    paidAmount: input.paidAmount ?? 0,
    status,
  })
  if (gate.blocked && !input.force) {
    throw new Error(gate.message ?? 'Deposit gate blocked this action')
  }

  if (hasWritableApi) {
    try {
      const res = await fetch(`${API_BASE}/api/dms/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = (await res.json()) as { ok?: boolean; job?: RepairJob; error?: string }
      if (res.ok && data.job) {
        return upsertLocal(data.job)
      }
      if (res.status !== 404 && data.error) throw new Error(data.error)
    } catch (err) {
      if (err instanceof Error && err.message.includes('Deposit gate')) throw err
      // local fallback
    }
  }

  const ts = new Date().toISOString()
  return upsertLocal({
    id: generateId('wo_local'),
    customerName: input.customerName,
    make: input.make,
    model: input.model,
    year: input.year,
    serialVin: input.serialVin,
    issueDescription: input.issueDescription,
    priority: input.priority ?? 'normal',
    assignedTech: input.assignedTech,
    status,
    createdAt: ts,
    updatedAt: ts,
    estimatedRevenue: input.estimatedRevenue,
    paidAmount: input.paidAmount,
    completedAt: status === 'picked-up' ? ts : undefined,
  })
}

export async function updateWritableJob(
  id: string,
  patch: Partial<WorkOrderInput>,
  fallback?: RepairJob,
): Promise<RepairJob> {
  const cleaned = definedOnly(patch)
  let current = loadLocal().find((j) => j.id === id) ?? fallback
  if (!current) {
    throw new Error(`Work order ${id} not found`)
  }

  // Make sure HCP/cache jobs exist in localStorage before we edit them
  if (!loadLocal().some((j) => j.id === id)) {
    current = upsertLocal(current)
  }

  const mergedForGate = {
    description: cleaned.issueDescription ?? current.issueDescription ?? '',
    totalAmount: cleaned.estimatedRevenue ?? current.estimatedRevenue ?? 0,
    paidAmount: cleaned.paidAmount ?? current.paidAmount ?? 0,
    status: cleaned.status ?? current.status ?? 'received',
  }
  const gate = evaluateDepositGate(mergedForGate)
  if (gate.blocked && !cleaned.force) {
    throw new Error(gate.message ?? 'Deposit gate blocked this status change')
  }

  if (hasWritableApi) {
    try {
      const res = await fetch(`${API_BASE}/api/dms/jobs/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaned),
      })
      const data = (await res.json()) as { ok?: boolean; job?: RepairJob; error?: string }
      if (res.ok && data.job) {
        return upsertLocal(data.job)
      }
      if (data.error && !data.error.includes('not found')) throw new Error(data.error)
    } catch (err) {
      if (err instanceof Error && err.message.includes('Deposit gate')) throw err
    }
  }

  const ts = new Date().toISOString()
  const nextStatus = cleaned.status ?? current.status
  return upsertLocal({
    ...current,
    ...cleaned,
    priority: cleaned.priority ?? current.priority,
    status: nextStatus,
    updatedAt: ts,
    completedAt:
      nextStatus === 'picked-up' ? current.completedAt ?? ts : current.completedAt,
  })
}
