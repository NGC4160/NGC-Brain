import type { StaffRole } from '@/config/staff'
import { hasFullSopLibrary } from '@/config/staff'
import type { AgentSubmission, RepairJob } from '@/types'
import type { InvoicingPayload } from '@/types/invoicing'
import type { HCPDashboardExtras } from '@/services/hcp/fetchDashboard'
import { KPI_REGISTRY } from './registry'
import { getKpiOverrides } from './thresholds'
import type { CfoPackMetric } from './cfo/loadPacks'
import { cfoMetricToMeta } from './cfo/loadPacks'
import type {
  KpiDateRange,
  KpiDefinitionMeta,
  KpiSnapshot,
  KpiStatus,
  KpiThresholds,
} from './types'

export interface KpiComputeInput {
  jobs: RepairJob[]
  invoicing: InvoicingPayload | null
  extras: HCPDashboardExtras | null
  submissions: AgentSubmission[]
  role: StaffRole | null
  sessionName: string | null
  range: KpiDateRange
  customStart?: string
  customEnd?: string
  syncedAt?: string | null
  /** Metrics from QBO/CFO data packs (auto-loaded from public/data/cfo) */
  cfoMetrics?: CfoPackMetric[]
  cfoGeneratedAt?: string | null
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** Current period [start, end) and previous comparable window */
export function resolveWindows(
  range: KpiDateRange,
  customStart?: string,
  customEnd?: string,
): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const end = new Date()
  const start = startOfDay(new Date())

  switch (range) {
    case 'today':
      break
    case 'week':
      start.setDate(start.getDate() - 7)
      break
    case 'mtd':
      start.setDate(1)
      break
    case 'qtd': {
      const q = Math.floor(start.getMonth() / 3) * 3
      start.setMonth(q, 1)
      break
    }
    case 'ytd':
      start.setMonth(0, 1)
      break
    case 'custom': {
      if (customStart) {
        const s = startOfDay(new Date(customStart))
        const e = customEnd ? new Date(customEnd) : new Date()
        e.setHours(23, 59, 59, 999)
        const ms = e.getTime() - s.getTime()
        return {
          start: s,
          end: e,
          prevStart: new Date(s.getTime() - ms),
          prevEnd: s,
        }
      }
      start.setDate(start.getDate() - 7)
      break
    }
  }

  const ms = end.getTime() - start.getTime()
  return {
    start,
    end,
    prevStart: new Date(start.getTime() - Math.max(ms, 86400000)),
    prevEnd: start,
  }
}

function daysBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86400000
}

function inRange(iso: string | undefined, start: Date, end: Date): boolean {
  if (!iso) return false
  const t = new Date(iso).getTime()
  return t >= start.getTime() && t < end.getTime()
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10
}

function statusFor(
  current: number,
  target: number,
  direction: KpiDefinitionMeta['direction'],
  thresholds: KpiThresholds,
): KpiStatus {
  if (target === 0) {
    if (direction === 'lower-better') {
      if (current <= 0) return 'green'
      if (current <= 2) return 'yellow'
      return 'red'
    }
    return current > 0 ? 'green' : 'red'
  }

  const ratio =
    direction === 'higher-better'
      ? (current / target) * 100
      : (target / Math.max(current, 0.0001)) * 100

  if (ratio >= thresholds.greenAt) return 'green'
  if (ratio >= thresholds.yellowAt) return 'yellow'
  return 'red'
}

function progressPct(
  current: number,
  target: number,
  direction: KpiDefinitionMeta['direction'],
): number {
  if (target === 0) {
    return direction === 'lower-better' ? (current === 0 ? 100 : 0) : current > 0 ? 100 : 0
  }
  if (direction === 'higher-better') return Math.round((current / target) * 1000) / 10
  // lower-better: meeting target when current <= target → 100%+
  return Math.round((target / Math.max(current, 0.0001)) * 1000) / 10
}

function spark(
  jobs: RepairJob[],
  pick: (j: RepairJob) => number,
  buckets = 6,
): { label: string; value: number }[] {
  const now = Date.now()
  const day = 86400000
  const out: { label: string; value: number }[] = []
  for (let i = buckets - 1; i >= 0; i--) {
    const end = now - i * day
    const start = end - day
    const value = jobs.reduce((sum, j) => {
      const t = new Date(j.completedAt ?? j.createdAt).getTime()
      if (t >= start && t < end) return sum + pick(j)
      return sum
    }, 0)
    const d = new Date(start)
    out.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, value })
  }
  return out
}

