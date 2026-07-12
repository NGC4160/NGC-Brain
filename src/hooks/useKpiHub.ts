import { useMemo, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { useAuthContext } from '@/context/AuthContext'
import {
  computeKpiSnapshots,
  hasFullKpiAccess,
  type KpiCategoryId,
  type KpiDateRange,
  type KpiSnapshot,
} from '@/kpi'

export function useKpiHub() {
  const {
    jobs,
    submissions,
    invoicing,
    hcpMeta,
    hcpLoading,
    hcpError,
    refreshHcp,
  } = useApp()
  const { session, canManageStaff } = useAuthContext()

  const [range, setRange] = useState<KpiDateRange>('mtd')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<KpiCategoryId | 'all'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [thresholdVersion, setThresholdVersion] = useState(0)

  const allKpis = useMemo(() => {
    void thresholdVersion
    return computeKpiSnapshots({
      jobs,
      invoicing,
      extras: hcpMeta?.extras ?? null,
      submissions,
      role: session?.role ?? null,
      sessionName: session?.name ?? null,
      range,
      customStart: customStart || undefined,
      customEnd: customEnd || undefined,
      syncedAt: hcpMeta?.syncedAt ?? invoicing?.syncedAt ?? null,
    })
  }, [
    jobs,
    invoicing,
    hcpMeta,
    submissions,
    session,
    range,
    customStart,
    customEnd,
    thresholdVersion,
  ])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allKpis.filter((k) => {
      if (category !== 'all' && k.category !== category) return false
      if (!q) return true
      return (
        k.name.toLowerCase().includes(q) ||
        k.shortDescription.toLowerCase().includes(q) ||
        k.category.includes(q) ||
        k.id.includes(q)
      )
    })
  }, [allKpis, search, category])

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllVisible() {
    setSelectedIds(new Set(filtered.map((k) => k.id)))
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  const selectedKpis: KpiSnapshot[] = filtered.filter((k) => selectedIds.has(k.id))

  return {
    allKpis,
    filtered,
    range,
    setRange,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    search,
    setSearch,
    category,
    setCategory,
    selectedIds,
    toggleSelect,
    selectAllVisible,
    clearSelection,
    selectedKpis,
    fullAccess: hasFullKpiAccess(session?.role ?? null),
    canEditThresholds: canManageStaff,
    bumpThresholds: () => setThresholdVersion((v) => v + 1),
    hcpLoading,
    hcpError,
    refreshHcp,
    syncedAt: hcpMeta?.syncedAt ?? null,
    role: session?.role ?? null,
    name: session?.name ?? null,
  }
}
