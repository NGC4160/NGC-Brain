import { hasFullSopLibrary, type StaffRole } from '@/config/staff'
import { SOP_CATALOG } from './catalog'
import type { SopDefinition, SopRunRecord, SopSection, SopStatus } from './types'

export const SOP_SECTION_LABELS: Record<SopSection, string> = {
  office: 'Office',
  shop: 'Shop floor',
  driver: 'Pickup & delivery',
  shared: 'Shop-wide',
}

export const SOP_SECTION_ORDER: SopSection[] = ['office', 'shop', 'driver', 'shared']

const CUSTOM_KEY = 'ngc-custom-sops-v1'
const RUNS_KEY = 'ngc-sop-runs-v1'

function loadCustomSops(): SopDefinition[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SopDefinition[]
    if (!Array.isArray(parsed)) return []
    return parsed.map((s) => ({ ...s, section: s.section ?? 'shared' }))
  } catch {
    return []
  }
}

export function saveCustomSop(sop: SopDefinition) {
  const all = loadCustomSops().filter((s) => s.id !== sop.id)
  localStorage.setItem(CUSTOM_KEY, JSON.stringify([sop, ...all]))
}

export function listAllSops(): SopDefinition[] {
  const custom = typeof window !== 'undefined' ? loadCustomSops() : []
  const byId = new Map<string, SopDefinition>()
  for (const sop of SOP_CATALOG) byId.set(sop.id, sop)
  for (const sop of custom) byId.set(sop.id, sop)
  return Array.from(byId.values())
}

export function getSop(id: string): SopDefinition | undefined {
  return listAllSops().find((s) => s.id === id)
}

export function sopsForRole(
  role: StaffRole | null,
  opts?: { status?: SopStatus | SopStatus[] },
): SopDefinition[] {
  const statuses = opts?.status
    ? Array.isArray(opts.status)
      ? opts.status
      : [opts.status]
    : (['active'] as SopStatus[])
  return listAllSops().filter((sop) => {
    if (!statuses.includes(sop.status)) return false
    if (!role) return false
    // Ryan (SM), Christine (office), and Owner can read the full library any time
    if (hasFullSopLibrary(role)) return true
    return sop.accessRoles.includes(role)
  })
}

export function groupSopsBySection(sops: SopDefinition[]): { section: SopSection; label: string; sops: SopDefinition[] }[] {
  return SOP_SECTION_ORDER.map((section) => ({
    section,
    label: SOP_SECTION_LABELS[section],
    sops: sops.filter((s) => (s.section ?? 'shared') === section),
  })).filter((g) => g.sops.length > 0)
}

export function loadSopRuns(): Record<string, SopRunRecord> {
  try {
    const raw = localStorage.getItem(RUNS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, SopRunRecord>
  } catch {
    return {}
  }
}

export function getSopRun(sopId: string): SopRunRecord | null {
  return loadSopRuns()[sopId] ?? null
}

export function saveSopRun(run: SopRunRecord) {
  const all = loadSopRuns()
  all[run.sopId] = { ...run, updatedAt: new Date().toISOString() }
  localStorage.setItem(RUNS_KEY, JSON.stringify(all))
}

export function startOrResumeRun(sopId: string, runBy: string): SopRunRecord {
  const existing = getSopRun(sopId)
  if (existing && !existing.completedAt) return existing
  const ts = new Date().toISOString()
  const run: SopRunRecord = {
    sopId,
    startedAt: ts,
    updatedAt: ts,
    checked: {},
    notes: '',
    runBy,
  }
  saveSopRun(run)
  return run
}

export function toggleRunItem(sopId: string, itemId: string, checked: boolean) {
  const run = getSopRun(sopId)
  if (!run) return
  saveSopRun({
    ...run,
    checked: { ...run.checked, [itemId]: checked },
  })
}

export function completeSopRun(sopId: string) {
  const run = getSopRun(sopId)
  if (!run) return
  saveSopRun({
    ...run,
    completedAt: new Date().toISOString(),
  })
}

export function resetSopRun(sopId: string, runBy: string) {
  const ts = new Date().toISOString()
  saveSopRun({
    sopId,
    startedAt: ts,
    updatedAt: ts,
    checked: {},
    notes: '',
    runBy,
  })
}

export function checklistProgress(
  sop: SopDefinition,
  run: SopRunRecord | null,
): { done: number; total: number; requiredDone: number; requiredTotal: number } {
  const items = sop.checklist ?? []
  const required = items.filter((i) => i.required !== false)
  const done = items.filter((i) => run?.checked[i.id]).length
  const requiredDone = required.filter((i) => run?.checked[i.id]).length
  return {
    done,
    total: items.length,
    requiredDone,
    requiredTotal: required.length,
  }
}

/** Template used when adding a future SOP via Settings / registry */
export function createDraftSop(partial: Partial<SopDefinition> & Pick<SopDefinition, 'id' | 'title'>): SopDefinition {
  return {
    shortTitle: partial.shortTitle ?? partial.title,
    description: partial.description ?? '',
    ownerRoles: partial.ownerRoles ?? ['service-manager'],
    accessRoles: partial.accessRoles ?? ['service-manager', 'owner', 'front-desk'],
    status: partial.status ?? 'draft',
    runtime: partial.runtime ?? 'checklist',
    modulePath: partial.modulePath ?? `/sops/${partial.id}`,
    tags: partial.tags ?? ['custom'],
    section: partial.section ?? 'shared',
    steps: partial.steps ?? [],
    checklist: partial.checklist ?? [],
    lastVerified: new Date().toISOString().slice(0, 10),
    ...partial,
    id: partial.id,
    title: partial.title,
  }
}