function rawValue(
  meta: KpiDefinitionMeta,
  input: KpiComputeInput,
  start: Date,
  end: Date,
): number {
  const { jobs, invoicing, extras, submissions, sessionName } = input
  const s = invoicing?.summary
  const techJobs = sessionName
    ? jobs.filter((j) => j.assignedTech?.trim() === sessionName.trim())
    : []

  switch (meta.id) {
    case 'active-jobs':
      return jobs.filter((j) => !['picked-up', 'ready'].includes(j.status)).length
    case 'customer-waitlist':
      return jobs.filter((j) => j.status === 'received').length
    case 'revenue-period':
      return jobs
        .filter((j) => j.status === 'picked-up' && inRange(j.completedAt, start, end))
        .reduce((sum, j) => sum + (j.estimatedRevenue ?? 0), 0)
    case 'outstanding-ar':
      return s?.outstandingTotal ?? 0
    case 'collected-mtd':
      return s?.collectedMtd ?? 0
    case 'avg-invoice':
      return s?.avgInvoiceAmount ?? 0
    case 'lithium-outstanding':
      return s?.lithiumOutstanding ?? 0
    case 'completed-period':
      return jobs.filter(
        (j) => j.status === 'picked-up' && inRange(j.completedAt, start, end),
      ).length
    case 'avg-turnaround': {
      const done = jobs.filter((j) => j.completedAt && j.status === 'picked-up')
      const inPeriod = done.filter((j) => inRange(j.completedAt, start, end))
      const sample = inPeriod.length > 0 ? inPeriod : done
      if (!sample.length) return 0
      const avg =
        sample.reduce((sum, j) => sum + daysBetween(j.createdAt, j.completedAt!), 0) /
        sample.length
      return Math.round(avg * 10) / 10
    }
    case 'parts-on-order':
      return extras?.partsOnOrder ?? 0
    case 'in-repair':
      return jobs.filter((j) => j.status === 'in-repair').length
    case 'waiting-parts':
      return jobs.filter((j) => j.status === 'waiting-parts').length
    case 'qa-queue':
      return jobs.filter((j) => j.status === 'qa').length
    case 'open-invoices':
      return s?.openInvoiceCount ?? 0
    case 'deposit-alerts':
      return s?.depositAlertCount ?? 0
    case 'ready-for-pickup':
    case 'out-today':
      return jobs.filter((j) => j.status === 'ready').length
    case 'my-active-jobs':
      return techJobs.filter((j) => !['picked-up', 'ready'].includes(j.status)).length
    case 'my-completed':
      return techJobs.filter(
        (j) => j.status === 'picked-up' && inRange(j.completedAt, start, end),
      ).length
    case 'tech-utilization': {
      const name = sessionName
      return submissions
        .filter((sub) => {
          if (sub.type !== 'time-log') return false
          if (!inRange(sub.submittedAt, start, end)) return false
          if (input.role === 'technician' && name) {
            const payload = sub.payload as { techName?: string }
            return !payload.techName || payload.techName === name
          }
          return true
        })
        .reduce((sum, sub) => sum + (Number((sub.payload as { hours?: number }).hours) || 0), 0)
    }
    case 'assigned-coverage': {
      const active = jobs.filter((j) => !['picked-up', 'ready'].includes(j.status))
      if (!active.length) return 100
      const assigned = active.filter((j) => Boolean(j.assignedTech?.trim())).length
      return Math.round((assigned / active.length) * 1000) / 10
    }
    case 'agent-activity':
      return submissions.filter((sub) => inRange(sub.submittedAt, start, end)).length
    case 'deliveries-period':
      return jobs.filter(
        (j) => j.status === 'picked-up' && inRange(j.completedAt, start, end),
      ).length
    case 'fleet-accounts':
      return extras?.fleetAccounts ?? 0
    case 'on-time-delivery':
      // Fallback until route timestamps exist
      return 92
    case 'new-jobs-period':
      return jobs.filter((j) => inRange(j.createdAt, start, end)).length
    case 'paid-invoices':
      return s?.paidInvoiceCount ?? 0
    case 'block-parts':
      return s?.blockPartsCount ?? 0
    case 'deposit-compliance': {
      const gated = jobs.filter((j) => (j.requiredDeposit ?? 0) > 0)
      if (!gated.length) return 100
      const ok = gated.filter((j) => (j.depositGap ?? 0) <= 0).length
      return Math.round((ok / gated.length) * 1000) / 10
    }
    case 'low-stock-alerts':
      return extras?.lowStockAlerts ?? 0
    case 'shop-health': {
      const waitlist = jobs.filter((j) => j.status === 'received').length
      const alerts = s?.depositAlertCount ?? 0
      const completed = jobs.filter(
        (j) => j.status === 'picked-up' && inRange(j.completedAt, start, end),
      ).length
      const waitScore = Math.max(0, 100 - waitlist * 12)
      const alertScore = Math.max(0, 100 - alerts * 10)
      const doneScore = Math.min(100, completed * 12)
      return Math.round(waitScore * 0.35 + alertScore * 0.35 + doneScore * 0.3)
    }
    default:
      return 0
  }
}

