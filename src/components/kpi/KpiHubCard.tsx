import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'
import type { KpiSnapshot, KpiStatus } from '@/kpi'
import { formatKpiValue, formatTrend } from '@/kpi'
import { cn, formatRelativeDate } from '@/lib/utils'

const STATUS_STYLES: Record<KpiStatus, string> = {
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  yellow: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
}

const STATUS_LABEL: Record<KpiStatus, string> = {
  green: 'On track',
  yellow: 'At risk',
  red: 'Below target',
}

const BAR: Record<KpiStatus, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  red: 'bg-red-500',
}

interface KpiHubCardProps {
  kpi: KpiSnapshot
  selected?: boolean
  onSelect?: () => void
  onOpen: () => void
}

export function KpiHubCard({ kpi, selected, onSelect, onOpen }: KpiHubCardProps) {
  const TrendIcon =
    kpi.trend > 0 ? ArrowUp : kpi.trend < 0 ? ArrowDown : ArrowRight
  const progressWidth = Math.min(Math.max(kpi.progressPct, 0), 140)

  return (
    <article
      className={cn(
        'card group relative flex flex-col gap-3 text-left transition hover:border-brand-300 hover:shadow-md dark:hover:border-brand-700',
        selected && 'ring-2 ring-brand-500',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-white">{kpi.name}</h3>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                STATUS_STYLES[kpi.status],
              )}
            >
              {STATUS_LABEL[kpi.status]}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{kpi.shortDescription}</p>
        </div>
        {onSelect && (
          <input
            type="checkbox"
            className="mt-1"
            checked={Boolean(selected)}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${kpi.name}`}
          />
        )}
      </div>

      <button type="button" className="text-left" onClick={onOpen}>
        <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {formatKpiValue(kpi.current, kpi.format)}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Target {formatKpiValue(kpi.target, kpi.format)}
          {kpi.personal ? ' · personal' : ''}
        </p>

        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={cn('h-full rounded-full transition-all', BAR[kpi.status])}
              style={{ width: `${Math.min(progressWidth, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{kpi.progressPct}% of target</p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-1 font-medium',
              kpi.trend === 0
                ? 'text-slate-500'
                : (kpi.direction === 'higher-better' ? kpi.trend > 0 : kpi.trend < 0)
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400',
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            {formatTrend(kpi.trend)} vs prior
          </span>
          <span className="text-slate-400">· {formatRelativeDate(kpi.lastUpdated)}</span>
        </div>
      </button>

      {/* Hover tooltip */}
      <div className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-72 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg group-hover:block dark:border-slate-700 dark:bg-slate-900">
        <p className="font-semibold text-slate-900 dark:text-white">{kpi.name}</p>
        <p className="mt-1 text-slate-600 dark:text-slate-300">{kpi.description}</p>
        <p className="mt-2 font-medium text-slate-500">Formula</p>
        <p className="font-mono text-[10px] text-slate-600 dark:text-slate-400">{kpi.formula}</p>
        <p className="mt-2 text-slate-500">{kpi.historicalContext}</p>
      </div>
    </article>
  )
}
