import type { KpiThresholds } from './types'

const KEY = 'ngc-kpi-thresholds-v1'

export interface KpiOverride {
  target: number
  thresholds: KpiThresholds
}

export type KpiOverrideMap = Record<string, KpiOverride>

export function getKpiOverrides(): KpiOverrideMap {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as KpiOverrideMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveKpiOverride(id: string, override: KpiOverride) {
  const all = getKpiOverrides()
  all[id] = override
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function clearKpiOverride(id: string) {
  const all = getKpiOverrides()
  delete all[id]
  localStorage.setItem(KEY, JSON.stringify(all))
}
