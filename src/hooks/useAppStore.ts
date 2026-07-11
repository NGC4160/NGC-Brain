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
import {
  createWritableJob,
  fetchWritableJobs,
  updateWritableJob,
  type WorkOrderInput,
} from '@/services/dms/workOrders'

const STORAGE_KEY = 'golf-cart-dashboard-state'

interface PersistedState {
  submissions: AgentSubmission[]
  pinnedResourceIds: string[]
}

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState & { pinnedResourceIds?: string[] }
      const pinnedResourceIds =
        parsed.pinnedResourceIds ??
        (parsed.resources ?? [])
          .filter((r) => r.pinned)
          .map((r) => r.id)
      return {
        submissions: parsed.submissions ?? [],
        pinnedResourceIds,
      }
    }
  } catch {
    // fall through
  }
  return {
    submissions: [],
    pinnedResourceIds: mockResources.filter((r) => r.pinned).map((r) => r.id),
  }
}

function mergeResources(pinnedIds: string[]): typeof mockResources {
  const pinned = new Set(pinnedIds)
  return mockResources.map((r) => ({
    ...r,
    pinned: pinned.has(r.id),
  }))
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
  const [jobs, setJobs] = useState<RepairJob[]>(mockJobs)
  const [writeMode, setWriteMode] = useState<'api' | 'local'>('local')
  const [hcpMeta, setHcpMeta] = useState<HCPDashboardPayload | null>(null)
  const [hcpLoading, setHcpLoading] = useState(true)
  const [hcpError, setHcpError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRangePreset>('week')
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('golf-cart-dark-mode') === 'true'
  })

  const loadHcp = useCallback(async () => {
    setHcpLoading(true)
    setHcpError(null)
    try {
      const data = await fetchHCPDashboard()
      setHcpMeta(data)
      const writable = await fetchWritableJobs(data.jobs)
      setJobs(writable.jobs.length ? writable.jobs : data.jobs)
      setWriteMode(writable.mode)
    } catch (err) {
      setHcpError(err instanceof Error ? err.message : 'Failed to load shop data')
      try {
        const writable = await fetchWritableJobs(mockJobs)
        setJobs(writable.jobs)
        setWriteMode(writable.mode)
      } catch {
        setJobs(mockJobs)
      }
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

  const resources = useMemo(
    () => mergeResources(persisted.pinnedResourceIds),
    [persisted.pinnedResourceIds],
  )

  const addSubmission = useCallback((submission: AgentSubmission) => {
    setPersisted((prev) => ({
      ...prev,
      submissions: [submission, ...prev.submissions],
    }))
  }, [])

  const createJob = useCallback(async (input: WorkOrderInput) => {
    const job = await createWritableJob(input)
    setJobs((prev) => [job, ...prev.filter((j) => j.id !== job.id)])
    return job
  }, [])

  const addJob = useCallback((job: RepairJob) => {
    void createWritableJob({
      customerName: job.customerName,
      make: job.make,
      model: job.model,
      year: job.year,
      serialVin: job.serialVin,
      issueDescription: job.issueDescription,
      priority: job.priority,
      assignedTech: job.assignedTech,
      status: job.status,
      estimatedRevenue: job.estimatedRevenue,
      paidAmount: job.paidAmount,
    }).then((created) => {
      setJobs((prev) => [created, ...prev.filter((j) => j.id !== created.id)])
    })
  }, [])

  const updateJob = useCallback(async (jobId: string, updates: Partial<RepairJob> & { force?: boolean }) => {
    const patch: Partial<WorkOrderInput> = {
      customerName: updates.customerName,
      make: updates.make,
      model: updates.model,
      year: updates.year,
      serialVin: updates.serialVin,
      issueDescription: updates.issueDescription,
      priority: updates.priority,
      assignedTech: updates.assignedTech,
      status: updates.status,
      estimatedRevenue: updates.estimatedRevenue,
      paidAmount: updates.paidAmount,
      force: updates.force,
    }
    const job = await updateWritableJob(jobId, patch)
    setJobs((prev) => prev.map((j) => (j.id === jobId ? job : j)))
    return job
  }, [])

  const toggleResourcePin = useCallback((resourceId: string) => {
    setPersisted((prev) => {
      const has = prev.pinnedResourceIds.includes(resourceId)
      return {
        ...prev,
        pinnedResourceIds: has
          ? prev.pinnedResourceIds.filter((id) => id !== resourceId)
          : [...prev.pinnedResourceIds, resourceId],
      }
    })
  }, [])

  const pinnedResources = useMemo(
    () => resources.filter((r) => r.pinned),
    [resources],
  )

  return {
    jobs,
    submissions: persisted.submissions,
    resources,
    kpis,
    dateRange,
    setDateRange,
    darkMode,
    setDarkMode,
    addSubmission,
    addJob,
    createJob,
    updateJob,
    toggleResourcePin,
    pinnedResources,
    hcpMeta,
    hcpLoading,
    hcpError,
    hcpConnected: true,
    jobsWritable: true,
    writeMode,
    refreshHcp: loadHcp,
    invoicing: hcpMeta?.invoicing ?? null,
  }
}

export type AppStore = ReturnType<typeof useAppStore>
