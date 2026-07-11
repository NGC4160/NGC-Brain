-- QC form submissions linked to work orders

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
