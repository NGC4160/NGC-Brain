import type { StaffRole } from '@/config/staff'

/** How the DMS runs this SOP */
export type SopRuntime =
  /** Dedicated app route (full workflow UI) */
  | 'module'
  /** Interactive checklist stored on-device */
  | 'checklist'
  /** Policy enforced inside another module (read-only guide + links) */
  | 'policy'
  /** Reference only — knowledge doc, no interactive runner yet */
  | 'reference'

export type SopStatus = 'active' | 'draft' | 'legacy'

/** Who the SOP is written for — used to group the hub for Ryan / Christine */
export type SopSection = 'office' | 'shop' | 'driver' | 'shared'

export interface SopChecklistItem {
  id: string
  label: string
  required?: boolean
}

export interface SopStep {
  id: string
  title: string
  summary: string
  /** Optional canned scripts staff can copy */
  scripts?: { id: string; label: string; text: string }[]
  checklist?: SopChecklistItem[]
}

export interface SopDefinition {
  /** Stable id — used in routes / storage keys */
  id: string
  title: string
  shortTitle: string
  description: string
  /** Primary owner(s) who execute this SOP day-to-day */
  ownerRoles: StaffRole[]
  /** Who may open / run it */
  accessRoles: StaffRole[]
  status: SopStatus
  runtime: SopRuntime
  /** Deep link into the DMS when runtime === 'module' or for related work */
  modulePath?: string
  /** Markdown / HTML knowledge file path under public or repo */
  sourceDoc?: string
  tags: string[]
  /** Hub grouping (Office / Shop / Driver / Shared) */
  section: SopSection
  /** Ordered workflow steps */
  steps: SopStep[]
  /** Flat checklist for runtime === 'checklist' */
  checklist?: SopChecklistItem[]
  /** Related SOP ids */
  relatedSopIds?: string[]
  /** When this SOP definition was last verified */
  lastVerified?: string
}

export interface SopRunRecord {
  sopId: string
  startedAt: string
  updatedAt: string
  completedAt?: string
  checked: Record<string, boolean>
  notes: string
  runBy: string
  contextLabel?: string
}
