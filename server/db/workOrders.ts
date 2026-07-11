import { getDb } from './client.js'
import { newId, nowIso, toJson } from './utils.js'
import type { JobPriority, JobStatus, RepairJob } from '../../src/types/index.js'
import { evaluateDepositGate } from '../../src/lib/depositGates.js'

export interface WorkOrderInput {
  customerName: string
  make: string
  model: string
  year?: number
  serialVin?: string
  issueDescription: string
  priority?: JobPriority
  assignedTech?: string
  status?: JobStatus
  estimatedRevenue?: number
  paidAmount?: number
  force?: boolean
}

function ensureColumns() {
  const db = getDb()
  const cols = (db.prepare(`PRAGMA table_info(work_orders)`).all() as Array<{ name: string }>).map(
    (c) => c.name,
  )
  const add = (name: string, ddl: string) => {
    if (!cols.includes(name)) db.exec(`ALTER TABLE work_orders ADD COLUMN ${ddl}`)
  }
  add('priority', "priority TEXT NOT NULL DEFAULT 'normal'")
  add('paid_cents', 'paid_cents INTEGER NOT NULL DEFAULT 0')
  add('customer_name', 'customer_name TEXT')
  add('make', 'make TEXT')
  add('model', 'model TEXT')
  add('year', 'year INTEGER')
  add('serial_vin', 'serial_vin TEXT')
}

ensureColumns()

function rowToJob(r: Record<string, unknown>): RepairJob {
  const description = String(r.description || '')
  const total = r.total_cents ? Math.round(Number(r.total_cents) / 100) : 0
  const paid = r.paid_cents ? Math.round(Number(r.paid_cents) / 100) : 0
  const status = String(r.internal_status || 'received') as JobStatus
  const gate = evaluateDepositGate({
    description,
    totalAmount: total,
    paidAmount: paid,
    status,
  })

  const customerName = String(
    r.customer_name ||
      r.company ||
      [r.first_name, r.last_name].filter(Boolean).join(' ') ||
      'Unknown',
  )

  return {
    id: String(r.id),
    customerName,
    make: String(r.make || r.veh_make || 'Other'),
    model: String(r.model || r.veh_model || 'Golf Cart'),
    year: r.year || r.veh_year ? Number(r.year || r.veh_year) : undefined,
    serialVin: r.serial_vin ? String(r.serial_vin) : undefined,
    issueDescription: description,
    priority: (String(r.priority || 'normal') as JobPriority),
    assignedTech: r.assigned_tech ? String(r.assigned_tech) : undefined,
    status,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
    estimatedRevenue: total || undefined,
    paidAmount: paid || undefined,
    completedAt: r.completed_at ? String(r.completed_at) : undefined,
    hcpId: r.hcp_job_id ? String(r.hcp_job_id) : undefined,
    invoiceNumber: r.invoice_number
      ? String(r.invoice_number)
      : String(r.id).startsWith('HCP-')
        ? String(r.id).slice(4)
        : undefined,
    outstandingBalance: r.outstanding_cents
      ? Math.round(Number(r.outstanding_cents) / 100)
      : Math.max(0, total - paid) || undefined,
    jobType: gate.jobType,
    requiredDeposit: gate.requiredDeposit || undefined,
    depositGap: gate.gapAmount || undefined,
    depositBlocked: gate.blocked || undefined,
    depositMessage: gate.message || undefined,
  }
}

export function listWorkOrders(): RepairJob[] {
  const db = getDb()
  const rows = db
    .prepare(
      `
    SELECT wo.*,
           c.first_name, c.last_name, c.company,
           v.make as veh_make, v.model as veh_model, v.year as veh_year
    FROM work_orders wo
    LEFT JOIN customers c ON c.id = wo.customer_id
    LEFT JOIN vehicles v ON v.id = wo.vehicle_id
    ORDER BY wo.updated_at DESC
  `,
    )
    .all() as Array<Record<string, unknown>>
  return rows.map(rowToJob)
}

export function getWorkOrder(id: string): RepairJob | null {
  const db = getDb()
  const row = db
    .prepare(
      `
    SELECT wo.*,
           c.first_name, c.last_name, c.company,
           v.make as veh_make, v.model as veh_model, v.year as veh_year
    FROM work_orders wo
    LEFT JOIN customers c ON c.id = wo.customer_id
    LEFT JOIN vehicles v ON v.id = wo.vehicle_id
    WHERE wo.id = ?
  `,
    )
    .get(id) as Record<string, unknown> | undefined
  return row ? rowToJob(row) : null
}

