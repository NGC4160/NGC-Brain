import type { HCPJob, HCPJobsExport } from './hcpClient.js'
import type {
  DepositAlert,
  DepositAlertCode,
  InvoiceJobType,
  InvoiceRecord,
  InvoicingPayload,
  InvoicingSummary,
  PaymentStatus,
  RevenueCategory,
} from '../src/types/invoicing.js'

const CANCELED_STATUSES = new Set(['user canceled', 'pro canceled'])
const ACTIVE_STATUSES = new Set(['in progress', 'scheduled', 'needs scheduling'])

const LITHIUM_KEYWORDS = ['lithium', 'lfp', 'lifepo4', 'professional kit', 'conversion kit']
const BATTERY_KEYWORDS = [
  'lead acid',
  'lead-acid',
  'battery replacement',
  '6v set',
  '8v set',
  '12v set',
  'battery recovery',
]
const MOTOR_CONTROLLER_KEYWORDS = ['motor', 'controller', 'controller upgrade', 'speed controller']
const SKIP_REVIEW_KEYWORDS = ['courtesy', 'warranty service', 'fleet inspection']

export const DEPOSIT_LITHIUM_DOLLARS = 1800
export const DEPOSIT_BATTERY_DOLLARS = 800
export const DIAGNOSTIC_MIN_DOLLARS = 179

function centsToDollars(cents: number | undefined | null): number {
  if (!cents) return 0
  return Math.round(cents) / 100
}

function customerName(job: HCPJob): string {
  const c = job.customer
  if (!c) return 'Unknown customer'
  if (c.company?.trim()) return c.company.trim()
  const name = [c.first_name, c.last_name].filter(Boolean).join(' ')
  return name || 'Unknown customer'
}

function sanitizeDescription(desc: string, maxLen = 80): string {
  const text = (desc || '').replace(/\s+/g, ' ').trim()
  if (!text) return '(no description)'
  if (text.length <= maxLen) return text
  return `${text.slice(0, maxLen - 1)}…`
}

export function classifyJobType(description: string): InvoiceJobType {
  const text = description.toLowerCase()
  if (LITHIUM_KEYWORDS.some((k) => text.includes(k))) return 'lithium'
  if (BATTERY_KEYWORDS.some((k) => text.includes(k))) return 'battery'
  if (MOTOR_CONTROLLER_KEYWORDS.some((k) => text.includes(k))) return 'motor_controller'
  if (
    text.includes('diagnostic') ||
    text.includes('minimum service charge') ||
    text.includes('golf cart diagnostic')
  ) {
    return 'diagnostic'
  }
  return 'general'
}

function requiredDepositDollars(jobType: InvoiceJobType, totalDollars: number): number {
  switch (jobType) {
    case 'lithium':
      return DEPOSIT_LITHIUM_DOLLARS
    case 'battery':
      return DEPOSIT_BATTERY_DOLLARS
    case 'motor_controller':
      return Math.max(totalDollars / 2, DIAGNOSTIC_MIN_DOLLARS)
    default:
      return 0
  }
}

function paymentStatus(
  total: number,
  outstanding: number,
  hasDepositAlert: boolean,
): PaymentStatus {
  if (hasDepositAlert) return 'deposit_needed'
  if (total <= 0) return 'unpaid'
  if (outstanding <= 0) return 'paid'
  if (outstanding >= total) return 'unpaid'
  return 'partial'
}

export function analyzeDepositAlert(job: HCPJob): DepositAlert | null {
  const status = (job.work_status ?? '').toLowerCase()
  if (!ACTIVE_STATUSES.has(status)) return null

  const description = job.description ?? ''
  const descLower = description.toLowerCase()
  if (SKIP_REVIEW_KEYWORDS.some((k) => descLower.includes(k))) return null

  const totalDollars = centsToDollars(job.total_amount)
  const outstandingDollars = centsToDollars(job.outstanding_balance)
  if (totalDollars <= 0 && outstandingDollars <= 0) return null

  const paidDollars = Math.max(0, totalDollars - outstandingDollars)
  const jobType = classifyJobType(description)
  const requiredDeposit = requiredDepositDollars(jobType, totalDollars)
  const invoiceNumber = job.invoice_number ?? job.id.slice(0, 12)

  if (
    ['lithium', 'battery', 'motor_controller'].includes(jobType) &&
    requiredDeposit > 0 &&
    paidDollars < requiredDeposit
  ) {
    return {
      code: 'BLOCK_PARTS',
      invoiceNumber,
      description: sanitizeDescription(description),
      workStatus: status,
      totalAmount: totalDollars,
      paidAmount: paidDollars,
      requiredDeposit,
      gapAmount: requiredDeposit - paidDollars,
      action: 'Do not order parts — collect deposit first',
      jobType,
    }
  }

  if (
    status === 'needs scheduling' &&
    jobType === 'diagnostic' &&
    outstandingDollars >= DIAGNOSTIC_MIN_DOLLARS
  ) {
    return {
      code: 'SCHEDULE_UNPAID',
      invoiceNumber,
      description: sanitizeDescription(description),
      workStatus: status,
      totalAmount: totalDollars,
      paidAmount: paidDollars,
      requiredDeposit: DIAGNOSTIC_MIN_DOLLARS,
      gapAmount: outstandingDollars,
      action: 'Collect $179 diagnostic before booking bay time',
      jobType,
    }
  }

  if (outstandingDollars > 0 && jobType !== 'diagnostic') {
    return {
      code: 'COLLECT_BALANCE',
      invoiceNumber,
      description: sanitizeDescription(description),
      workStatus: status,
      totalAmount: totalDollars,
      paidAmount: paidDollars,
      requiredDeposit,
      gapAmount: outstandingDollars,
      action: 'Balance due before pickup or additional work',
      jobType,
    }
  }

  if (outstandingDollars > 0 && jobType === 'diagnostic' && status !== 'needs scheduling') {
    return {
      code: 'COLLECT_BALANCE',
      invoiceNumber,
      description: sanitizeDescription(description),
      workStatus: status,
      totalAmount: totalDollars,
      paidAmount: paidDollars,
      requiredDeposit: DIAGNOSTIC_MIN_DOLLARS,
      gapAmount: outstandingDollars,
      action: 'Diagnostic balance due',
      jobType,
    }
  }

  return null
}

