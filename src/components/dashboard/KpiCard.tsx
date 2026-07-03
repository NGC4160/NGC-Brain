import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import type { KpiDefinition, KpiValue } from '@/types'
import { cn, formatCurrency } from '@/lib/utils'

interface KpiCardProps {
  definition: KpiDefinition
  data: KpiValue
  onClick?: () => void
}

function formatValue(definition: KpiDefinition, value: number): string {
  switch (definition.format) {
    case 'currency':
      return formatCurrency(value)
    case 'decimal':
      return `${value} days`
    default:
      return String(value)
  }
}

export function KpiCard({ definition, data, onClick }: KpiCardProps) {
  const diff = data.value - data.previousValue
  const pctChange =
    data.previousValue !== 0
      ? Math.round((diff / data.previousValue) * 100)
      : diff > 0
        ? 100
        : 0

  const isPositiveGood =
    definition.id !== 'avg-turnaround' &&
    definition.id !== 'low-stock-alerts' &&
    definition.id !== 'customer-waitlist' &&
    definition.id !== 'parts-on-order'

  const trendUp = diff > 0
  const trendGood = isPositiveGood ? trendUp : !trendUp

  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'card text-left transition',
        onClick && 'cursor-pointer hover:border-brand-300 hover:shadow-md dark:hover:border-brand-700',
      )}
    >
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {definition.label}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        {formatValue(definition, data.value)}
      </p>
      <div className="mt-3 flex items-center gap-2">
        {diff === 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Minus className="h-3.5 w-3.5" />
            No change
          </span>
        ) : (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs font-medium',
              trendGood
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400',
            )}
          >
            {trendUp ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {Math.abs(pctChange)}% vs prior
          </span>
        )}
        {data.trendLabel && (
          <span className="text-xs text-slate-400">· {data.trendLabel}</span>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        {definition.description}
      </p>
    </Tag>
  )
}
