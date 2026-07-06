export type InvoiceJobType =
  | 'lithium'
  | 'battery'
  | 'motor_controller'
  | 'diagnostic'
  | 'general'

export type PaymentStatus = 'paid' | 'partial' | 'unpaid' | 'deposit_needed'

export type DepositAlertCode = 'BLOCK_PARTS' | 'SCHEDULE_UNPAID' | 'COLLECT_BALANCE'

export interface InvoiceRecord {
  id: string
  invoiceNumber: string
  customerName: string
  description: string
  jobType: InvoiceJobType
  workStatus: string
  totalAmount: number
  paidAmount: number
  outstandingBalance: number
  paymentStatus: PaymentStatus
  createdAt: string
  updatedAt: string
  completedAt?: string
  hcpJobId?: string
}

export interface DepositAlert {
  code: DepositAlertCode
  invoiceNumber: string
  description: string
  workStatus: string
  totalAmount: number
  paidAmount: number
  requiredDeposit: number
  gapAmount: number
  action: string
  jobType: InvoiceJobType
}

export interface InvoicingSummary {
  outstandingTotal: number
  openInvoiceCount: number
  paidInvoiceCount: number
  collectedMtd: number
  completedRevenueMtd: number
  depositAlertCount: number
  blockPartsCount: number
  scheduleUnpaidCount: number
  collectBalanceCount: number
  lithiumOutstanding: number
  avgInvoiceAmount: number
}

export interface RevenueCategory {
  category: string
  label: string
  amount: number
  count: number
}

export interface InvoicingPayload {
  syncedAt: string
  summary: InvoicingSummary
  invoices: InvoiceRecord[]
  depositAlerts: DepositAlert[]
  revenueByCategory: RevenueCategory[]
}

export const DEPOSIT_ALERT_LABELS: Record<DepositAlertCode, string> = {
  BLOCK_PARTS: 'Block Parts Order',
  SCHEDULE_UNPAID: 'Schedule Unpaid',
  COLLECT_BALANCE: 'Collect Balance',
}

export const JOB_TYPE_LABELS: Record<InvoiceJobType, string> = {
  lithium: 'Lithium Conversion',
  battery: 'Battery Replacement',
  motor_controller: 'Motor / Controller',
  diagnostic: 'Diagnostic',
  general: 'General Repair',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Paid',
  partial: 'Partial',
  unpaid: 'Unpaid',
  deposit_needed: 'Deposit Needed',
}

export const DEPOSIT_LITHIUM_DOLLARS = 1800
export const DEPOSIT_BATTERY_DOLLARS = 800
export const DIAGNOSTIC_MIN_DOLLARS = 179