export function getWorkOrderByInvoice(invoiceNumber: string): RepairJob | null {
  const db = getDb()
  const normalized = invoiceNumber.trim()
  const hcpId = normalized.startsWith('HCP-') ? normalized : `HCP-${normalized}`
  const row = db
    .prepare(
      `
    SELECT wo.*,
           c.first_name, c.last_name, c.company,
           v.make as veh_make, v.model as veh_model, v.year as veh_year
    FROM work_orders wo
    LEFT JOIN customers c ON c.id = wo.customer_id
    LEFT JOIN vehicles v ON v.id = wo.vehicle_id
    WHERE wo.invoice_number = ? OR wo.id = ? OR wo.hcp_job_id = ?
    LIMIT 1
  `,
    )
    .get(normalized, hcpId, normalized) as Record<string, unknown> | undefined
  return row ? rowToJob(row) : null
}

export function createWorkOrder(input: WorkOrderInput): RepairJob {
  const db = getDb()
  const ts = nowIso()
  const status = input.status ?? 'received'
  const totalCents = Math.round((input.estimatedRevenue ?? 0) * 100)
  const paidCents = Math.round((input.paidAmount ?? 0) * 100)
  const gate = evaluateDepositGate({
    description: input.issueDescription,
    totalAmount: input.estimatedRevenue ?? 0,
    paidAmount: input.paidAmount ?? 0,
    status,
  })

  if (gate.blocked && !input.force) {
    throw new Error(gate.message ?? 'Deposit gate blocked this action')
  }

  const id = newId('wo')
  db.prepare(
    `INSERT INTO work_orders (
      id, description, work_status, internal_status, total_cents, outstanding_cents, subtotal_cents,
      assigned_tech, tags, notes, created_at, updated_at, completed_at, source,
      priority, paid_cents, customer_name, make, model, year, serial_vin
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    id,
    input.issueDescription,
    status,
    status,
    totalCents,
    Math.max(0, totalCents - paidCents),
    totalCents,
    input.assignedTech ?? null,
    toJson([]),
    toJson([]),
    ts,
    ts,
    status === 'picked-up' ? ts : null,
    'manual',
    input.priority ?? 'normal',
    paidCents,
    input.customerName,
    input.make,
    input.model,
    input.year ?? null,
    input.serialVin ?? null,
  )

  return getWorkOrder(id)!
}

export function updateWorkOrder(id: string, patch: Partial<WorkOrderInput>): RepairJob {
  const existing = getWorkOrder(id)
  if (!existing) throw new Error(`Work order ${id} not found`)

  const next = {
    customerName: patch.customerName ?? existing.customerName,
    make: patch.make ?? existing.make,
    model: patch.model ?? existing.model,
    year: patch.year ?? existing.year,
    serialVin: patch.serialVin ?? existing.serialVin,
    issueDescription: patch.issueDescription ?? existing.issueDescription,
    priority: patch.priority ?? existing.priority,
    assignedTech: patch.assignedTech ?? existing.assignedTech,
    status: patch.status ?? existing.status,
    estimatedRevenue: patch.estimatedRevenue ?? existing.estimatedRevenue ?? 0,
    paidAmount: patch.paidAmount ?? existing.paidAmount ?? 0,
    force: patch.force,
  }

  const gate = evaluateDepositGate({
    description: next.issueDescription,
    totalAmount: next.estimatedRevenue,
    paidAmount: next.paidAmount,
    status: next.status,
  })

  if (gate.blocked && !next.force) {
    throw new Error(gate.message ?? 'Deposit gate blocked this status change')
  }

  const db = getDb()
  const ts = nowIso()
  const totalCents = Math.round(next.estimatedRevenue * 100)
  const paidCents = Math.round(next.paidAmount * 100)

  db.prepare(
    `UPDATE work_orders SET
      description=?, internal_status=?, work_status=?, total_cents=?, outstanding_cents=?, subtotal_cents=?,
      assigned_tech=?, updated_at=?, completed_at=?, priority=?, paid_cents=?,
      customer_name=?, make=?, model=?, year=?, serial_vin=?
     WHERE id=?`,
  ).run(
    next.issueDescription,
    next.status,
    next.status,
    totalCents,
    Math.max(0, totalCents - paidCents),
    totalCents,
    next.assignedTech ?? null,
    ts,
    next.status === 'picked-up' ? existing.completedAt ?? ts : null,
    next.priority,
    paidCents,
    next.customerName,
    next.make,
    next.model,
    next.year ?? null,
    next.serialVin ?? null,
    id,
  )

  return getWorkOrder(id)!
}
