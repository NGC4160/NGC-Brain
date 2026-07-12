import type { StaffRole } from '@/config/staff'

/** Hub date presets (broader than dashboard DateRangePreset) */
export type KpiDateRange = 'today' | 'week' | 'mtd' | 'qtd' | 'ytd' | 'custom'

export type KpiStatus = 'green' | 'yellow' | 'red'

export type KpiFormat = 'number' | 'currency' | 'percent' | 'days' | 'decimal'

export type KpiCategoryId =
  | 'executive'
  | 'financial'
  | 'operations'
  | 'customer'
  | 'team'
  | 'fleet'
  | 'growth'
  | 'compliance'
  | 'cfo'

/** Higher is better unless direction === 'lower-better' */
export type KpiDirection = 'higher-better' | 'lower-better'

export interface KpiThresholds {
  /** % of target → green (default 100) */
  greenAt: number
  /** % of target → yellow floor (default 80); below = red */
  yellowAt: number
}

export interface KpiDefinitionMeta {
  id: string
  name: string
  shortDescription: string
  description: string
  formula: string
  historicalContext: string
  category: KpiCategoryId
  format: KpiFormat
  unit: string
  direction: KpiDirection
  /** Default goal — overridden by admin thresholds store when present */
  defaultTarget: number
  defaultThresholds: KpiThresholds
  /** Who may see this KPI (executive roles always see all) */
  accessRoles: StaffRole[]
  /** Prefer personal (session-scoped) computation when true */
  personal?: boolean
  source: 'jobs' | 'invoicing' | 'extras' | 'submissions' | 'derived' | 'mock' | 'cfo-pack'
}

export interface KpiSnapshot {
  id: string
  name: string
  shortDescription: string
  description: string
  formula: string
  historicalContext: string
  category: KpiCategoryId
  format: KpiFormat
  unit: string
  direction: KpiDirection
  current: number
  previous: number
  target: number
  /** Percent of target achieved (0–∞) */
  progressPct: number
  /** % change vs previous comparable period */
  trend: number
  status: KpiStatus
  lastUpdated: string
  history: { label: string; value: number }[]
  source: KpiDefinitionMeta['source']
  personal?: boolean
}

export interface KpiHubFilters {
  range: KpiDateRange
  customStart?: string
  customEnd?: string
  search: string
  category: KpiCategoryId | 'all'
}

export const KPI_CATEGORY_LABELS: Record<KpiCategoryId, string> = {
  executive: 'Executive Overview',
  financial: 'Financial Performance',
  operations: 'Operational Efficiency',
  customer: 'Customer Experience',
  team: 'Team & Technician',
  fleet: 'Fleet & Driver',
  growth: 'Sales & Growth',
  compliance: 'Compliance & Safety',
  cfo: 'CFO / QuickBooks Packs',
}

export const KPI_CATEGORY_ORDER: KpiCategoryId[] = [
  'executive',
  'cfo',
  'financial',
  'operations',
  'customer',
  'team',
  'fleet',
  'growth',
  'compliance',
]
