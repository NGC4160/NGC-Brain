import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type Database from 'better-sqlite3'
import { getDb } from '../db/client.js'
import { newId, nowIso, toJson } from '../db/utils.js'
import { mapHCPStatus } from '../hcpMapper.js'
import type { HCPJob } from '../hcpClient.js'
import {
  csvRowToPricebookFields,
  parsePricebookCsv,
} from './parsePricebookCsv.js'
import type {
  HCPCompanyFile,
  HCPImportStats,
  HCPJobExport,
  HCPJobsFile,
  HCPPricebookServicesFile,
} from './hcpTypes.js'
import { HCP_EXPORT_FILES } from './hcpTypes.js'

function mapInternalStatus(workStatus?: string, job?: HCPJobExport): string {
  return mapHCPStatus(workStatus, job as HCPJob)
}

function assignedTech(job: HCPJobExport): string | null {
  const emp = job.assigned_employees?.[0]
  if (!emp) return null
  return [emp.first_name, emp.last_name].filter(Boolean).join(' ') || null
}

function inferVehicleFromTags(tags: string[], description: string) {
  const tagStr = tags.join(' ')
  const makes = ['Club Car', 'EZGO', 'EZ-GO', 'Yamaha', 'Star EV', 'Icon']
  let make: string | null = null
  for (const m of makes) {
    if (tagStr.toLowerCase().includes(m.toLowerCase()) || description.toLowerCase().includes(m.toLowerCase())) {
      make = m === 'EZ-GO' ? 'EZGO' : m
      break
    }
  }
  const models = ['Precedent', 'Onward', 'Tempo', 'RXV', 'TXT', 'Drive2', 'UMAX', 'Drive']
  let model: string | null = null
  for (const m of models) {
    if (tagStr.toLowerCase().includes(m.toLowerCase())) {
      model = m
      break
    }
  }
  const yearMatch = tagStr.match(/\b(19|20)\d{2}\b/)
  const year = yearMatch ? parseInt(yearMatch[0], 10) : null
  return { make, model, year, tags }
}

export function upsertCustomer(db: Database.Database, c: NonNullable<HCPJobExport['customer']>, address?: HCPJobExport['address']) {
  const hcpId = c.id
  if (!hcpId) return null

  const existing = db.prepare('SELECT id FROM customers WHERE hcp_customer_id = ?').get(hcpId) as { id: string } | undefined
  const ts = nowIso()
  const addresses = address ? [{ ...address, type: address.type ?? 'service' }] : []

  if (existing) {
    db.prepare(`UPDATE customers SET first_name=?, last_name=?, company=?, email=?, mobile=?, home_phone=?, work_phone=?, kind=?, lead_source=?, notes=?, tags=?, addresses=?, updated_at=?, source='hcp_import' WHERE id=?`).run(
      c.first_name ?? null, c.last_name ?? null, c.company ?? null, c.email ?? null, c.mobile_number ?? null,
      c.home_number ?? null, c.work_number ?? null, c.kind ?? null, c.lead_source ?? null, c.notes ?? null,
      toJson(c.tags ?? []), toJson(addresses), ts, existing.id,
    )
    return { id: existing.id, created: false }
  }

  const id = newId('cus')
  db.prepare(`INSERT INTO customers (id,hcp_customer_id,first_name,last_name,company,email,mobile,home_phone,work_phone,kind,lead_source,notes,tags,addresses,created_at,updated_at,source) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'hcp_import')`).run(
    id, hcpId, c.first_name ?? null, c.last_name ?? null, c.company ?? null, c.email ?? null, c.mobile_number ?? null,
    c.home_number ?? null, c.work_number ?? null, c.kind ?? null, c.lead_source ?? null, c.notes ?? null,
    toJson(c.tags ?? []), toJson(addresses), c.created_at ?? ts, c.updated_at ?? ts,
  )
  return { id, created: true }
}

