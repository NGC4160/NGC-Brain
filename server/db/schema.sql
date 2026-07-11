-- NGC Dealer Management System — SQLite schema
-- Source of truth for shop ops; QBO remains accounting system of record

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  hcp_customer_id TEXT UNIQUE,
  qbo_customer_id TEXT,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  email TEXT,
  mobile TEXT,
  home_phone TEXT,
  work_phone TEXT,
  kind TEXT,
  lead_source TEXT,
  notes TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  addresses TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual'
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  make TEXT,
  model TEXT,
  year INTEGER,
  serial_vin TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual'
);

CREATE TABLE IF NOT EXISTS pricebook_items (
  id TEXT PRIMARY KEY,
  hcp_uuid TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  industry TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  taxable INTEGER NOT NULL DEFAULT 1,
  unit_of_measure TEXT,
  task_code TEXT,
  online_booking_enabled INTEGER NOT NULL DEFAULT 0,
  materials TEXT NOT NULL DEFAULT '[]',
  labor_rates TEXT NOT NULL DEFAULT '[]',
  qbo_item_id TEXT,
  income_account TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual'
);

CREATE TABLE IF NOT EXISTS work_orders (
  id TEXT PRIMARY KEY,
  hcp_job_id TEXT UNIQUE,
  invoice_number TEXT,
  customer_id TEXT REFERENCES customers(id),
  vehicle_id TEXT REFERENCES vehicles(id),
  description TEXT,
  work_status TEXT,
  internal_status TEXT,
  total_cents INTEGER NOT NULL DEFAULT 0,
  outstanding_cents INTEGER NOT NULL DEFAULT 0,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  assigned_tech TEXT,
  lead_source TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '[]',
  schedule TEXT,
  work_timestamps TEXT,
  qbo_invoice_id TEXT,
  qbo_sync_status TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  canceled_at TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  priority TEXT NOT NULL DEFAULT 'normal',
  paid_cents INTEGER NOT NULL DEFAULT 0,
  customer_name TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  serial_vin TEXT
);

CREATE TABLE IF NOT EXISTS import_runs (
  id TEXT PRIMARY KEY,
  import_type TEXT NOT NULL,
  source_file TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  stats TEXT NOT NULL DEFAULT '{}',
  errors TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS qbo_connection (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  realm_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TEXT,
  company_name TEXT,
  connected_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_hcp ON customers(hcp_customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_hcp ON work_orders(hcp_job_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_invoice ON work_orders(invoice_number);
CREATE INDEX IF NOT EXISTS idx_work_orders_customer ON work_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_pricebook_category ON pricebook_items(category);
CREATE INDEX IF NOT EXISTS idx_pricebook_hcp ON pricebook_items(hcp_uuid);

INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES
  ('bookkeeper', 'Griffin & Furman, LLC', datetime('now')),
  ('accounting_basis', 'cash', datetime('now'));
