import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { HCPJobsExport } from './hcpClient.js'
import { computeHCPExtras, mapHCPJobsExport, trimJobsExport } from './hcpMapper.js'
import { buildInvoicingPayload } from './hcpInvoicing.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'public/data/hcp-dashboard.json')

function loadJobsExport(): HCPJobsExport | null {
  const candidates = [
    join(ROOT, 'public/data/hcp-cache.json'),
    join(ROOT, 'data/imports/hcp/jobs.json'),
  ]
  for (const path of candidates) {
    if (!existsSync(path)) continue
    try {
      return JSON.parse(readFileSync(path, 'utf-8')) as HCPJobsExport
    } catch {
      // try next
    }
  }
  return null
}

function main() {
  const exportData = loadJobsExport()
  if (!exportData) {
    if (existsSync(OUT)) {
      console.log(`No HCP cache found — keeping existing ${OUT}`)
      return
    }
    throw new Error(
      'No HCP data found. Add public/data/hcp-cache.json or data/imports/hcp/jobs.json, or run npm run sync:hcp',
    )
  }

  const trimmed = trimJobsExport(exportData)
  const jobs = mapHCPJobsExport(trimmed)
  const extras = computeHCPExtras(trimmed.jobs)

  let company = null
  try {
    company = JSON.parse(readFileSync(join(ROOT, 'public/data/hcp-company.json'), 'utf-8'))
  } catch {
    company = null
  }

  const invoicing = buildInvoicingPayload(exportData)

  const payload = {
    source: 'cache' as const,
    syncedAt: exportData.synced_at ?? new Date().toISOString(),
    jobCount: jobs.length,
    jobs,
    extras,
    company,
    invoicing,
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(payload, null, 2))
  writeFileSync(
    join(ROOT, 'public/data/hcp-invoicing.json'),
    JSON.stringify(invoicing, null, 2),
  )
  console.log(`Built ${OUT} — ${jobs.length} jobs, ${invoicing.invoices.length} invoices`)
}

main()
