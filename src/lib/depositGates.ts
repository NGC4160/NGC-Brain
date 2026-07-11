import type { InvoiceJobType } from '@/types/invoicing'

export const DEPOSIT_LITHIUM = 1800
export const DEPOSIT_BATTERY = 800
export const DIAGNOSTIC_MIN = 179

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

export function classifyJobType(description: string): InvoiceJobType {
  const text = (description ?? '').toLowerCase()
  if (LITHIUM_KEYWORDS.some((k) => text.includes(k))) return 'lithium'
  if (BATTERY_KEYWORDS.some((k) => text.includes(k))) return 'battery'
  if (
    text.includes('diagnostic') ||
    text.includes('minimum service charge') ||
    text.includes('golf cart diagnostic')
  ) {
    return 'diagnostic'
  }
  if (text.includes('motor') || text.includes('controller')) return 'motor_controller'
  return 'general'
}

export function requiredDepositDollars(jobType: InvoiceJobType, totalDollars: number): number {
  switch (jobType) {
    case 'lithium':
      return DEPOSIT_LITHIUM
    case 'battery':
      return DEPOSIT_BATTERY
    case 'motor_controller':
      return Math.max(totalDollars / 2, DIAGNOSTIC_MIN)
    case 'diagnostic':
      return DIAGNOSTIC_MIN
    default:
      return 0
  }
}

export interface DepositGateResult {
  jobType: InvoiceJobType
  requiredDeposit: number
  paidAmount: number
  gapAmount: number
  blocked: boolean
  code: 'BLOCK_PARTS' | 'SCHEDULE_UNPAID' | 'COLLECT_BALANCE' | null
  message: string | null
}

export function evaluateDepositGate(input: {
  description: string
  totalAmount: number
  paidAmount: number
  status: string
}): DepositGateResult {
  const jobType = classifyJobType(input.description)
  const requiredDeposit = requiredDepositDollars(jobType, input.totalAmount)
  const paidAmount = Math.max(0, input.paidAmount)
  const gapAmount = Math.max(0, requiredDeposit - paidAmount)
  const outstanding = Math.max(0, input.totalAmount - paidAmount)

  let code: DepositGateResult['code'] = null
  let message: string | null = null
  let blocked = false

  if (gapAmount > 0 && ['waiting-parts', 'in-repair'].includes(input.status)) {
    code = 'BLOCK_PARTS'
    blocked = true
    message = `Collect $${gapAmount.toLocaleString()} deposit before ordering parts (${jobType}).`
  } else if (gapAmount > 0 && ['received', 'diagnosing'].includes(input.status) && jobType !== 'general') {
    code = 'SCHEDULE_UNPAID'
    message = `Deposit still short by $${gapAmount.toLocaleString()} before scheduling/bay work.`
  } else if (outstanding > 0 && ['ready', 'qa'].includes(input.status)) {
    code = 'COLLECT_BALANCE'
    message = `Collect remaining $${outstanding.toLocaleString()} before pickup.`
  }

  return {
    jobType,
    requiredDeposit,
    paidAmount,
    gapAmount,
    blocked,
    code,
    message,
  }
}
