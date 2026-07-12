import type { StaffRole } from '@/config/staff'
import type { KpiDefinitionMeta, KpiFormat, KpiDirection, KpiThresholds } from '../types'

export interface CfoPackMetric {
  id: string
  name: string
  value: number
  format: KpiFormat
  unit: string
  direction: KpiDirection
  defaultTarget: number
  defaultThresholds: KpiThresholds
  shortDescription: string
  description: string
  formula: string
  historicalContext: string
  category: 'cfo'
  accessRoles: StaffRole[]
  source: 'cfo-pack'
}

export interface CfoPack {
  id: string
  title: string
  kind: string
  periodLabel: string
  sourceFile: string
  asOf: string
  generatedAt: string
  metricCount: number
  metrics: CfoPackMetric[]
}

export interface CfoManifest {
  generatedAt: string
  packCount: number
  metricCount: number
  scanDirs: string[]
  packs: {
    id: string
    title: string
    kind: string
    periodLabel: string
    sourceFile: string
    file: string
    asOf: string
    metricCount: number
    generatedAt: string
  }[]
}

export function cfoMetricToMeta(m: CfoPackMetric): KpiDefinitionMeta {
  return {
    id: m.id,
    name: m.name,
    shortDescription: m.shortDescription,
    description: m.description,
    formula: m.formula,
    historicalContext: m.historicalContext,
    category: 'cfo',
    format: m.format,
    unit: m.unit,
    direction: m.direction,
    defaultTarget: m.defaultTarget,
    defaultThresholds: m.defaultThresholds,
    accessRoles: m.accessRoles,
    source: 'cfo-pack',
  }
}

/** Fetch manifest + every pack JSON from public/data/cfo (built by build:cfo-packs). */
export async function loadCfoPacks(): Promise<{
  manifest: CfoManifest | null
  packs: CfoPack[]
  metrics: CfoPackMetric[]
}> {
  const base = `${import.meta.env.BASE_URL}data/cfo/`
  try {
    const res = await fetch(`${base}manifest.json`, { cache: 'no-store' })
    if (!res.ok) return { manifest: null, packs: [], metrics: [] }
    const manifest = (await res.json()) as CfoManifest
    const packs: CfoPack[] = []
    for (const entry of manifest.packs ?? []) {
      try {
        const pr = await fetch(`${base}${entry.file}`, { cache: 'no-store' })
        if (!pr.ok) continue
        packs.push((await pr.json()) as CfoPack)
      } catch {
        // skip broken pack
      }
    }
    const metrics = packs.flatMap((p) => p.metrics)
    return { manifest, packs, metrics }
  } catch {
    return { manifest: null, packs: [], metrics: [] }
  }
}