function upsertVehicle(db: Database.Database, customerId: string, job: HCPJobExport) {
  const tags = [...(job.customer?.tags ?? []), ...(job.tags ?? [])]
  const { make, model, year } = inferVehicleFromTags(tags, job.description ?? '')
  if (!make && !model && !year) return null

  const existing = db.prepare(`SELECT id FROM vehicles WHERE customer_id=? AND COALESCE(make,'')=? AND COALESCE(model,'')=? LIMIT 1`).get(customerId, make ?? '', model ?? '') as { id: string } | undefined
  const ts = nowIso()
  if (existing) {
    db.prepare(`UPDATE vehicles SET year=?, tags=?, updated_at=?, source='hcp_import' WHERE id=?`).run(year, toJson(tags), ts, existing.id)
    return { id: existing.id, created: false }
  }
  const id = newId('veh')
  db.prepare(`INSERT INTO vehicles (id,customer_id,make,model,year,tags,created_at,updated_at,source) VALUES (?,?,?,?,?,?,?,?,'hcp_import')`).run(id, customerId, make, model, year, toJson(tags), ts, ts)
  return { id, created: true }
}

function upsertWorkOrder(db: Database.Database, job: HCPJobExport, customerId: string | null, vehicleId: string | null) {
  const existing = db.prepare('SELECT id FROM work_orders WHERE hcp_job_id = ?').get(job.id) as { id: string } | undefined
  const ts = nowIso()
  const fields = {
    invoice_number: job.invoice_number ?? null,
    customer_id: customerId,
    vehicle_id: vehicleId,
    description: job.description ?? null,
    work_status: job.work_status ?? null,
    internal_status: mapInternalStatus(job.work_status, job),
    total_cents: job.total_amount ?? 0,
    outstanding_cents: job.outstanding_balance ?? 0,
    subtotal_cents: job.subtotal ?? 0,
    assigned_tech: assignedTech(job),
    lead_source: job.lead_source ?? job.customer?.lead_source ?? null,
    tags: toJson(job.tags ?? []),
    notes: toJson(job.notes ?? []),
    schedule: toJson(job.schedule ?? null),
    work_timestamps: toJson(job.work_timestamps ?? null),
    updated_at: job.updated_at ?? ts,
    completed_at: job.work_timestamps?.completed_at ?? null,
    canceled_at: job.canceled_at ?? null,
  }

  if (existing) {
    db.prepare(`UPDATE work_orders SET invoice_number=?,customer_id=?,vehicle_id=?,description=?,work_status=?,internal_status=?,total_cents=?,outstanding_cents=?,subtotal_cents=?,assigned_tech=?,lead_source=?,tags=?,notes=?,schedule=?,work_timestamps=?,updated_at=?,completed_at=?,canceled_at=?,source='hcp_import' WHERE id=?`).run(
      ...Object.values(fields), existing.id,
    )
    return { created: false }
  }

  const id = job.invoice_number ? `HCP-${job.invoice_number}` : newId('wo')
  db.prepare(`INSERT INTO work_orders (id,hcp_job_id,invoice_number,customer_id,vehicle_id,description,work_status,internal_status,total_cents,outstanding_cents,subtotal_cents,assigned_tech,lead_source,tags,notes,schedule,work_timestamps,created_at,updated_at,completed_at,canceled_at,source) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'hcp_import')`).run(
    id, job.id, fields.invoice_number, fields.customer_id, fields.vehicle_id, fields.description,
    fields.work_status, fields.internal_status, fields.total_cents, fields.outstanding_cents, fields.subtotal_cents,
    fields.assigned_tech, fields.lead_source, fields.tags, fields.notes, fields.schedule, fields.work_timestamps,
    job.created_at ?? ts, fields.updated_at, fields.completed_at, fields.canceled_at,
  )
  return { created: true }
}