export function mapJobToInvoice(job: HCPJob, depositAlert?: DepositAlert | null): InvoiceRecord | null {
  const workStatus = (job.work_status ?? '').toLowerCase()
  if (CANCELED_STATUSES.has(workStatus) || job.deleted_at) return null

  const totalAmount = centsToDollars(job.total_amount)
  const outstandingBalance = centsToDollars(job.outstanding_balance)
  const paidAmount = Math.max(0, totalAmount - outstandingBalance)
  const jobType = classifyJobType(job.description ?? '')

  if (totalAmount <= 0 && outstandingBalance <= 0) return null

  return {
    id: job.invoice_number ? `HCP-${job.invoice_number}` : job.id,
    invoiceNumber: job.invoice_number ?? job.id.slice(0, 12),
    customerName: customerName(job),
    description: sanitizeDescription(job.description ?? '', 120),
    jobType,
    workStatus: job.work_status ?? 'unknown',
    totalAmount,
    paidAmount,
    outstandingBalance,
    paymentStatus: paymentStatus(totalAmount, outstandingBalance, !!depositAlert),
    createdAt: job.created_at ?? new Date().toISOString(),
    updatedAt: job.updated_at ?? job.created_at ?? new Date().toISOString(),
    completedAt: job.work_timestamps?.completed_at ?? undefined,
    hcpJobId: job.id,
  }
}

function computeSummary(
  invoices: InvoiceRecord[],
  alerts: DepositAlert[],
): InvoicingSummary {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const openInvoices = invoices.filter((i) => i.outstandingBalance > 0)
  const paidInvoices = invoices.filter((i) => i.paymentStatus === 'paid')
  const completedMtd = invoices.filter(
    (i) =>
      i.completedAt &&
      new Date(i.completedAt) >= monthStart &&
      (i.workStatus.toLowerCase().startsWith('complete') || i.paymentStatus === 'paid'),
  )

  const lithiumOpen = openInvoices.filter((i) => i.jobType === 'lithium')
  const totalBilled = invoices.reduce((s, i) => s + i.totalAmount, 0)

  return {
    outstandingTotal: openInvoices.reduce((s, i) => s + i.outstandingBalance, 0),
    openInvoiceCount: openInvoices.length,
    paidInvoiceCount: paidInvoices.length,
    collectedMtd: completedMtd.reduce((s, i) => s + i.paidAmount, 0),
    completedRevenueMtd: completedMtd.reduce((s, i) => s + i.totalAmount, 0),
    depositAlertCount: alerts.length,
    blockPartsCount: alerts.filter((a) => a.code === 'BLOCK_PARTS').length,
    scheduleUnpaidCount: alerts.filter((a) => a.code === 'SCHEDULE_UNPAID').length,
    collectBalanceCount: alerts.filter((a) => a.code === 'COLLECT_BALANCE').length,
    lithiumOutstanding: lithiumOpen.reduce((s, i) => s + i.outstandingBalance, 0),
    avgInvoiceAmount: invoices.length ? Math.round(totalBilled / invoices.length) : 0,
  }
}

function computeRevenueByCategory(invoices: InvoiceRecord[]): RevenueCategory[] {
  const map = new Map<InvoiceJobType, { amount: number; count: number }>()

  for (const inv of invoices) {
    const cur = map.get(inv.jobType) ?? { amount: 0, count: 0 }
    cur.amount += inv.totalAmount
    cur.count += 1
    map.set(inv.jobType, cur)
  }

  const labels: Record<InvoiceJobType, string> = {
    lithium: 'Lithium Conversions',
    battery: 'Battery Work',
    motor_controller: 'Motor / Controller',
    diagnostic: 'Diagnostics',
    general: 'General Repair',
  }

  return Array.from(map.entries())
    .map(([category, data]) => ({
      category,
      label: labels[category],
      amount: Math.round(data.amount),
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export function buildInvoicingPayload(exportData: HCPJobsExport): InvoicingPayload {
  const alerts: DepositAlert[] = []
  const alertByInvoice = new Map<string, DepositAlert>()

  for (const job of exportData.jobs) {
    const alert = analyzeDepositAlert(job)
    if (alert) {
      alerts.push(alert)
      alertByInvoice.set(alert.invoiceNumber, alert)
    }
  }

  const invoices = exportData.jobs
    .map((job) => {
      const invNum = job.invoice_number ?? job.id.slice(0, 12)
      return mapJobToInvoice(job, alertByInvoice.get(invNum))
    })
    .filter((i): i is InvoiceRecord => i !== null)
    .sort((a, b) => b.outstandingBalance - a.outstandingBalance || b.updatedAt.localeCompare(a.updatedAt))

  alerts.sort((a, b) => b.gapAmount - a.gapAmount)

  return {
    syncedAt: exportData.synced_at ?? new Date().toISOString(),
    summary: computeSummary(invoices, alerts),
    invoices,
    depositAlerts: alerts,
    revenueByCategory: computeRevenueByCategory(invoices),
  }
}
