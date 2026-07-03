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

const STORAGE_KEY = 'golf-cart-dashboard-state'

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      return {
        jobs: parsed.jobs?.length ? parsed.jobs : mockJobs,
        submissions: parsed.submissions ?? [],
        resources: parsed.resources?.length ? parsed.resources : mockResources,
      }
    }
  } catch {
    // fall through to defaults
  }
  return { jobs: mockJobs, submissions: [], resources: mockResources }
}

function saveState(state: AppState) {
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

function computeKpis(jobs: RepairJob[], preset: DateRangePreset): KpiValue[] {
  const rangeStart = getRangeStart(preset)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const twoWeeksAgo = new Date(now)
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  const activeJobs = jobs.filter(
    (j) => j.status !== 'picked-up' && j.status !== 'ready',
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
      value: mockStaticKpis.partsOnOrder,
      previousValue: mockStaticKpis.partsOnOrder + 2,
    },
    {
      id: 'low-stock-alerts',
      value: mockStaticKpis.lowStockAlerts,
      previousValue: mockStaticKpis.lowStockAlerts - 1,
    },
    {
      id: 'customer-waitlist',
      value: waitlist,
      previousValue: Math.max(waitlist - 1, 0),
    },
    {
      id: 'fleet-accounts',
      value: mockStaticKpis.fleetAccounts,
      previousValue: mockStaticKpis.fleetAccounts,
    },
  ]
}

export function useAppStore() {
  const [state, setState] = useState<AppState>(loadState)
  const [dateRange, setDateRange] = useState<DateRangePreset>('week')
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('golf-cart-dark-mode') === 'true'
  })

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('golf-cart-dark-mode', String(darkMode))
  }, [darkMode])

  const kpis = useMemo(
    () => computeKpis(state.jobs, dateRange),
    [state.jobs, dateRange],
  )

  const addSubmission = useCallback((submission: AgentSubmission) => {
    setState((prev) => ({
      ...prev,
      submissions: [submission, ...prev.submissions],
    }))
  }, [])

  const addJob = useCallback((job: RepairJob) => {
    setState((prev) => ({ ...prev, jobs: [job, ...prev.jobs] }))
  }, [])

  const updateJob = useCallback((jobId: string, updates: Partial<RepairJob>) => {
    setState((prev) => ({
      ...prev,
      jobs: prev.jobs.map((j) =>
        j.id === jobId
          ? { ...j, ...updates, updatedAt: new Date().toISOString() }
          : j,
      ),
    }))
  }, [])

  const toggleResourcePin = useCallback((resourceId: string) => {
    setState((prev) => ({
      ...prev,
      resources: prev.resources.map((r) =>
        r.id === resourceId ? { ...r, pinned: !r.pinned } : r,
      ),
    }))
  }, [])

  const pinnedResources = useMemo(
    () => state.resources.filter((r) => r.pinned),
    [state.resources],
  )

  return {
    ...state,
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
  }
}

export type AppStore = ReturnType<typeof useAppStore>