function upsertPricebookItem(db: Database.Database, fields: ReturnType<typeof csvRowToPricebookFields>, source: string) {
  const uuid = fields.hcp_uuid
  const existing = uuid ? db.prepare('SELECT id FROM pricebook_items WHERE hcp_uuid = ?').get(uuid) as { id: string } | undefined : undefined
  const ts = nowIso()

  if (existing) {
    db.prepare(`UPDATE pricebook_items SET name=?,description=?,category=?,industry=?,price_cents=?,cost_cents=?,taxable=?,unit_of_measure=?,task_code=?,online_booking_enabled=?,materials=?,labor_rates=?,updated_at=?,source=? WHERE id=?`).run(
      fields.name, fields.description, fields.category, fields.industry, fields.price_cents, fields.cost_cents,
      fields.taxable, fields.unit_of_measure, fields.task_code, fields.online_booking_enabled,
      toJson(fields.materials), toJson(fields.labor_rates), ts, source, existing.id,
    )
    return { created: false }
  }

  const id = newId('pb')
  db.prepare(`INSERT INTO pricebook_items (id,hcp_uuid,name,description,category,industry,price_cents,cost_cents,taxable,unit_of_measure,task_code,online_booking_enabled,materials,labor_rates,active,created_at,updated_at,source) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?)`).run(
    id, uuid, fields.name, fields.description, fields.category, fields.industry, fields.price_cents, fields.cost_cents,
    fields.taxable, fields.unit_of_measure, fields.task_code, fields.online_booking_enabled,
    toJson(fields.materials), toJson(fields.labor_rates), ts, ts, source,
  )
  return { created: true }
}

export function importJobsFile(db: Database.Database, data: HCPJobsFile, stats: HCPImportStats) {
  for (const job of data.jobs ?? []) {
    try {
      if (job.deleted_at) { stats.skipped++; continue }
      let customerId: string | null = null
      if (job.customer?.id) {
        const result = upsertCustomer(db, job.customer, job.address)
        if (result) {
          if (result.created) stats.customersCreated++
          else stats.customersUpdated++
          customerId = result.id
        }
      }
      let vehicleId: string | null = null
      if (customerId) {
        const veh = upsertVehicle(db, customerId, job)
        if (veh) { if (veh.created) stats.vehiclesCreated++; vehicleId = veh.id }
      }
      const wo = upsertWorkOrder(db, job, customerId, vehicleId)
      if (wo.created) stats.workOrdersCreated++
      else stats.workOrdersUpdated++
    } catch (err) {
      stats.errors.push(`Job ${job.invoice_number ?? job.id}: ${String(err)}`)
    }
  }
}

export function importPricebookCsvContent(db: Database.Database, content: string, stats: HCPImportStats) {
  for (const row of parsePricebookCsv(content)) {
    try {
      if (!row.uuid && !row.name) { stats.skipped++; continue }
      const result = upsertPricebookItem(db, csvRowToPricebookFields(row), 'hcp_csv_import')
      if (result.created) stats.pricebookCreated++
      else stats.pricebookUpdated++
    } catch (err) {
      stats.errors.push(`Pricebook ${row.name}: ${String(err)}`)
    }
  }
}

export function importPricebookServicesFile(db: Database.Database, data: HCPPricebookServicesFile, stats: HCPImportStats) {
  for (const svc of data.services ?? []) {
    try {
      const fields = csvRowToPricebookFields({
        uuid: svc.uuid as string,
        name: String(svc.name ?? ''),
        description: String(svc.description ?? ''),
        category: String(svc.category ?? 'Services'),
        price: String(svc.price ?? 0),
        cost: String(svc.cost ?? 0),
        taxable: svc.taxable ? 'true' : 'false',
      })
      const result = upsertPricebookItem(db, fields, 'hcp_api_import')
      if (result.created) stats.pricebookCreated++
      else stats.pricebookUpdated++
    } catch (err) {
      stats.errors.push(`Service ${svc.name}: ${String(err)}`)
    }
  }
}

export function importCompanyFile(db: Database.Database, company: HCPCompanyFile) {
  db.prepare(`INSERT INTO app_settings (key,value,updated_at) VALUES ('hcp_company',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`).run(toJson(company), nowIso())
}

function importMaterialCategoriesFile(db: Database.Database, data: unknown) {
  db.prepare(`INSERT INTO app_settings (key,value,updated_at) VALUES ('hcp_material_categories',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`).run(toJson(data), nowIso())
}

function importApiSyncManifest(db: Database.Database, data: unknown) {
  db.prepare(`INSERT INTO app_settings (key,value,updated_at) VALUES ('hcp_api_sync_manifest',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`).run(toJson(data), nowIso())
}

