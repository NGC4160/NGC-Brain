import { AlertTriangle, Ban, Calendar, DollarSign } from 'lucide-react'
import type { DepositAlert } from '@/types/invoicing'
import { DEPOSIT_ALERT_LABELS, JOB_TYPE_LABELS } from '@/types/invoicing'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface DepositAlertsPanelProps {
  alerts: DepositAlert[]
}

const CODE_STYLES = {
  BLOCK_PARTS: {
    icon: Ban,
    badge: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    border: 'border-red-200 dark:border-red-900',
  },
  SCHEDULE_UNPAID: {
    icon: Calendar,
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-900',
  },
  COLLECT_BALANCE: {
    icon: DollarSign,
    badge: 'bg-ngc-100 text-ngc-800 dark:bg-ngc-900 dark:text-ngc-200',
    border: 'border-ngc-200 dark:border-ngc-800',
  },
} as const

export function DepositAlertsPanel({ alerts }: DepositAlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <div className="card flex items-center gap-3 py-8 text-sm text-slate-500">
        <AlertTriangle className="h-5 w-5 text-brand-600" />
        No deposit or collection alerts — all active jobs meet payment gates.
      </div>
    )
  }

  const blockParts = alerts.filter((a) => a.code === 'BLOCK_PARTS')
  const others = alerts.filter((a) => a.code !== 'BLOCK_PARTS')

  return (
    <div className="space-y-4">
      {blockParts.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-red-700 dark:text-red-400">
            Priority — Do not order parts ({blockParts.length})
          </h3>
          <ul className="space-y-2">
            {blockParts.map((alert) => (
              <AlertRow key={`${alert.code}-${alert.invoiceNumber}`} alert={alert} />
            ))}
          </ul>
        </div>
      )}
      {others.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Other collection items ({others.length})
          </h3>
          <ul className="space-y-2">
            {others.map((alert) => (
              <AlertRow key={`${alert.code}-${alert.invoiceNumber}`} alert={alert} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function AlertRow({ alert }: { alert: DepositAlert }) {
  const style = CODE_STYLES[alert.code]
  const Icon = style.icon

  return (
    <li
      className={cn(
        'card flex flex-wrap items-start justify-between gap-3 border py-3',
        style.border,
      )}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-white">
              #{alert.invoiceNumber}
            </span>
            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', style.badge)}>
              {DEPOSIT_ALERT_LABELS[alert.code]}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {JOB_TYPE_LABELS[alert.jobType]}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{alert.description}</p>
          <p className="mt-1 text-xs text-slate-500">{alert.action}</p>
        </div>
      </div>
      <div className="text-right text-sm">
        <p className="font-semibold text-red-600 dark:text-red-400">
          Gap {formatCurrency(alert.gapAmount)}
        </p>
        <p className="text-xs text-slate-500">
          Paid {formatCurrency(alert.paidAmount)} / {formatCurrency(alert.totalAmount)}
        </p>
      </div>
    </li>
  )
}
