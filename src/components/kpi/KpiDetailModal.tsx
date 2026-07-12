import { useEffect, useId, useState } from 'react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { X } from 'lucide-react'
import type { KpiSnapshot } from '@/kpi'
import { clearKpiOverride, formatKpiValue, saveKpiOverride } from '@/kpi'
import { brandColors } from '@/config/app.config'

interface KpiDetailModalProps {
  kpi: KpiSnapshot
  canEditThresholds: boolean
  onClose: () => void
  onThresholdsSaved: () => void
}

export function KpiDetailModal({
  kpi,
  canEditThresholds,
  onClose,
  onThresholdsSaved,
}: KpiDetailModalProps) {
  const titleId = useId()
  const [target, setTarget] = useState(String(kpi.target))
  const [greenAt, setGreenAt] = useState('100')
  const [yellowAt, setYellowAt] = useState('80')

  useEffect(() => {
    setTarget(String(kpi.target))
  }, [kpi])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-slate-900 dark:text-white">
              {kpi.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{kpi.shortDescription}</p>
          </div>
          <button type="button" className="btn-secondary p-2" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
            <p className="text-xs text-slate-500">Current</p>
            <p className="text-xl font-bold">{formatKpiValue(kpi.current, kpi.format)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
            <p className="text-xs text-slate-500">Target</p>
            <p className="text-xl font-bold">{formatKpiValue(kpi.target, kpi.format)}</p>
          </div>
        </div>

        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={kpi.history}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke={brandColors.green}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>{kpi.description}</p>
          <p>
            <span className="font-medium text-slate-800 dark:text-slate-100">Formula: </span>
            <code className="text-xs">{kpi.formula}</code>
          </p>
          <p className="text-slate-500">{kpi.historicalContext}</p>
          <p className="text-xs text-slate-400">Source: {kpi.source} · Updated {new Date(kpi.lastUpdated).toLocaleString()}</p>
        </div>

        {canEditThresholds && (
          <form
            className="mt-5 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800"
            onSubmit={(e) => {
              e.preventDefault()
              saveKpiOverride(kpi.id, {
                target: Number(target) || 0,
                thresholds: {
                  greenAt: Number(greenAt) || 100,
                  yellowAt: Number(yellowAt) || 80,
                },
              })
              onThresholdsSaved()
            }}
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Thresholds (Ryan / Christine)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs">
                Target
                <input
                  className="input-field mt-1"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  inputMode="decimal"
                />
              </label>
              <label className="text-xs">
                Green at %
                <input
                  className="input-field mt-1"
                  value={greenAt}
                  onChange={(e) => setGreenAt(e.target.value)}
                  inputMode="decimal"
                />
              </label>
              <label className="text-xs">
                Yellow at %
                <input
                  className="input-field mt-1"
                  value={yellowAt}
                  onChange={(e) => setYellowAt(e.target.value)}
                  inputMode="decimal"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn-primary">
                Save thresholds
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  clearKpiOverride(kpi.id)
                  onThresholdsSaved()
                }}
              >
                Reset default
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
