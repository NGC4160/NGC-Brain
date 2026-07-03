import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InventoryKpiCardProps {
  label: string
  value: string
  icon: LucideIcon
  variant?: 'default' | 'warning' | 'danger'
}

export function InventoryKpiCard({ label, value, icon: Icon, variant = 'default' }: InventoryKpiCardProps) {
  return (
    <div className={cn(
      'card',
      variant === 'warning' && 'border-amber-200 dark:border-amber-900',
      variant === 'danger' && 'border-red-200 dark:border-red-900',
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          variant === 'danger' ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' :
          variant === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400' :
          'bg-brand-100 text-brand-600 dark:bg-brand-950 dark:text-brand-400',
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}
