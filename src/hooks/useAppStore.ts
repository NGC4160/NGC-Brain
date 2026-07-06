import { useCallback, useEffect, useMemo, useState } from 'react'
import { mockJobs, mockResources } from '@/data/mockData'
import type {
  AgentSubmission,
  AppState,
  DateRangePreset,
  KpiValue,
  RepairJob,
} from '@/types'
import { mockStaticKpis } from '@/data/mockData'
import {
  fetchHCPDashboard,
  type HCPDashboardExtras,
  type HCPDashboardPayload,
} from '@/services/hcp/fetchDashboard'

const STORAGE_KEY = 'golf-cart-dashboard-state'

interface PersistedState {
  submissions: AgentSubmission[]
  resources: typeof mockResources
}

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      return {
        submissions: parsed.submissions ?? [],
        resources: parsed.resources?.length ? parsed.resources : mockResources,
      }
    }
  } catch {
    // fall through
  }
  return { submissions: [], resources: mockResources }
}

function savePersisted(state: PersistedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function getRangeStart(preset: DateRangePreset): Date {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  switch (preset) {
    case 'today':
      return start
    case 'week': {
      start.setDate(start.getDate() - 7)
      return start
    }
    case 'month': {
      start.setDate(1)
      return start
    }
    default:
      start.setDate(start.getDate() - 7)
      return start
  }
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime()
  return ms / (1000 * 60 * 60 * 24)
}

function computeKpis(
  jobs: RepairJob[],
  preset: DateRangePreset,
  extras?: HCPDashboardExtras | null,
): KpiValue[] {
  const rangeStart = getRangeStart(preset)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const twoWeeksAgo = new Date(now)
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  const activeJobs = jobs.filter(
    (j) => !['picked-up', 'ready'].includes(j.status),
  ).length

  const completedThisWeek = jobs.filter(
    (j) =>
      j.completedAt &&
      new Date(j.completedAt) >= weekAgo &&
      j.status === 'picked-up',
  ).length

  const completedPriorWeek = jobs.filter(
    (j) =>
      j.completedAt &&
      new Date(j.completedAt) >= twoWeeksAgo &&
      new Date(j.completedAt) < weekAgo &&
      j.status === 'picked-up',
  ).length

  const mtdJobs = jobs.filter(
    (j) =>
      j.completedAt &&
      new Date(j.completedAt) >= monthStart &&
      j.status === 'picked-up',
  )
  const revenueMtd = mtdJobs.reduce((sum, j) => sum + (j.estimatedRevenue ?? 0), 0)

  const priorMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const priorMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  const priorMtdJobs = jobs.filter(
    (j) =>
      j.completedAt &&
      new Date(j.completedAt) >= priorMonthStart &&
      new Date(j.completedAt) <= priorMonthEnd &&
      j.status === 'picked-up',
  )
  const priorRevenueMtd = priorMtdJobs.reduce(
    (sum, j) => sum + (j.estimatedRevenue ?? 0),
    0,
  )

  const completedWithDates = jobs.filter(
    (j) => j.completedAt && j.status === 'picked-up',
  )
  const avgTurnaround =
    completedWithDates.length > 0
      ? completedWithDates.reduce(
          (sum, j) => sum + daysBetween(j.createdAt, j.completedAt!),
          0,
        ) / completedWithDates.length
      : 0

  const waitlist = jobs.filter((j) => j.status === 'received').length
  const inRangeJobs = jobs.filter((j) => new Date(j.createdAt) >= rangeStart)

  const staticExtras = extras ?? mockStaticKpis

  return [
    {
      id: 'active-jobs',
      value: activeJobs,
      previousValue: Math.max(activeJobs - 1, 0),
      trendLabel: `${inRangeJobs.length} new in period`,
    },
    {
      id: 'completed-week',
      value: completedThisWeek,
      previousValue: completedPriorWeek,
    },
    {
      id: 'revenue-mtd',
      value: revenueMtd,
      previousValue: priorRevenueMtd,
    },
    {
      id: 'avg-turnaround',
      value: Math.round(avgTurnaround * 10) / 10,
      previousValue: Math.round((avgTurnaround + 0.3) * 10) / 10,
    },
    {
      id: 'parts-on-order',
      value: staticExtras.partsOnOrder,
      previousValue: Math.max(staticExtras.partsOnOrder - 1, 0),
    },
    {
      id: 'low-stock-alerts',
      value: staticExtras.lowStockAlerts,
      previousValue: staticExtras.lowStockAlerts,
    },
    {
      id: 'customer-waitlist',
      value: waitlist,
      previousValue: Math.max(waitlist - 1, 0),
    },
    {
      id: 'fleet-accounts',
      value: staticExtras.fleetAccounts,
      previousValue: staticExtras.fleetAccounts,
    },
  ]
}

export function useAppStore() {
  const [persisted, setPersisted] = useState<PersistedState>(loadPersisted)
  const [fallbackJobs, setFallbackJobs] = useState<RepairJob[]>(mockJobs)
  const [hcpJobs, setHcpJobs] = useState<RepairJob[]>([])
  const [hcpMeta, setHcpMeta] = useState<HCPDashboardPayload | null>(null)
  const [hcpLoading, setHcpLoading] = useState(true)
  const [hcpError, setHcpError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRangePreset>('week')
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('golf-cart-dark-mode') === 'true'
  })

  const jobs = hcpJobs.length > 0 ? hcpJobs : fallbackJobs
  const hcpConnected = hcpJobs.length > 0

  const loadHcp = useCallback(async () => {
    setHcpLoading(true)
    setHcpError(null)
    try {
      const data = await fetchHCPDashboard()
      setHcpJobs(data.jobs)
      setHcpMeta(data)
    } catch (err) {
      setHcpError(err instanceof Error ? err.message : 'Failed to load HCP data')
    } finally {
      setHcpLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadHcp()
  }, [loadHcp])

  useEffect(() => {
    savePersisted(persisted)
  }, [persisted])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('golf-cart-dark-mode', String(darkMode))
  }, [darkMode])

  const kpis = useMemo(
    () => computeKpis(jobs, dateRange, hcpMeta?.extras),
    [jobs, dateRange, hcpMeta?.extras],
  )

  const addSubmission = useCallback((submission: AgentSubmission) => {
    setPersisted((prev) => ({
      ...prev,
      submissions: [submission, ...prev.submissions],
    }))
  }, [])

  const addJob = useCallback((job: RepairJob) => {
    if (hcpConnected) return
    setFallbackJobs((prev) => [job, ...prev])
  }, [hcpConnected])

  const updateJob = useCallback((jobId: string, updates: Partial<RepairJob>) => {
    if (hcpConnected) return
    setFallbackJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j,
      ),
    )
  }, [hcpConnected])

  const toggleResourcePin = useCallback((resourceId: string) => {
    setPersisted((prev) => ({
      ...prev,
      resources: prev.resources.map((r) =>
        r.id === resourceId ? { ...r, pinned: !r.pinned } : r,
      ),
    }))
  }, [])

  const pinnedResources = useMemo(
    () => persisted.resources.filter((r) => r.pinned),
    [persisted.resources],
  )

  return {
    jobs,
    submissions: persisted.submissions,
    resources: persisted.resources,
    kpis,
    dateRange,
    setDateRange,
    darkMode,
    setDarkMode,
    addSubmission,
    addJob,
    updateJob,
    toggleResourcePin,
    pinnedResources,
    hcpMeta,
    hcpLoading,
    hcpError,
    hcpConnected,
    refreshHcp: loadHcp,
    invoicing: hcpMeta?.invoicing ?? null,
  }
}

export type AppStore = ReturnType<typeof useAppStore>
