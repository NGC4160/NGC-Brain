export type UserRole = 'owner' | 'tech' | 'front-desk'

export type JobStatus =
  | 'received'
  | 'diagnosing'
  | 'waiting-parts'
  | 'in-repair'
  | 'qa'
  | 'ready'
  | 'picked-up'

export type JobPriority = 'low' | 'normal' | 'high' | 'urgent'

export type DateRangePreset = 'today' | 'week' | 'month' | 'custom'

export type SubmissionType =
  | 'repair-intake'
  | 'status-update'
  | 'parts-used'
  | 'time-log'
  | 'quick-note'

export interface KpiDefinition {
  id: string
  label: string
  description: string
  unit?: 'currency' | 'days' | 'count'
  format?: 'number' | 'currency' | 'decimal'
}

export interface KpiValue {
  id: string
  value: number
  previousValue: number
  trendLabel?: string
}

export interface NavModule {
  id: string
  label: string
  path: string
  icon: string
  enabled: boolean
  description?: string
}

export interface ResourceCategory {
  id: string
  label: string
}

export interface Resource {
  id: string
  title: string
  category: string
  description?: string
  url: string
  make?: string
  model?: string
  yearRange?: string
  tags: string[]
  pinned?: boolean
}

export interface RepairJob {
  id: string
  customerName: string
  make: string
  model: string
  year?: number
  serialVin?: string
  issueDescription: string
  priority: JobPriority
  assignedTech?: string
  status: JobStatus
  createdAt: string
  updatedAt: string
  estimatedRevenue?: number
  paidAmount?: number
  partsCost?: number
  laborHours?: number
  completedAt?: string
  hcpId?: string
  outstandingBalance?: number
  jobType?: import('./invoicing').InvoiceJobType
  invoiceNumber?: string
  requiredDeposit?: number
  depositGap?: number
  depositBlocked?: boolean
  depositMessage?: string
}

export interface AgentSubmission {
  id: string
  type: SubmissionType
  submittedBy: string
  submittedAt: string
  payload: Record<string, unknown>
  jobId?: string
}

export interface RepairIntakePayload {
  customerName: string
  make: string
  model: string
  year?: number
  serialVin?: string
  issueDescription: string
  priority: JobPriority
  assignedTech?: string
}

export interface StatusUpdatePayload {
  jobId: string
  status: JobStatus
  notes?: string
}

export interface PartsUsedPayload {
  jobId: string
  partName: string
  sku?: string
  quantity: number
  cost: number
}

export interface TimeLogPayload {
  jobId: string
  techName: string
  hours: number
  taskDescription: string
}

export interface QuickNotePayload {
  jobId?: string
  note: string
}

export interface AppState {
  jobs: RepairJob[]
  submissions: AgentSubmission[]
  resources: Resource[]
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  received: 'Received',
  diagnosing: 'Diagnosing',
  'waiting-parts': 'Waiting on Parts',
  'in-repair': 'In Repair',
  qa: 'QA',
  ready: 'Ready',
  'picked-up': 'Picked Up',
}

export const JOB_PRIORITY_LABELS: Record<JobPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
}

export const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = {
  'repair-intake': 'Repair Intake',
  'status-update': 'Status Update',
  'parts-used': 'Parts Used',
  'time-log': 'Time Log',
  'quick-note': 'Quick Note',
}