export function importFromDirectory(dirPath: string): HCPImportStats {
  const db = getDb()
  const stats: HCPImportStats = { customersCreated: 0, customersUpdated: 0, vehiclesCreated: 0, workOrdersCreated: 0, workOrdersUpdated: 0, pricebookCreated: 0, pricebookUpdated: 0, skipped: 0, errors: [] }
  const runId = newId('import')
  db.prepare(`INSERT INTO import_runs (id,import_type,source_file,started_at,status,stats,errors) VALUES (?,'hcp_directory',?,?,'running','{}','[]')`).run(runId, dirPath, nowIso())

  const jobsPath = join(dirPath, HCP_EXPORT_FILES.jobs)
  if (existsSync(jobsPath)) importJobsFile(db, JSON.parse(readFileSync(jobsPath, 'utf-8')) as HCPJobsFile, stats)
  else stats.errors.push(`Missing ${HCP_EXPORT_FILES.jobs}`)

  const companyPath = join(dirPath, HCP_EXPORT_FILES.company)
  if (existsSync(companyPath)) importCompanyFile(db, JSON.parse(readFileSync(companyPath, 'utf-8')) as HCPCompanyFile)

  const servicesPath = join(dirPath, HCP_EXPORT_FILES.pricebookServices)
  if (existsSync(servicesPath)) importPricebookServicesFile(db, JSON.parse(readFileSync(servicesPath, 'utf-8')) as HCPPricebookServicesFile, stats)

  for (const csvPath of [join(dirPath, HCP_EXPORT_FILES.pricebookCsv), join(dirPath, 'pricebook', HCP_EXPORT_FILES.pricebookCsv)]) {
    if (existsSync(csvPath)) { importPricebookCsvContent(db, readFileSync(csvPath, 'utf-8'), stats); break }
  }

  const categoriesPath = join(dirPath, HCP_EXPORT_FILES.pricebookMaterialCategories)
  if (existsSync(categoriesPath)) {
    importMaterialCategoriesFile(db, JSON.parse(readFileSync(categoriesPath, 'utf-8')))
  }

  const manifestPath = join(dirPath, HCP_EXPORT_FILES.apiSyncManifest)
  if (existsSync(manifestPath)) {
    importApiSyncManifest(db, JSON.parse(readFileSync(manifestPath, 'utf-8')))
  }

  db.prepare(`UPDATE import_runs SET completed_at=?, status=?, stats=?, errors=? WHERE id=?`).run(nowIso(), stats.errors.length ? 'completed_with_errors' : 'completed', toJson(stats), toJson(stats.errors), runId)
  return stats
}

export function importDefaultExports(): HCPImportStats {
  for (const dir of ['data/imports/hcp', 'public/data', 'external_docs/exports/hcp'].map((d) => join(process.cwd(), d))) {
    if (existsSync(join(dir, HCP_EXPORT_FILES.jobs))) return importFromDirectory(dir)
  }
  const cachePath = join(process.cwd(), 'public/data/hcp-cache.json')
  if (existsSync(cachePath)) {
    const db = getDb()
    const stats: HCPImportStats = { customersCreated: 0, customersUpdated: 0, vehiclesCreated: 0, workOrdersCreated: 0, workOrdersUpdated: 0, pricebookCreated: 0, pricebookUpdated: 0, skipped: 0, errors: [] }
    importJobsFile(db, JSON.parse(readFileSync(cachePath, 'utf-8')) as HCPJobsFile, stats)
    return stats
  }
  throw new Error('No HCP export files found. Place exports in data/imports/hcp/')
}

export function getImportStatus() {
  const db = getDb()
  return {
    counts: {
      customers: (db.prepare('SELECT COUNT(*) as c FROM customers').get() as { c: number }).c,
      vehicles: (db.prepare('SELECT COUNT(*) as c FROM vehicles').get() as { c: number }).c,
      workOrders: (db.prepare('SELECT COUNT(*) as c FROM work_orders').get() as { c: number }).c,
      pricebookItems: (db.prepare('SELECT COUNT(*) as c FROM pricebook_items').get() as { c: number }).c,
    },
    lastImport: db.prepare('SELECT * FROM import_runs ORDER BY started_at DESC LIMIT 1').get(),
    bookkeeper: (db.prepare(`SELECT value FROM app_settings WHERE key='bookkeeper'`).get() as { value: string } | undefined)?.value ?? 'Griffin & Furman, LLC',
  }
}
