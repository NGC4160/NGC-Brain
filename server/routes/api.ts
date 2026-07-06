import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import {
  exchangeCodeForTokens,
  getAuthorizationUrl,
  getConnection,
  isQboConfigured,
  NGC_BOOKKEEPER,
  qboRequest,
} from '../qbo/client.js'
import {
  getImportStatus,
  importDefaultExports,
  importFromDirectory,
} from '../import/hcpImportService.js'
import { getDb } from '../db/client.js'
import type { RepairJob } from '../../src/types/index.js'

export const apiRouter = Router()

function computeDmsExtras() {
  const db = getDb()
  const fleetAccounts = (
    db.prepare(`SELECT COUNT(DISTINCT id) as c FROM customers WHERE (company IS NOT NULL AND company != '') OR kind IN ('commercial','business')`).get() as { c: number }
  ).c
  const partsOnOrder = (
    db.prepare(`SELECT COUNT(*) as c FROM work_orders WHERE internal_status NOT IN ('picked-up','ready') AND (LOWER(description) LIKE '%part%' OR LOWER(description) LIKE '%order%')`).get() as { c: number }
  ).c
  return { fleetAccounts, partsOnOrder, lowStockAlerts: 0 }
}

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'ngc-dms-api' })
})

// --- HCP Import ---

apiRouter.get('/import/status', (_req, res) => {
  res.json(getImportStatus())
})

apiRouter.post('/import/hcp', (req, res) => {
  try {
    const dir = req.body?.directory as string | undefined
    const stats = dir ? importFromDirectory(dir) : importDefaultExports()
    res.json({ ok: true, stats, status: getImportStatus() })
  } catch (err) {
    res.status(400).json({ ok: false, error: String(err) })
  }
})

// --- DMS data (from SQLite) ---

function workOrdersToRepairJobs(): RepairJob[] {
  const db = getDb()
  const rows = db.prepare(`
    SELECT wo.*, c.first_name, c.last_name, c.company, v.make, v.model, v.year
    FROM work_orders wo
    LEFT JOIN customers c ON c.id = wo.customer_id
    LEFT JOIN vehicles v ON v.id = wo.vehicle_id
    ORDER BY wo.updated_at DESC
  `).all() as Array<Record<string, unknown>>

  return rows.map((r) => ({
    id: String(r.id),
    customerName: String(r.company || [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Unknown'),
    make: String(r.make || 'Other'),
    model: String(r.model || 'Golf Cart'),
    year: r.year ? Number(r.year) : undefined,
    issueDescription: String(r.description || ''),
    priority: 'normal' as const,
    assignedTech: r.assigned_tech ? String(r.assigned_tech) : undefined,
    status: (r.internal_status || 'received') as RepairJob['status'],
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
    estimatedRevenue: r.total_cents ? Math.round(Number(r.total_cents) / 100) : undefined,
    completedAt: r.completed_at ? String(r.completed_at) : undefined,
    hcpId: r.hcp_job_id ? String(r.hcp_job_id) : undefined,
    outstandingBalance: r.outstanding_cents ? Math.round(Number(r.outstanding_cents) / 100) : undefined,
  }))
}

apiRouter.get('/dms/jobs', (_req, res) => {
  const jobs = workOrdersToRepairJobs()
  res.json({ count: jobs.length, jobs })
})

apiRouter.get('/dms/customers', (_req, res) => {
  const db = getDb()
  const customers = db.prepare('SELECT id, first_name, last_name, company, email, mobile, tags, hcp_customer_id, qbo_customer_id FROM customers ORDER BY updated_at DESC LIMIT 500').all()
  res.json({ count: customers.length, customers })
})

apiRouter.get('/dms/pricebook', (_req, res) => {
  const db = getDb()
  const items = db.prepare('SELECT id, hcp_uuid, name, category, price_cents, cost_cents, taxable, active, qbo_item_id, income_account FROM pricebook_items WHERE active = 1 ORDER BY category, name').all()
  res.json({ count: items.length, items })
})

apiRouter.get('/dms/dashboard', (_req, res) => {
  const db = getDb()
  const jobs = workOrdersToRepairJobs()
  const lastImport = db.prepare('SELECT completed_at FROM import_runs WHERE status LIKE \'completed%\' ORDER BY completed_at DESC LIMIT 1').get() as { completed_at: string } | undefined

  let company: Record<string, unknown> | null = null
  const companyRow = db.prepare(`SELECT value FROM app_settings WHERE key='hcp_company'`).get() as { value: string } | undefined
  if (companyRow) {
    try { company = JSON.parse(companyRow.value) as Record<string, unknown> } catch { company = null }
  }

  res.json({
    source: 'dms',
    syncedAt: lastImport?.completed_at ?? new Date().toISOString(),
    jobCount: jobs.length,
    jobs,
    extras: computeDmsExtras(),
    company,
    bookkeeper: NGC_BOOKKEEPER,
  })
})

// --- QuickBooks Online ---

apiRouter.get('/qbo/status', (_req, res) => {
  const conn = getConnection()
  res.json({
    configured: isQboConfigured(),
    connected: !!conn,
    realmId: conn?.realm_id ?? null,
    companyName: conn?.company_name ?? null,
    bookkeeper: NGC_BOOKKEEPER,
  })
})

apiRouter.get('/qbo/connect', (_req, res) => {
  if (!isQboConfigured()) {
    res.status(400).json({ error: 'Set QBO_CLIENT_ID and QBO_CLIENT_SECRET in .env' })
    return
  }
  const state = randomUUID()
  res.json({ url: getAuthorizationUrl(state), state })
})

apiRouter.get('/qbo/callback', async (req, res) => {
  try {
    const code = String(req.query.code ?? '')
    const realmId = String(req.query.realmId ?? '')
    if (!code || !realmId) throw new Error('Missing code or realmId')
    await exchangeCodeForTokens(code, realmId)
    res.send(`<html><body><h2>QuickBooks connected</h2><p>You can close this window and return to the NGC dashboard.</p><script>setTimeout(()=>window.close(),2000)</script></body></html>`)
  } catch (err) {
    res.status(500).send(`QBO connection failed: ${String(err)}`)
  }
})

apiRouter.get('/qbo/companyinfo', async (_req, res) => {
  try {
    const data = await qboRequest<{ CompanyInfo: { CompanyName: string } }>('/companyinfo/1')
    res.json(data)
  } catch (err) {
    res.status(502).json({ error: String(err) })
  }
})
