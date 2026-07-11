/** Raw shapes from Housecall Pro exports */

export interface HCPAddress {
  id?: string
  type?: string
  street?: string
  street_line_2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}

export interface HCPCustomerExport {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  mobile_number?: string
  home_number?: string | null
  work_number?: string | null
  company?: string | null
  kind?: string
  lead_source?: string
  notes?: string | null
  tags?: string[]
  created_at?: string
  updated_at?: string
}

export interface HCPJobExport {
  id: string
  invoice_number?: string
  description?: string
  work_status?: string
  total_amount?: number
  outstanding_balance?: number
  subtotal?: number
  customer?: HCPCustomerExport
  address?: HCPAddress
  notes?: Array<{ id?: string; content?: string }>
  assigned_employees?: Array<{ first_name?: string; last_name?: string }>
  tags?: string[]
  work_timestamps?: {
    on_my_way_at?: string | null
    started_at?: string | null
    completed_at?: string | null
  }
  schedule?: unknown
  lead_source?: string | null
  created_at?: string
  updated_at?: string
  canceled_at?: string | null
  deleted_at?: string | null
}

export interface HCPJobsFile {
  synced_at?: string
  count?: number
  jobs: HCPJobExport[]
}

export interface HCPPricebookService {
  uuid?: string
  name?: string
  description?: string
  price?: number
  cost?: number
  taxable?: boolean
  [key: string]: unknown
}

export interface HCPPricebookServicesFile {
  synced_at?: string
  count?: number
  services: HCPPricebookService[]
}

export interface HCPCompanyFile {
  id?: string
  name?: string
  phone_number?: string
  support_email?: string
  website?: string
  logo_url?: string
  address?: HCPAddress
  time_zone?: string
}

export type HCPImportFileType =
  | 'jobs'
  | 'company'
  | 'pricebook_csv'
  | 'pricebook_services'
  | 'pricebook_material_categories'
  | 'full_directory'

export interface HCPImportStats {
  customersCreated: number
  customersUpdated: number
  vehiclesCreated: number
  workOrdersCreated: number
  workOrdersUpdated: number
  pricebookCreated: number
  pricebookUpdated: number
  skipped: number
  errors: string[]
}

export const HCP_EXPORT_FILES = {
  jobs: 'jobs.json',
  company: 'company.json',
  companyTest: 'company_test.json',
  pricebookServices: 'pricebook_services.json',
  pricebookMaterialCategories: 'pricebook_material_categories.json',
  apiSyncManifest: 'api_sync_manifest.json',
  pricebookCsv: 'NeighborhoodGolfCarts_pricebook_export.csv',
} as const

export const HCP_EXPORT_DIRS = {
  api: 'external_docs/exports/hcp',
  pricebook: 'external_docs/exports/pricebook',
} as const
