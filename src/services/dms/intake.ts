import { generateId } from '@/lib/utils'
import {
  INITIAL_RESPONSE_TEXT,
  FOLLOW_UP_TEXT,
  addHours,
  emptyPhotoChecklist,
  type IntakeLead,
  type IntakeLeadSource,
  type IntakeRequestType,
  type IntakeStage,
  type PickupZone,
} from '@/config/intakeSop'

const STORAGE_KEY = 'ngc-customer-intake-v1'

function loadAll(): IntakeLead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as IntakeLead[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveAll(leads: IntakeLead[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads))
}

export function listIntakeLeads(): IntakeLead[] {
  return loadAll().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export function getIntakeLead(id: string): IntakeLead | null {
  return loadAll().find((l) => l.id === id) ?? null
}

export function upsertIntakeLead(lead: IntakeLead): IntakeLead {
  const next = { ...lead, updatedAt: new Date().toISOString() }
  const all = loadAll().filter((l) => l.id !== next.id)
  saveAll([next, ...all])
  return next
}

export function createIntakeLead(input: {
  customerName: string
  phone: string
  email?: string
  source: IntakeLeadSource
  requestType: IntakeRequestType
  problemSummary?: string
  createdBy: string
}): IntakeLead {
  const ts = new Date().toISOString()
  const lead: IntakeLead = {
    id: generateId('lead'),
    createdAt: ts,
    updatedAt: ts,
    stage: 'new',
    source: input.source,
    requestType: input.requestType,
    customerName: input.customerName.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    problemSummary: input.problemSummary?.trim() || '',
    symptomsOrScope: '',
    pickupZone: 'unknown',
    diagnosticQuoted: input.requestType === 'diagnostic',
    photos: emptyPhotoChecklist(input.requestType),
    notes: '',
    estimateOwner: 'unset',
    createdBy: input.createdBy,
  }
  return upsertIntakeLead(lead)
}

export function markInitialTextSent(lead: IntakeLead): IntakeLead {
  const ts = new Date().toISOString()
  return upsertIntakeLead({
    ...lead,
    stage: 'awaiting-reply',
    initialTextSentAt: ts,
    followUpDueAt: addHours(ts, 24),
  })
}

export function markFollowUpSent(lead: IntakeLead): IntakeLead {
  const ts = new Date().toISOString()
  return upsertIntakeLead({
    ...lead,
    stage: 'follow-up-sent',
    followUpSentAt: ts,
  })
}

export function markOutreachStopped(lead: IntakeLead): IntakeLead {
  return upsertIntakeLead({
    ...lead,
    stage: 'closed-no-response',
    outreachStoppedAt: new Date().toISOString(),
  })
}

export function markCustomerReplied(lead: IntakeLead): IntakeLead {
  return upsertIntakeLead({
    ...lead,
    stage: 'on-call',
  })
}

export function patchIntakeLead(
  id: string,
  patch: Partial<IntakeLead>,
): IntakeLead | null {
  const existing = getIntakeLead(id)
  if (!existing) return null
  return upsertIntakeLead({ ...existing, ...patch, id: existing.id })
}

export function setIntakeStage(id: string, stage: IntakeStage): IntakeLead | null {
  return patchIntakeLead(id, { stage })
}

export function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text)
  }
  return Promise.reject(new Error('Clipboard not available'))
}

export { INITIAL_RESPONSE_TEXT, FOLLOW_UP_TEXT }

export function leadsNeedingFollowUp(leads: IntakeLead[], now = new Date()): IntakeLead[] {
  return leads.filter((l) => {
    if (l.stage !== 'awaiting-reply' || !l.followUpDueAt) return false
    return now.getTime() >= new Date(l.followUpDueAt).getTime()
  })
}

export function waitlistLeads(leads: IntakeLead[]): IntakeLead[] {
  return leads.filter((l) => l.stage === 'waitlist')
}

export function estimateQueueLeads(leads: IntakeLead[]): IntakeLead[] {
  return leads.filter((l) => l.stage === 'estimate-queue')
}

export function activePipelineLeads(leads: IntakeLead[]): IntakeLead[] {
  return leads.filter(
    (l) => !['closed-no-response', 'converted'].includes(l.stage),
  )
}

export type { PickupZone }
