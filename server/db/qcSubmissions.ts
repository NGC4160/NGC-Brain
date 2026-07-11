import { getDb } from './client.js'
import { newId, nowIso } from './utils.js'

export interface QcSubmissionRecord {
  id: string
  workOrderId: string | null
  jobNumber: string
  customerLastName: string
  fileName: string
  filePath: string
  mediaCount: number
  certified: boolean
  technician: string | null
  savedAt: string
  formJson: string
}

export function ensureQcTable() {
  const db = getDb()
  db.exec(`
    CREATE TABLE IF NOT EXISTS qc_submissions (
      id TEXT PRIMARY KEY,
      work_order_id TEXT REFERENCES work_orders(id),
      job_number TEXT NOT NULL,
      customer_last_name TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      media_count INTEGER NOT NULL DEFAULT 0,
      certified INTEGER NOT NULL DEFAULT 0,
      technician TEXT,
      saved_at TEXT NOT NULL,
      form_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_qc_submissions_job ON qc_submissions(job_number);
    CREATE INDEX IF NOT EXISTS idx_qc_submissions_work_order ON qc_submissions(work_order_id);
  `)
}

export function insertQcSubmission(input: Omit<QcSubmissionRecord, 'id' | 'savedAt'>): QcSubmissionRecord {
  ensureQcTable()
  const db = getDb()
  const id = newId('qc')
  const savedAt = nowIso()
  db.prepare(
    `INSERT INTO qc_submissions (
      id, work_order_id, job_number, customer_last_name, file_name, file_path,
      media_count, certified, technician, saved_at, form_json
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    id,
    input.workOrderId,
    input.jobNumber,
    input.customerLastName,
    input.fileName,
    input.filePath,
    input.mediaCount,
    input.certified ? 1 : 0,
    input.technician,
    savedAt,
    input.formJson,
  )
  return { ...input, id, savedAt }
}

export function listQcSubmissions(limit = 50): QcSubmissionRecord[] {
  ensureQcTable()
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT id, work_order_id, job_number, customer_last_name, file_name, file_path,
              media_count, certified, technician, saved_at, form_json
       FROM qc_submissions ORDER BY saved_at DESC LIMIT ?`,
    )
    .all(limit) as Array<Record<string, unknown>>

  return rows.map((r) => ({
    id: String(r.id),
    workOrderId: r.work_order_id ? String(r.work_order_id) : null,
    jobNumber: String(r.job_number),
    customerLastName: String(r.customer_last_name),
    fileName: String(r.file_name),
    filePath: String(r.file_path),
    mediaCount: Number(r.media_count),
    certified: Boolean(r.certified),
    technician: r.technician ? String(r.technician) : null,
    savedAt: String(r.saved_at),
    formJson: String(r.form_json),
  }))
}

export function getLatestQcForJob(jobNumber: string): QcSubmissionRecord | null {
  ensureQcTable()
  const db = getDb()
  const row = db
    .prepare(
      `SELECT id, work_order_id, job_number, customer_last_name, file_name, file_path,
              media_count, certified, technician, saved_at, form_json
       FROM qc_submissions WHERE job_number = ? ORDER BY saved_at DESC LIMIT 1`,
    )
    .get(jobNumber) as Record<string, unknown> | undefined
  if (!row) return null
  return {
    id: String(row.id),
    workOrderId: row.work_order_id ? String(row.work_order_id) : null,
    jobNumber: String(row.job_number),
    customerLastName: String(row.customer_last_name),
    fileName: String(row.file_name),
    filePath: String(row.file_path),
    mediaCount: Number(row.media_count),
    certified: Boolean(row.certified),
    technician: row.technician ? String(row.technician) : null,
    savedAt: String(row.saved_at),
    formJson: String(row.form_json),
  }
}
