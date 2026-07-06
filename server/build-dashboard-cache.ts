import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { HCPJobsExport } from './hcpClient.js'
import { computeHCPExtras, mapHCPJobsExport, trimJobsExport } from './hcpMapper.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'public/data/hcp-dashboard.json')

function main() {
  const cachePath = join(ROOT, 'public/data/hcp-cache.json')
  const raw = readFileSync(cachePath, 'utf-8')
  const exportData = JSON.parse(raw) as HCPJobsExport
  const trimmed = trimJobsExport(exportData)
  const jobs = mapHCPJobsExport(trimmed)
  const extras = computeHCPExtras(trimmed.jobs)

  let company = null
  try {
    company = JSON.parse(readFileSync(join(ROOT, 'public/data/hcp-company.json'), 'utf-8'))
  } catch {
    company = null
  }

  const payload = {
    source: 'cache' as const,
    syncedAt: exportData.synced_at ?? new Date().toISOString(),
    jobCount: jobs.length,
    jobs,
    extras,
    company,
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(payload, null, 2))
  console.log(`Built ${OUT} — ${jobs.length} jobs`)
}

main()
