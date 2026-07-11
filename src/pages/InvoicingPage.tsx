import { useApp } from '@/context/AppContext'
import { HcpSyncBanner } from '@/components/dashboard/HcpSyncBanner'
import { DepositAlertsPanel } from '@/components/invoicing/DepositAlertsPanel'
import { RevenueCategoryChart } from '@/components/invoicing/RevenueCategoryChart'
import {
  DEPOSIT_LITHIUM_DOLLARS,
  DEPOSIT_BATTERY_DOLLARS,
  DIAGNOSTIC_MIN_DOLLARS,
} from '@/types/invoicing'
import {
  JOB_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  type InvoiceRecord,
  type PaymentStatus,
} from '@/types/invoicing'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useMemo, useState } from 'react'

type InvoiceFilter = 'all' | 'outstanding' | 'alerts' | 'lithium' | 'paid'

const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  paid: 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300',
  partial: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  unpaid: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  deposit_needed: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
}

export function InvoicingPage() {
  const {
    invoicing,
    hcpMeta,
    hcpLoading,
    hcpError,
    refreshHcp,
  } = useApp()
  const [filter, setFilter] = useState<InvoiceFilter>('outstanding')

  const alertInvoiceNumbers = useMemo(
    () => new Set(invoicing?.depositAlerts.map((a) => a.invoiceNumber) ?? []),
    [invoicing],
  )

  const filtered = useMemo(() => {
    if (!invoicing) return []
    const list = invoicing.invoices
    switch (filter) {
      case 'outstanding':
        return list.filter((i) => i.outstandingBalance > 0)
      case 'alerts':
        return list.filter((i) => alertInvoiceNumbers.has(i.invoiceNumber))
      case 'lithium':
        return list.filter((i) => i.jobType === 'lithium')
      case 'paid':
        return list.filter((i) => i.paymentStatus === 'paid')
      default:
        return list
    }
  }, [invoicing, filter, alertInvoiceNumbers])

  if (!invoicing && !hcpLoading) {
    return (
      <div className="space-y-6">
        <Header />
        <div className="card py-12 text-center text-sm text-slate-500">
          No invoicing data available. Sync Housecall Pro first.
        </div>
      </div>
    )
  }

  const s = invoicing?.summary

  return (
    <div className="space-y-6">
      <Header />

      <HcpSyncBanner
        meta={hcpMeta}
        loading={hcpLoading}
        error={hcpError}
        onRefresh={() => void refreshHcp()}
      />

      {s && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Outstanding AR"
            value={formatCurrency(s.outstandingTotal)}
            sub={`${s.openInvoiceCount} open invoices`}
            highlight={s.outstandingTotal > 0}
          />
          <SummaryCard
            label="Deposit Alerts"
            value={String(s.depositAlertCount)}
            sub={`${s.blockPartsCount} block parts · ${s.scheduleUnpaidCount} schedule unpaid`}
            highlight={s.blockPartsCount > 0}
          />
          <SummaryCard
            label="Completed Revenue (MTD)"
            value={formatCurrency(s.completedRevenueMtd)}
            sub={`${s.paidInvoiceCount} paid invoices total`}
          />
          <SummaryCard
            label="Lithium Outstanding"
            value={formatCurrency(s.lithiumOutstanding)}
            sub={`Avg invoice ${formatCurrency(s.avgInvoiceAmount)}`}
            highlight={s.lithiumOutstanding > 0}
          />
        </div>
      )}

      <section className="card">
        <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">
          NGC deposit gates
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Lithium ${DEPOSIT_LITHIUM_DOLLARS.toLocaleString()} · Battery ${DEPOSIT_BATTERY_DOLLARS.toLocaleString()} · Diagnostic ${DIAGNOSTIC_MIN_DOLLARS} minimum before scheduling
        </p>
        {invoicing && <DepositAlertsPanel alerts={invoicing.depositAlerts} />}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Revenue by job type
          </h2>
          {invoicing && <RevenueCategoryChart data={invoicing.revenueByCategory} />}
        </section>

        <section className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Collection workflow
          </h2>
          <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex gap-2">
              <span className="font-bold text-red-600">1.</span>
              Work <strong>BLOCK_PARTS</strong> alerts first — send HCP payment link before ordering parts.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-amber-600">2.</span>
              Collect <strong>SCHEDULE_UNPAID</strong> diagnostics ($179) before booking bay time.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-ngc-500">3.</span>
              Clear <strong>COLLECT_BALANCE</strong> before pickup or additional labor.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-brand-600">4.</span>
              Note &quot;Deposit received&quot; on the job in Housecall Pro when paid.
            </li>
          </ol>
          <p className="mt-4 text-xs text-slate-400">
            Payments flow to QuickBooks (cash basis). Open invoices in HCP to send payment links.
          </p>
        </section>
      </div>

      <section className="card overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Invoices</h2>
            <p className="text-sm text-slate-500">{filtered.length} shown</p>
          </div>
          <select
            className="input-field w-auto"
            value={filter}
            onChange={(e) => setFilter(e.target.value as InvoiceFilter)}
          >
            <option value="outstanding">Outstanding</option>
            <option value="alerts">Deposit alerts</option>
            <option value="lithium">Lithium</option>
            <option value="paid">Paid</option>
            <option value="all">All invoices</option>
          </select>
        </div>
        <InvoiceTable invoices={filtered} />
      </section>
    </div>
  )
}

