import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHCPClientFromEnv, type HCPJobsExport } from './hcpClient.js'
import {
  computeHCPExtras,
  mapHCPJobsExport,
  trimJobsExport,
} from './hcpMapper.js'
import { buildInvoicingPayload } from './hcpInvoicing.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PORT = Number(process.env.PORT ?? 3001)

const app = express()
app.use(cors())
app.use(express.json())

function loadCache(): HCPJobsExport | null {
  try {
    const raw = readFileSync(join(ROOT, 'public/data/hcp-cache.json'), 'utf-8')
    return JSON.parse(raw) as HCPJobsExport
  } catch {
    return null
  }
}

function buildDashboardPayload(exportData: HCPJobsExport, source: 'live' | 'cache') {
  const trimmed = trimJobsExport(exportData)
  const jobs = mapHCPJobsExport(trimmed)
  const extras = computeHCPExtras(trimmed.jobs)

  let company: Record<string, unknown> | null = null
  try {
    company = JSON.parse(
      readFileSync(join(ROOT, 'public/data/hcp-company.json'), 'utf-8'),
    ) as Record<string, unknown>
  } catch {
    company = null
  }

  return {
    source,
    syncedAt: trimmed.synced_at ?? new Date().toISOString(),
    jobCount: jobs.length,
    jobs,
    extras,
    company,
    invoicing: buildInvoicingPayload(exportData),
  }
}

app.get('/api/hcp/health', async (_req, res) => {
  const client = createHCPClientFromEnv()
  if (!client) {
    res.json({ ok: false, mode: 'cache', message: 'HCP_API_KEY not set — using cached data' })
    return
  }
  try {
    const result = await client.testConnection()
    res.json({ ok: true, mode: 'live', companyName: result.company?.name })
  } catch (err) {
    res.status(502).json({ ok: false, mode: 'live', message: String(err) })
  }
})

app.get('/api/hcp/dashboard', async (_req, res) => {
  const client = createHCPClientFromEnv()

  if (client) {
    try {
      const liveJobs = await client.listAllJobs(10)
      const exportData: HCPJobsExport = {
        synced_at: new Date().toISOString(),
        count: liveJobs.length,
        jobs: liveJobs,
      }

      try {
        const company = await client.getCompany()
        mkdirSync(join(ROOT, 'public/data'), { recursive: true })
        writeFileSync(
          join(ROOT, 'public/data/hcp-company.json'),
          JSON.stringify(company, null, 2),
        )
      } catch {
        // company fetch optional
      }

      const trimmed = trimJobsExport(exportData)
      mkdirSync(join(ROOT, 'public/data'), { recursive: true })
      writeFileSync(
        join(ROOT, 'public/data/hcp-dashboard.json'),
        JSON.stringify(buildDashboardPayload(exportData, 'live'), null, 2),
      )

      res.json(buildDashboardPayload(exportData, 'live'))
      return
    } catch (err) {
      console.error('Live HCP fetch failed, falling back to cache:', err)
    }
  }

  const cache = loadCache()
  if (!cache) {
    res.status(503).json({ error: 'No HCP data available. Run npm run sync:hcp or set HCP_API_KEY.' })
    return
  }

  res.json(buildDashboardPayload(cache, 'cache'))
})

app.post('/api/hcp/sync', async (_req, res) => {
  const client = createHCPClientFromEnv()
  if (!client) {
    res.status(400).json({ error: 'HCP_API_KEY not set' })
    return
  }

  try {
    const liveJobs = await client.listAllJobs(20)
    const company = await client.getCompany()
    const exportData: HCPJobsExport = {
      synced_at: new Date().toISOString(),
      count: liveJobs.length,
      jobs: liveJobs,
    }

    mkdirSync(join(ROOT, 'public/data'), { recursive: true })
    writeFileSync(join(ROOT, 'public/data/hcp-cache.json'), JSON.stringify(exportData, null, 2))
    writeFileSync(join(ROOT, 'public/data/hcp-company.json'), JSON.stringify(company, null, 2))
    writeFileSync(
      join(ROOT, 'public/data/hcp-dashboard.json'),
      JSON.stringify(buildDashboardPayload(exportData, 'live'), null, 2),
    )

    res.json({
      ok: true,
      syncedAt: exportData.synced_at,
      jobCount: liveJobs.length,
    })
  } catch (err) {
    res.status(502).json({ error: String(err) })
  }
})

app.get('/api/hcp/invoicing', async (_req, res) => {
  const client = createHCPClientFromEnv()

  if (client) {
    try {
      const liveJobs = await client.listAllJobs(10)
      const exportData: HCPJobsExport = {
        synced_at: new Date().toISOString(),
        count: liveJobs.length,
        jobs: liveJobs,
      }
      res.json(buildInvoicingPayload(exportData))
      return
    } catch (err) {
      console.error('Live HCP invoicing fetch failed:', err)
    }
  }

  const cache = loadCache()
  if (!cache) {
    res.status(503).json({ error: 'No HCP data available' })
    return
  }

  res.json(buildInvoicingPayload(cache))
})
  console.log(`HCP API proxy listening on http://localhost:${PORT}`)
  console.log(
    createHCPClientFromEnv()
      ? 'Mode: live (HCP_API_KEY configured)'
      : 'Mode: cache (set HCP_API_KEY in .env for live data)',
  )
})
