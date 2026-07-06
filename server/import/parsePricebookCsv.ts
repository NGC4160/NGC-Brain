export interface PricebookCsvRow {
  industry?: string
  industry_uuid?: string
  category?: string
  uuid?: string
  name?: string
  description?: string
  price?: string
  cost?: string
  taxable?: string
  unit_of_measure?: string
  task_code?: string
  online_booking_enabled?: string
  material_1?: string
  material_2?: string
  material_3?: string
  material_4?: string
  material_5?: string
  material_6?: string
  material_7?: string
  labor_rate_1?: string
  labor_rate_2?: string
}

/** Minimal RFC-4180-ish CSV parser for HCP pricebook export */
export function parseCsv(content: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const c = content[i]
    const next = content[i + 1]

    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"'
        i++
      } else if (c === '"') {
        inQuotes = false
      } else {
        field += c
      }
      continue
    }

    if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || (c === '\r' && next === '\n')) {
      row.push(field)
      field = ''
      if (row.some((cell) => cell.trim())) rows.push(row)
      row = []
      if (c === '\r') i++
    } else if (c !== '\r') {
      field += c
    }
  }

  if (field || row.length) {
    row.push(field)
    if (row.some((cell) => cell.trim())) rows.push(row)
  }

  if (rows.length === 0) return []

  const headers = rows[0].map((h) => h.trim())
  return rows.slice(1).map((cells) => {
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => {
      obj[h] = (cells[idx] ?? '').trim()
    })
    return obj
  })
}

export function parsePricebookCsv(content: string): PricebookCsvRow[] {
  return parseCsv(content) as PricebookCsvRow[]
}

function parseMoney(value?: string): number {
  if (!value) return 0
  const n = parseFloat(value.replace(/[$,]/g, ''))
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

export function csvRowToPricebookFields(row: PricebookCsvRow) {
  const materials = [
    row.material_1,
    row.material_2,
    row.material_3,
    row.material_4,
    row.material_5,
    row.material_6,
    row.material_7,
  ].filter(Boolean)

  const laborRates = [row.labor_rate_1, row.labor_rate_2].filter(Boolean)

  return {
    hcp_uuid: row.uuid || null,
    name: row.name || 'Unnamed item',
    description: row.description || null,
    category: row.category || null,
    industry: row.industry || null,
    price_cents: parseMoney(row.price),
    cost_cents: parseMoney(row.cost),
    taxable: row.taxable?.toLowerCase() === 'true' || row.taxable === '1' ? 1 : 0,
    unit_of_measure: row.unit_of_measure || null,
    task_code: row.task_code || null,
    online_booking_enabled:
      row.online_booking_enabled?.toLowerCase() === 'true' ? 1 : 0,
    materials,
    labor_rates: laborRates,
  }
}
