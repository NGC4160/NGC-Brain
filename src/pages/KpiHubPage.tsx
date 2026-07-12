import { useMemo, useState } from 'react'
import {
  BarChart3,
  Download,
  FileDown,
  RefreshCw,
  Search,
} from 'lucide-react'
import { HcpSyncBanner } from '@/components/dashboard/HcpSyncBanner'
import { KpiHubCard } from '@/components/kpi/KpiHubCard'
import { KpiDetailModal } from '@/components/kpi/KpiDetailModal'
import { useApp } from '@/context/AppContext'
import { useKpiHub } from '@/hooks/useKpiHub'
import {
  downloadCsv,
  exportKpisToCsv,
  printKpisPdf,
  KPI_CATEGORY_LABELS,
  KPI_CATEGORY_ORDER,
  type KpiCategoryId,
  type KpiDateRange,
  type KpiSnapshot,
} from '@/kpi'
import { ROLE_LABELS } from '@/config/staff'

const RANGE_OPTIONS: { value: KpiDateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'mtd', label: 'MTD' },
  { value: 'qtd', label: 'QTD' },
  { value: 'ytd', label: 'YTD' },
  { value: 'custom', label: 'Custom' },
]

export function KpiHubPage() {
  const { hcpMeta, hcpLoading, hcpError, refreshHcp } = useApp()
  const hub = useKpiHub()
  const [detail, setDetail] = useState<KpiSnapshot | null>(null)

  const grouped = useMemo(() => {
    return KPI_CATEGORY_ORDER.map((cat) => ({
      id: cat,
      label: KPI_CATEGORY_LABELS[cat],
      kpis: hub.filtered.filter((k) => k.category === cat),
    })).filter((g) => g.kpis.length > 0)
  }, [hub.filtered])

  const statusCounts = useMemo(() => {
    const c = { green: 0, yellow: 0, red: 0 }
    for (const k of hub.filtered) c[k.status]++
    return c
  }, [hub.filtered])

  function exportSelection(mode: 'csv' | 'pdf') {
    const list =
      hub.selectedKpis.length > 0 ? hub.selectedKpis : hub.filtered
    if (mode === 'csv') {
      downloadCsv(
        `ngc-kpi-hub-${hub.range}-${new Date().toISOString().slice(0, 10)}.csv`,
        exportKpisToCsv(list),
      )
    } else {
      printKpisPdf(list, 'NGC KPI Reporting Hub')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            <BarChart3 className="h-6 w-6 text-brand-600" />
            KPI Reporting Hub
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {hub.fullAccess
              ? `Executive view for ${hub.name ?? 'management'} — every tracked KPI.`
              : `KPIs for your role${hub.role ? ` (${ROLE_LABELS[hub.role]})` : ''}.`}{' '}
            {hub.filtered.length} visible
            {hub.allKpis.length !== hub.filtered.length
              ? ` (filtered from ${hub.allKpis.length})`
              : ''}
            .
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary inline-flex"
          disabled={hcpLoading}
          onClick={() => void refreshHcp()}
        >
          <RefreshCw className={`h-4 w-4 ${hcpLoading ? 'animate-spin' : ''}`} />
          Refresh data
        </button>
      </div>

      <HcpSyncBanner
        meta={hcpMeta}
        loading={hcpLoading}
        error={hcpError}
        onRefresh={() => void refreshHcp()}
      />

      {/* Status strip */}
      <div className="grid grid-cols-3 gap-2 sm:max-w-md">
        {(
          [
            ['green', 'On track', statusCounts.green],
            ['yellow', 'At risk', statusCounts.yellow],
            ['red', 'Below', statusCounts.red],
          ] as const
        ).map(([key, label, count]) => (
          <div key={key} className="card py-3 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <section className="card space-y-3">
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 p-1 dark:border-slate-700">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => hub.setRange(opt.value)}
              className={`min-h-10 flex-1 rounded-md px-2 py-2 text-xs font-medium sm:flex-none sm:px-3 sm:text-sm ${
                hub.range === opt.value
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {hub.range === 'custom' && (
          <div className="flex flex-wrap gap-2">
            <label className="text-xs text-slate-500">
              Start
              <input
                type="date"
                className="input-field mt-1"
                value={hub.customStart}
                onChange={(e) => hub.setCustomStart(e.target.value)}
              />
            </label>
            <label className="text-xs text-slate-500">
              End
              <input
                type="date"
                className="input-field mt-1"
                value={hub.customEnd}
                onChange={(e) => hub.setCustomEnd(e.target.value)}
              />
            </label>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input-field w-full pl-9"
              placeholder="Search KPI name or category…"
              value={hub.search}
              onChange={(e) => hub.setSearch(e.target.value)}
              aria-label="Search KPIs"
            />
          </div>
          <select
            className="input-field sm:w-56"
            value={hub.category}
            onChange={(e) =>
              hub.setCategory(e.target.value as KpiCategoryId | 'all')
            }
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {KPI_CATEGORY_ORDER.map((id) => (
              <option key={id} value={id}>
                {KPI_CATEGORY_LABELS[id]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary py-2 text-xs" onClick={hub.selectAllVisible}>
            Select visible
          </button>
          <button type="button" className="btn-secondary py-2 text-xs" onClick={hub.clearSelection}>
            Clear selection
          </button>
          <button
            type="button"
            className="btn-secondary py-2 text-xs"
            onClick={() => exportSelection('csv')}
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button
            type="button"
            className="btn-secondary py-2 text-xs"
            onClick={() => exportSelection('pdf')}
          >
            <FileDown className="h-3.5 w-3.5" /> PDF
          </button>
        </div>
      </section>

      {hcpLoading && hub.allKpis.length === 0 && (
        <div className="card py-12 text-center text-sm text-slate-500">Loading KPI data…</div>
      )}

      {!hcpLoading && hub.filtered.length === 0 && (
        <div className="card py-12 text-center text-sm text-slate-500">
          No KPIs match this filter for your role.
        </div>
      )}

      {grouped.map((group) => (
        <section key={group.id} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {group.label}
            <span className="ml-2 font-normal normal-case text-slate-400">
              ({group.kpis.length})
            </span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {group.kpis.map((kpi) => (
              <KpiHubCard
                key={kpi.id}
                kpi={kpi}
                selected={hub.selectedIds.has(kpi.id)}
                onSelect={() => hub.toggleSelect(kpi.id)}
                onOpen={() => setDetail(kpi)}
              />
            ))}
          </div>
        </section>
      ))}

      <p className="text-xs text-slate-400">
        Data-driven registry in <code className="text-[10px]">src/kpi/registry.ts</code> — add a
        definition + compute case to surface new KPIs automatically. Targets editable by Ryan /
        Christine on each card detail.
      </p>

      {detail && (
        <KpiDetailModal
          kpi={detail}
          canEditThresholds={hub.canEditThresholds}
          onClose={() => setDetail(null)}
          onThresholdsSaved={() => {
            hub.bumpThresholds()
            setDetail(null)
          }}
        />
      )}
    </div>
  )
}