function Header() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invoicing</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Accounts receivable, deposit gates, and payment collection from Housecall Pro
      </p>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string
  value: string
  sub: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'card',
        highlight && 'ring-1 ring-red-300 dark:ring-red-800',
      )}
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  )
}

function InvoiceTable({ invoices }: { invoices: InvoiceRecord[] }) {
  if (invoices.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-slate-400">
        No invoices match this filter.
      </p>
    )
  }

  return (
    <>
      <div className="space-y-3 p-3 md:hidden">
        {invoices.map((inv) => (
          <article key={inv.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white">#{inv.invoiceNumber}</p>
                <p className="truncate text-sm text-slate-600 dark:text-slate-300">{inv.customerName}</p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
                  PAYMENT_BADGE[inv.paymentStatus],
                )}
              >
                {PAYMENT_STATUS_LABELS[inv.paymentStatus]}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{JOB_TYPE_LABELS[inv.jobType]}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center dark:border-slate-800">
              <div>
                <p className="text-[11px] text-slate-400">Total</p>
                <p className="text-sm font-medium">{formatCurrency(inv.totalAmount)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Paid</p>
                <p className="text-sm font-medium text-brand-700 dark:text-brand-400">
                  {formatCurrency(inv.paidAmount)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Due</p>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {inv.outstandingBalance > 0 ? formatCurrency(inv.outstandingBalance) : '—'}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
              <th className="px-5 py-3 font-medium text-slate-500">Invoice #</th>
              <th className="px-5 py-3 font-medium text-slate-500">Customer</th>
              <th className="px-5 py-3 font-medium text-slate-500">Type</th>
              <th className="px-5 py-3 font-medium text-slate-500">Total</th>
              <th className="px-5 py-3 font-medium text-slate-500">Paid</th>
              <th className="px-5 py-3 font-medium text-slate-500">Outstanding</th>
              <th className="px-5 py-3 font-medium text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                  {inv.invoiceNumber}
                </td>
                <td className="px-5 py-3">{inv.customerName}</td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                  {JOB_TYPE_LABELS[inv.jobType]}
                </td>
                <td className="px-5 py-3">{formatCurrency(inv.totalAmount)}</td>
                <td className="px-5 py-3 text-brand-700 dark:text-brand-400">
                  {formatCurrency(inv.paidAmount)}
                </td>
                <td className="px-5 py-3 font-medium text-red-600 dark:text-red-400">
                  {inv.outstandingBalance > 0 ? formatCurrency(inv.outstandingBalance) : '—'}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      PAYMENT_BADGE[inv.paymentStatus],
                    )}
                  >
                    {PAYMENT_STATUS_LABELS[inv.paymentStatus]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
