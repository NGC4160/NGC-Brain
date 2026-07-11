import { Router } from 'express'
import multer from 'multer'
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
import {
  createWorkOrder,
  getWorkOrder,
  listWorkOrders,
  updateWorkOrder,
  type WorkOrderInput,
} from '../db/workOrders.js'
import { buildQcContext, saveQcSubmission } from '../qc/qcService.js'
import { getLatestQcForJob, listQcSubmissions } from '../db/qcSubmissions.js'

export const apiRouter = Router()

const qcUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024, files: 100 },
})

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

apiRouter.get('/dms/jobs', (_req, res) => {
  const jobs = listWorkOrders()
  res.json({ count: jobs.length, jobs, writable: true })
})

apiRouter.get('/dms/jobs/:id', (req, res) => {
  const job = getWorkOrder(req.params.id)
  if (!job) {
    res.status(404).json({ error: 'Work order not found' })
    return
  }
  res.json({ job })
})

apiRouter.post('/dms/jobs', (req, res) => {
  try {
    const body = req.body as WorkOrderInput
    if (!body?.customerName || !body?.make || !body?.model || !body?.issueDescription) {
      res.status(400).json({ error: 'customerName, make, model, and issueDescription are required' })
      return
    }
    const job = createWorkOrder(body)
    res.status(201).json({ ok: true, job })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(400).json({ ok: false, error: message })
  }
})

apiRouter.patch('/dms/jobs/:id', (req, res) => {
  try {
    const job = updateWorkOrder(req.params.id, req.body as Partial<WorkOrderInput>)
    res.json({ ok: true, job })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const status = message.includes('not found') ? 404 : 400
    res.status(status).json({ ok: false, error: message })
  }
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
  const jobs = listWorkOrders()
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
    writable: true,
  })
})

// --- Shop QC forms ---

apiRouter.get('/qc/context', (req, res) => {
  const jobNumber = String(req.query.job ?? req.query.invoice ?? '').trim()
  const workOrderId = String(req.query.workOrderId ?? '').trim()
  const context = buildQcContext(jobNumber || undefined, workOrderId || undefined)
  if (!context) {
    res.status(404).json({ error: 'Job not found' })
    return
  }
  res.json(context)
})

apiRouter.get('/qc/submissions', (_req, res) => {
  res.json({ submissions: listQcSubmissions() })
})

apiRouter.get('/qc/submissions/:jobNumber/latest', (req, res) => {
  const submission = getLatestQcForJob(req.params.jobNumber)
  if (!submission) {
    res.status(404).json({ error: 'No QC submission for this job' })
    return
  }
  res.json({ submission })
})

apiRouter.post('/qc/save', qcUpload.array('media'), async (req, res) => {
  try {
    const payloadRaw = req.body?.payload
    if (!payloadRaw) {
      res.status(400).json({ ok: false, error: 'Missing form payload.' })
      return
    }
    const payload = JSON.parse(String(payloadRaw)) as Record<string, unknown>
    const files = (req.files as Express.Multer.File[] | undefined) ?? []
    const moveToReady = req.body?.moveToReady !== 'false'

    const result = await saveQcSubmission({
      payload,
      media: files.map((f) => ({
        originalName: f.originalname,
        buffer: f.buffer,
        mimeType: f.mimetype,
      })),
      moveToReady,
    })

    res.json({
      ok: true,
      fileName: result.fileName,
      file: `QC forms/${result.fileName}`,
      mediaCount: result.mediaCount,
      workOrderId: result.workOrderId,
      movedToReady: result.movedToReady,
      message: `Saved to QC forms/${result.fileName}`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(400).json({ ok: false, error: message })
  }
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
