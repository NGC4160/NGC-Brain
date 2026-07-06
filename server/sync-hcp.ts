import 'dotenv/config'
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHCPClientFromEnv, type HCPJobsExport } from './hcpClient.js'
import { trimJobsExport, mapHCPJobsExport, computeHCPExtras } from './hcpMapper.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public/data')

async function main() {
  const client = createHCPClientFromEnv()
  if (!client) {
    console.error('ERROR: HCP_API_KEY not set. Copy .env.example → .env and add your key.')
    process.exit(1)
  }

  console.log('Testing HCP connection...')
  await client.testConnection()
  console.log('  OK')

  console.log('Fetching jobs...')
  const jobs = await client.listAllJobs(20)
  console.log(`  ${jobs.length} jobs`)

  console.log('Fetching company...')
  const company = await client.getCompany()

  const exportData: HCPJobsExport = {
    synced_at: new Date().toISOString(),
    count: jobs.length,
    jobs,
  }

  const trimmed = trimJobsExport(exportData)
  const mapped = mapHCPJobsExport(trimmed)
  const extras = computeHCPExtras(trimmed.jobs)

  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(join(OUT_DIR, 'hcp-cache.json'), JSON.stringify(exportData, null, 2))
  writeFileSync(join(OUT_DIR, 'hcp-company.json'), JSON.stringify(company, null, 2))
  writeFileSync(
    join(OUT_DIR, 'hcp-dashboard.json'),
    JSON.stringify(
      {
        source: 'live',
        syncedAt: exportData.synced_at,
        jobCount: mapped.length,
        jobs: mapped,
        extras,
        company,
      },
      null,
      2,
    ),
  )

  console.log(`\nSaved → public/data/hcp-dashboard.json (${mapped.length} dashboard jobs)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