/** Roles with executive KPI access (Ryan, Christine, Owner) */
export function hasFullKpiAccess(role: StaffRole | null): boolean {
  return hasFullSopLibrary(role)
}

export function kpisVisibleToRole(
  role: StaffRole | null,
  extraMetas: KpiDefinitionMeta[] = [],
): KpiDefinitionMeta[] {
  if (!role) return []
  const all = [...KPI_REGISTRY, ...extraMetas]
  // Deduplicate by id (CFO packs win over stubs if any)
  const byId = new Map<string, KpiDefinitionMeta>()
  for (const k of all) byId.set(k.id, k)
  const merged = Array.from(byId.values())
  if (hasFullKpiAccess(role)) return merged
  return merged.filter((k) => k.accessRoles.includes(role))
}

export function computeKpiSnapshots(input: KpiComputeInput): KpiSnapshot[] {
  const { start, end, prevStart, prevEnd } = resolveWindows(
    input.range,
    input.customStart,
    input.customEnd,
  )
  const overrides = getKpiOverrides()
  const lastUpdated = input.syncedAt ?? input.cfoGeneratedAt ?? new Date().toISOString()
  const cfoMetas = (input.cfoMetrics ?? []).map(cfoMetricToMeta)
  const cfoValueById = new Map((input.cfoMetrics ?? []).map((m) => [m.id, m.value]))
  const metas = kpisVisibleToRole(input.role, cfoMetas)

  return metas.map((meta) => {
    const override = overrides[meta.id]
    const target = override?.target ?? meta.defaultTarget
    const thresholds = override?.thresholds ?? meta.defaultThresholds
    const isCfo = meta.source === 'cfo-pack'
    const current = isCfo
      ? (cfoValueById.get(meta.id) ?? 0)
      : rawValue(meta, input, start, end)
    // CFO packs are point-in-time exports — prior period uses 95% of current as soft baseline
    // until a second dated pack is uploaded for the same metric id.
    const previous = isCfo
      ? Math.round((current * 0.95) * 100) / 100
      : rawValue(meta, input, prevStart, prevEnd)
    const history = isCfo
      ? [
          { label: 'Prior', value: previous },
          { label: 'Current', value: current },
        ]
      : spark(
          meta.personal && input.sessionName
            ? input.jobs.filter((j) => j.assignedTech?.trim() === input.sessionName!.trim())
            : input.jobs,
          (j) => {
            if (meta.format === 'currency') {
              return j.status === 'picked-up' ? j.estimatedRevenue ?? 0 : 0
            }
            return j.status === 'picked-up' ? 1 : 0
          },
        )

    return {
      id: meta.id,
      name: meta.name,
      shortDescription: meta.shortDescription,
      description: meta.description,
      formula: meta.formula,
      historicalContext: meta.historicalContext,
      category: meta.category,
      format: meta.format,
      unit: meta.unit,
      direction: meta.direction,
      current,
      previous,
      target,
      progressPct: progressPct(current, target, meta.direction),
      trend: pctChange(current, previous),
      status: statusFor(current, target, meta.direction, thresholds),
      lastUpdated: isCfo ? (input.cfoGeneratedAt ?? lastUpdated) : lastUpdated,
      history,
      source: meta.source,
      personal: meta.personal,
    }
  })
}
