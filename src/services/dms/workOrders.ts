import type { JobPriority, JobStatus, RepairJob } from '@/types'
import { evaluateDepositGate } from '@/lib/depositGates'
import { generateId } from '@/lib/utils'

const API_BASE = import.meta.env.VITE_HCP_API_URL ?? ''
const LOCAL_KEY = 'ngc-writable-work-orders-v1'

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

function enrich(job: RepairJob): RepairJob {
  const gate = evaluateDepositGate({
    description: job.issueDescription,
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
  localStorage.setItem(LOCAL_KEY, JSON.stringify(jobs))
}

function mergeJobs(remote: RepairJob[], local: RepairJob[]): RepairJob[] {
  const map = new Map<string, RepairJob>()
  for (const job of remote) map.set(job.id, enrich(job))
  for (const job of local) map.set(job.id, enrich(job))
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export async function probeWritableApi(): Promise<boolean> {
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
  try {
    const res = await fetch(`${API_BASE}/api/dms/jobs`)
    if (res.ok) {
      const data = (await res.json()) as { jobs: RepairJob[] }
      const apiJobs = (data.jobs ?? []).map(enrich)
      // Keep any purely-local drafts that aren't on the server yet
      const localOnly = loadLocal().filter(
        (j) => !apiJobs.some((a) => a.id === j.id) && j.id.startsWith('wo_local'),
      )
      const merged = [...localOnly, ...apiJobs]
      saveLocal(merged)
      return { jobs: merged, mode: 'api' }
    }
  } catch {
    // fall through to local
  }

  const local = loadLocal()
  if (local.length === 0 && remoteJobs.length > 0) {
    const seeded = remoteJobs.map(enrich)
    saveLocal(seeded)
    return { jobs: seeded, mode: 'local' }
  }
  return { jobs: mergeJobs(remoteJobs, local), mode: 'local' }
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

  try {
    const res = await fetch(`${API_BASE}/api/dms/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const data = (await res.json()) as { ok?: boolean; job?: RepairJob; error?: string }
    if (res.ok && data.job) {
      const job = enrich(data.job)
      const local = loadLocal().filter((j) => j.id !== job.id)
      saveLocal([job, ...local])
      return job
    }
    if (res.status !== 404 && data.error) throw new Error(data.error)
  } catch (err) {
    if (err instanceof Error && err.message.includes('Deposit gate')) throw err
    // local fallback
  }

  const ts = new Date().toISOString()
  const job = enrich({
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
  saveLocal([job, ...loadLocal().filter((j) => j.id !== job.id)])
  return job
}

export async function updateWritableJob(
  id: string,
  patch: Partial<WorkOrderInput>,
): Promise<RepairJob> {
  const current = loadLocal().find((j) => j.id === id)
  const mergedForGate = {
    description: patch.issueDescription ?? current?.issueDescription ?? '',
    totalAmount: patch.estimatedRevenue ?? current?.estimatedRevenue ?? 0,
    paidAmount: patch.paidAmount ?? current?.paidAmount ?? 0,
    status: patch.status ?? current?.status ?? 'received',
  }
  const gate = evaluateDepositGate(mergedForGate)
  if (gate.blocked && !patch.force) {
    throw new Error(gate.message ?? 'Deposit gate blocked this status change')
  }

  try {
    const res = await fetch(`${API_BASE}/api/dms/jobs/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = (await res.json()) as { ok?: boolean; job?: RepairJob; error?: string }
    if (res.ok && data.job) {
      const job = enrich(data.job)
      saveLocal([job, ...loadLocal().filter((j) => j.id !== job.id)])
      return job
    }
    if (data.error && !data.error.includes('not found')) throw new Error(data.error)
  } catch (err) {
    if (err instanceof Error && err.message.includes('Deposit gate')) throw err
  }

  if (!current) throw new Error(`Work order ${id} not found`)
  const ts = new Date().toISOString()
  const next = enrich({
    ...current,
    ...patch,
    priority: patch.priority ?? current.priority,
    status: patch.status ?? current.status,
    updatedAt: ts,
    completedAt:
      (patch.status ?? current.status) === 'picked-up'
        ? current.completedAt ?? ts
        : current.completedAt,
  })
  saveLocal([next, ...loadLocal().filter((j) => j.id !== id)])
  return next
}
