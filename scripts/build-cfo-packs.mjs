/**
 * Build CFO data packs → public/data/cfo/*.json + manifest.json
 *
 * Scans (in order):
 *   external_docs/exports/qbo/
 *   external_docs/exports/cfo/
 *   data/cfo-packs/
 *
 * Drop a new .xlsx or .csv into any of those folders and re-run
 * `npm run build:cfo-packs` (also runs as part of build:pages).
 * The KPI hub loads the manifest and surfaces every metric automatically.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import XLSX from 'xlsx'

const ROOT = process.cwd()
const OUT_DIR = join(ROOT, 'public/data/cfo')
const SCAN_DIRS = [
  join(ROOT, 'external_docs/exports/qbo'),
  join(ROOT, 'external_docs/exports/cfo'),
  join(ROOT, 'data/cfo-packs'),
]

const EXEC_ROLES = ['owner', 'service-manager', 'front-desk']

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function num(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v.replace(/[$,]/g, '').trim())
    return Number.isFinite(n) ? n : null
  }
  return null
}

function readSheetRows(filePath) {
  const buf = readFileSync(filePath)
  const wb = XLSX.read(buf, { type: 'buffer' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })
}

function labelAmountPairs(rows) {
  const pairs = []
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 2) continue
    const label = row[0] == null ? '' : String(row[0]).trim()
    if (!label) continue
    // Prefer last numeric cell (QBO lists often put Total in last col)
    let value = null
    for (let i = row.length - 1; i >= 1; i--) {
      const n = num(row[i])
      if (n != null) {
        value = n
        break
      }
    }
    if (value == null) continue
    pairs.push({ label, value })
  }
  return pairs
}

function findAmount(pairs, patterns) {
  for (const p of patterns) {
    const hit = pairs.find(({ label }) => p.test(label))
    if (hit) return hit
  }
  return null
}

function metric({
  id,
  name,
  value,
  format = 'currency',
  direction = 'higher-better',
  defaultTarget,
  shortDescription,
  description,
  formula,
  historicalContext,
  unit,
}) {
  const target =
    defaultTarget ??
    (format === 'currency'
      ? Math.round(Math.abs(value) * (direction === 'higher-better' ? 1.1 : 0.9))
      : format === 'percent'
        ? 100
        : Math.max(1, Math.round(Math.abs(value) * 1.1)))
  return {
    id,
    name,
    value: Math.round(value * 100) / 100,
    format,
    unit: unit ?? (format === 'currency' ? '$' : format === 'percent' ? '%' : 'count'),
    direction,
    defaultTarget: target,
    defaultThresholds: { greenAt: 100, yellowAt: 80 },
    shortDescription,
    description,
    formula,
    historicalContext,
    category: 'cfo',
    accessRoles: EXEC_ROLES,
    source: 'cfo-pack',
  }
}

function detectKind(filename, rows) {
  const f = filename.toLowerCase()
  const title = String(rows[1]?.[0] ?? rows[0]?.[0] ?? '')
  if (f.includes('profit') || /profit and loss/i.test(title)) return 'profit_and_loss'
  if (f.includes('balance') || /balance sheet/i.test(title)) return 'balance_sheet'
  if (f.includes('chart_of_account') || /account list/i.test(title)) return 'chart_of_accounts'
  if (f.includes('product') || /product\/service/i.test(title)) return 'products_and_services'
  return 'generic'
}

function extractProfitAndLoss(pairs, periodLabel) {
  const income = findAmount(pairs, [/^Total for Income$/i, /^Total Income$/i])
  const cogs = findAmount(pairs, [/^Total for Cost of Goods Sold$/i, /^Total COGS$/i])
  const gross = findAmount(pairs, [/^Gross Profit$/i])
  const expenses = findAmount(pairs, [/^Total for Expenses$/i, /^Total Expenses$/i])
  const noi = findAmount(pairs, [/^Net Operating Income$/i])
  const net = findAmount(pairs, [/^Net Income$/i])
  const lfp = findAmount(pairs, [/LFP Conversions/i, /Lithium/i])
  const payroll = findAmount(pairs, [/^Total for Payroll Expenses$/i, /^Payroll Expenses$/i])
  const marketing = findAmount(pairs, [
    /^Total for Advertising/i,
    /^Advertising & Marketing$/i,
  ])
  const fuel = findAmount(pairs, [/^Fuel$/i])

  const metrics = []
  const ctx = periodLabel || 'trailing twelve months from QBO P&L pack'

  if (income)
    metrics.push(
      metric({
        id: 'cfo-pnl-total-income',
        name: 'Total Income (QBO)',
        value: income.value,
        shortDescription: 'P&L total income from CFO pack',
        description: `Total income for ${ctx}.`,
        formula: 'QBO Profit & Loss → Total for Income',
        historicalContext: 'Cash-basis QBO export — Griffin & Furman SoR.',
        defaultTarget: 600000,
      }),
    )
  if (gross)
    metrics.push(
      metric({
        id: 'cfo-pnl-gross-profit',
        name: 'Gross Profit (QBO)',
        value: gross.value,
        shortDescription: 'Income minus COGS',
        description: `Gross profit for ${ctx}.`,
        formula: 'QBO P&L → Gross Profit',
        historicalContext: 'Watch COGS / job supplies when lithium volume rises.',
        defaultTarget: 400000,
      }),
    )
  if (income && cogs) {
    const margin = income.value !== 0 ? (gross?.value ?? income.value - cogs.value) / income.value * 100 : 0
    metrics.push(
      metric({
        id: 'cfo-pnl-gross-margin',
        name: 'Gross Margin %',
        value: margin,
        format: 'percent',
        shortDescription: 'Gross profit ÷ income',
        description: 'Gross margin percentage from the P&L pack.',
        formula: 'Gross Profit / Total Income × 100',
        historicalContext: 'Target healthy service margins after parts.',
        defaultTarget: 65,
        unit: '%',
      }),
    )
  }
  if (noi)
    metrics.push(
      metric({
        id: 'cfo-pnl-noi',
        name: 'Net Operating Income',
        value: noi.value,
        shortDescription: 'Operating profit after expenses',
        description: `Net operating income for ${ctx}.`,
        formula: 'QBO P&L → Net Operating Income',
        historicalContext: 'Primary operating profitability signal for Ryan/Christine.',
        defaultTarget: 50000,
      }),
    )
  if (net)
    metrics.push(
      metric({
        id: 'cfo-pnl-net-income',
        name: 'Net Income (QBO)',
        value: net.value,
        shortDescription: 'Bottom-line net income',
        description: `Net income for ${ctx}.`,
        formula: 'QBO P&L → Net Income',
        historicalContext: 'Includes other income/expense; cash basis.',
        defaultTarget: 50000,
      }),
    )
  if (lfp)
    metrics.push(
      metric({
        id: 'cfo-pnl-lfp-revenue',
        name: 'LFP / Lithium Revenue',
        value: lfp.value,
        shortDescription: 'Lithium conversion income line',
        description: 'LFP Conversions Only from P&L.',
        formula: 'QBO P&L → LFP Conversions Only',
        historicalContext: 'Pairs with $1,800 lithium deposit gates.',
        defaultTarget: 100000,
      }),
    )
  if (payroll)
    metrics.push(
      metric({
        id: 'cfo-pnl-payroll',
        name: 'Payroll Expenses',
        value: payroll.value,
        direction: 'lower-better',
        shortDescription: 'Total payroll from P&L',
        description: 'Total payroll expenses including wages and taxes.',
        formula: 'QBO P&L → Total for Payroll Expenses',
        historicalContext: 'Largest expense block — track vs revenue.',
        defaultTarget: 150000,
      }),
    )
  if (marketing)
    metrics.push(
      metric({
        id: 'cfo-pnl-marketing',
        name: 'Advertising & Marketing',
        value: marketing.value,
        direction: 'lower-better',
        shortDescription: 'Marketing spend from P&L',
        description: 'Advertising & marketing total.',
        formula: 'QBO P&L → Advertising & Marketing',
        historicalContext: 'Compare to new-job intake volume on the ops side.',
        defaultTarget: 50000,
      }),
    )
  if (fuel)
    metrics.push(
      metric({
        id: 'cfo-pnl-fuel',
        name: 'Fuel Expense',
        value: fuel.value,
        direction: 'lower-better',
        shortDescription: 'Vehicle fuel from P&L',
        description: 'Fuel line under automobile expense.',
        formula: 'QBO P&L → Fuel',
        historicalContext: 'Driver / mobile trip cost signal.',
        defaultTarget: 10000,
      }),
    )
  if (expenses)
    metrics.push(
      metric({
        id: 'cfo-pnl-expenses',
        name: 'Total Operating Expenses',
        value: expenses.value,
        direction: 'lower-better',
        shortDescription: 'Total expenses from P&L',
        description: `Total for Expenses for ${ctx}.`,
        formula: 'QBO P&L → Total for Expenses',
        historicalContext: 'OpEx control for executive review.',
        defaultTarget: 350000,
      }),
    )

  return metrics
}

function extractBalanceSheet(pairs, asOf) {
  const bank = findAmount(pairs, [/^Total for Bank Accounts$/i])
  const ar = findAmount(pairs, [/^Total for Accounts Receivable$/i, /^Accounts Receivable \(A\/R\)$/i])
  const inventory = findAmount(pairs, [/^Inventory Asset$/i])
  const currentAssets = findAmount(pairs, [/^Total for Current Assets$/i])
  const assets = findAmount(pairs, [/^Total for Assets$/i])
  const liabilities = findAmount(pairs, [/^Total for Liabilities$/i])
  const equity = findAmount(pairs, [/^Total for Equity$/i])
  const stripeLoan = findAmount(pairs, [/Stripe Capital/i])
  const undeposited = findAmount(pairs, [/^Undeposited Funds$/i])
  const netIncomeBs = findAmount(pairs, [/^Net Income$/i])

  const metrics = []
  const ctx = asOf ? `as of ${asOf}` : 'from QBO Balance Sheet pack'

  if (bank)
    metrics.push(
      metric({
        id: 'cfo-bs-cash',
        name: 'Bank / Cash Total',
        value: bank.value,
        shortDescription: 'Sum of bank accounts',
        description: `Total bank accounts ${ctx}.`,
        formula: 'QBO Balance Sheet → Total for Bank Accounts',
        historicalContext: 'Liquidity for payroll, parts, and deposits.',
        defaultTarget: 15000,
      }),
    )
  if (ar)
    metrics.push(
      metric({
        id: 'cfo-bs-ar',
        name: 'Accounts Receivable (QBO)',
        value: Math.abs(ar.value),
        direction: 'lower-better',
        shortDescription: 'QBO A/R balance',
        description: `Accounts receivable ${ctx}.`,
        formula: 'QBO Balance Sheet → Accounts Receivable',
        historicalContext: 'May differ from HCP AR cache — QBO is books SoR.',
        defaultTarget: 5000,
      }),
    )
  if (inventory)
    metrics.push(
      metric({
        id: 'cfo-bs-inventory',
        name: 'Inventory Asset',
        value: inventory.value,
        shortDescription: 'Inventory on the books',
        description: `Inventory asset ${ctx}.`,
        formula: 'QBO Balance Sheet → Inventory Asset',
        historicalContext: 'Bridge to future inventory module.',
        defaultTarget: 20000,
      }),
    )
  if (currentAssets)
    metrics.push(
      metric({
        id: 'cfo-bs-current-assets',
        name: 'Current Assets',
        value: currentAssets.value,
        shortDescription: 'Total current assets',
        description: `Current assets ${ctx}.`,
        formula: 'QBO Balance Sheet → Total for Current Assets',
        historicalContext: 'Short-term financial strength.',
        defaultTarget: 40000,
      }),
    )
  if (liabilities)
    metrics.push(
      metric({
        id: 'cfo-bs-liabilities',
        name: 'Total Liabilities',
        value: Math.abs(liabilities.value),
        direction: 'lower-better',
        shortDescription: 'All liabilities',
        description: `Total liabilities ${ctx}.`,
        formula: 'QBO Balance Sheet → Total for Liabilities',
        historicalContext: 'Includes tax payables and financing.',
        defaultTarget: 20000,
      }),
    )
  if (equity)
    metrics.push(
      metric({
        id: 'cfo-bs-equity',
        name: "Owner's Equity Total",
        value: equity.value,
        shortDescription: 'Total equity',
        description: `Total equity ${ctx}.`,
        formula: 'QBO Balance Sheet → Total for Equity',
        historicalContext: 'Includes draws, equity, retained earnings, net income.',
        defaultTarget: 20000,
      }),
    )
  if (assets && liabilities) {
    const ratio = Math.abs(liabilities.value) === 0 ? 99 : assets.value / Math.abs(liabilities.value)
    metrics.push(
      metric({
        id: 'cfo-bs-asset-liability-ratio',
        name: 'Assets / Liabilities',
        value: Math.round(ratio * 100) / 100,
        format: 'decimal',
        unit: 'x',
        shortDescription: 'Coverage of liabilities by assets',
        description: 'Total assets divided by total liabilities.',
        formula: 'Total Assets / Total Liabilities',
        historicalContext: '>1 means assets cover liabilities.',
        defaultTarget: 1.5,
      }),
    )
  }
  if (stripeLoan)
    metrics.push(
      metric({
        id: 'cfo-bs-stripe-loan',
        name: 'Stripe Capital Balance',
        value: Math.abs(stripeLoan.value),
        direction: 'lower-better',
        shortDescription: 'Outstanding Stripe Capital loan',
        description: 'Stripe Capital (via Housecall Pro) loan balance.',
        formula: 'QBO Balance Sheet → Stripe Capital loan line',
        historicalContext: 'Financing drag — pay down as cash allows.',
        defaultTarget: 10000,
      }),
    )
  if (undeposited)
    metrics.push(
      metric({
        id: 'cfo-bs-undeposited',
        name: 'Undeposited Funds',
        value: undeposited.value,
        direction: 'lower-better',
        shortDescription: 'Cash waiting to hit the bank',
        description: 'Undeposited funds balance.',
        formula: 'QBO Balance Sheet → Undeposited Funds',
        historicalContext: 'Clear deposits promptly for accurate cash.',
        defaultTarget: 2000,
      }),
    )
  if (netIncomeBs)
    metrics.push(
      metric({
        id: 'cfo-bs-ytd-net-income',
        name: 'BS Net Income (YTD)',
        value: netIncomeBs.value,
        shortDescription: 'Net income on the balance sheet',
        description: `Net income line on equity section ${ctx}.`,
        formula: 'QBO Balance Sheet → Net Income (equity)',
        historicalContext: 'May differ from TTM P&L depending on period cut.',
        defaultTarget: 40000,
      }),
    )

  return metrics
}

function extractChartOfAccounts(rows) {
  // Header row with Full name, Type, Detail type, Description, Total balance
  let headerIdx = rows.findIndex(
    (r) => Array.isArray(r) && String(r[0] ?? '').toLowerCase().includes('full name'),
  )
  if (headerIdx < 0) headerIdx = 3
  const accounts = []
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i]
    if (!Array.isArray(r) || !r[0]) continue
    const balance = num(r[4] ?? r[r.length - 1])
    accounts.push({
      name: String(r[0]),
      type: String(r[1] ?? ''),
      balance: balance ?? 0,
    })
  }

  const byType = new Map()
  for (const a of accounts) {
    const t = a.type || 'Other'
    byType.set(t, (byType.get(t) ?? 0) + 1)
  }

  const bankBal = accounts
    .filter((a) => /bank/i.test(a.type))
    .reduce((s, a) => s + a.balance, 0)
  const arBal = accounts
    .filter((a) => /receivable/i.test(a.type))
    .reduce((s, a) => s + a.balance, 0)
  const apBal = accounts
    .filter((a) => /payable/i.test(a.type))
    .reduce((s, a) => s + Math.abs(a.balance), 0)

  return [
    metric({
      id: 'cfo-coa-account-count',
      name: 'Chart of Accounts Size',
      value: accounts.length,
      format: 'number',
      unit: 'accounts',
      shortDescription: 'Active QBO accounts in pack',
      description: 'Count of accounts on the Account List export.',
      formula: 'COUNT(chart_of_accounts rows)',
      historicalContext: 'Structural complexity of the books.',
      defaultTarget: accounts.length,
    }),
    metric({
      id: 'cfo-coa-bank-balance',
      name: 'COA Bank Balances',
      value: bankBal,
      shortDescription: 'Sum of Bank-type account balances',
      description: 'Sum of balances where Type = Bank.',
      formula: 'SUM(balance WHERE type=Bank)',
      historicalContext: 'Cross-check vs Balance Sheet bank total.',
      defaultTarget: 15000,
    }),
    metric({
      id: 'cfo-coa-ar-balance',
      name: 'COA A/R Balance',
      value: arBal,
      direction: 'lower-better',
      shortDescription: 'A/R accounts total from COA',
      description: 'Sum of Accounts receivable type balances.',
      formula: 'SUM(balance WHERE type includes receivable)',
      historicalContext: 'COA export may show open A/R even when BS snapshot differs.',
      defaultTarget: 5000,
    }),
    metric({
      id: 'cfo-coa-ap-balance',
      name: 'COA A/P Balance',
      value: apBal,
      direction: 'lower-better',
      shortDescription: 'Accounts payable from COA',
      description: 'Absolute sum of payable-type balances.',
      formula: 'SUM(|balance| WHERE type includes payable)',
      historicalContext: 'Vendor obligations.',
      defaultTarget: 5000,
    }),
    metric({
      id: 'cfo-coa-type-count',
      name: 'Account Types in Use',
      value: byType.size,
      format: 'number',
      unit: 'types',
      shortDescription: 'Distinct account types',
      description: 'Number of distinct QBO account types present.',
      formula: 'COUNT(DISTINCT type)',
      historicalContext: 'Useful when reviewing chart hygiene with the bookkeeper.',
      defaultTarget: byType.size,
    }),
  ]
}

function extractProducts(rows) {
  let headerIdx = rows.findIndex(
    (r) =>
      Array.isArray(r) &&
      /product\/service|product|service/i.test(String(r[0] ?? '')),
  )
  if (headerIdx < 0) headerIdx = 3
  const items = []
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i]
    if (!Array.isArray(r) || !r[0]) continue
    items.push({
      name: String(r[0]),
      type: String(r[1] ?? ''),
      sales: num(r[3]) ?? 0,
      purchase: num(r[4]) ?? 0,
    })
  }
  const services = items.filter((i) => /service/i.test(i.type))
  const nonInv = items.filter((i) => /non-inventory|inventory|product/i.test(i.type))
  const lithium = items.filter((i) => /lithium|lfp/i.test(i.name))
  const priced = items.filter((i) => i.sales > 0)
  const avgPrice = priced.length
    ? priced.reduce((s, i) => s + i.sales, 0) / priced.length
    : 0

  return [
    metric({
      id: 'cfo-ps-item-count',
      name: 'Pricebook Items (QBO)',
      value: items.length,
      format: 'number',
      unit: 'items',
      shortDescription: 'Products & services on file',
      description: 'Rows in the Product/Service List pack.',
      formula: 'COUNT(products_and_services)',
      historicalContext: 'Catalog breadth for estimating and invoicing.',
      defaultTarget: items.length,
    }),
    metric({
      id: 'cfo-ps-service-count',
      name: 'Service SKUs',
      value: services.length,
      format: 'number',
      unit: 'services',
      shortDescription: 'Service-type items',
      description: 'Count of Type = Service.',
      formula: "COUNT WHERE type='Service'",
      historicalContext: 'Labor/service catalog size.',
      defaultTarget: services.length,
    }),
    metric({
      id: 'cfo-ps-avg-sales-price',
      name: 'Avg Sales Price',
      value: avgPrice,
      shortDescription: 'Mean sales price across priced items',
      description: 'Average of sales price where > 0.',
      formula: 'AVG(sales price WHERE > 0)',
      historicalContext: 'Rough mix signal — lithium skews high.',
      defaultTarget: Math.round(avgPrice * 1.05) || 200,
    }),
    metric({
      id: 'cfo-ps-lithium-skus',
      name: 'Lithium-Related SKUs',
      value: lithium.length,
      format: 'number',
      unit: 'items',
      shortDescription: 'Items mentioning lithium/LFP',
      description: 'Product/service names containing lithium or LFP.',
      formula: 'COUNT WHERE name ~ lithium|lfp',
      historicalContext: 'Supports lithium conversion program tracking.',
      defaultTarget: Math.max(lithium.length, 5),
    }),
    metric({
      id: 'cfo-ps-noninventory',
      name: 'Product / Non-Inventory SKUs',
      value: nonInv.length,
      format: 'number',
      unit: 'items',
      shortDescription: 'Non-service catalog items',
      description: 'Non-inventory / product type rows.',
      formula: 'COUNT non-service types',
      historicalContext: 'Parts & product catalog depth.',
      defaultTarget: nonInv.length,
    }),
  ]
}

function extractGeneric(pairs, packId) {
  // Prefer totals / nets; otherwise top absolute amounts
  const preferred = pairs.filter(({ label }) =>
    /^(total|net|gross)/i.test(label),
  )
  const pool = preferred.length >= 3 ? preferred : [...pairs].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
  return pool.slice(0, 12).map((p, idx) =>
    metric({
      id: `cfo-${packId}-${idx}-${slugify(p.label).slice(0, 40)}`,
      name: p.label.slice(0, 80),
      value: p.value,
      direction: /expense|liabilit|cost|draw|payable|loan/i.test(p.label)
        ? 'lower-better'
        : 'higher-better',
      shortDescription: `From uploaded CFO pack ${packId}`,
      description: `Auto-extracted metric “${p.label}” from a newly uploaded data pack.`,
      formula: `CFO pack ${packId} → ${p.label}`,
      historicalContext: 'Auto-mapped — refine targets in the KPI detail modal.',
    }),
  )
}

function buildPack(filePath) {
  const file = basename(filePath)
  const id = slugify(file)
  const rows = readSheetRows(filePath)
  const kind = detectKind(file, rows)
  const pairs = labelAmountPairs(rows)
  const periodLabel = String(rows[2]?.[0] ?? rows[1]?.[0] ?? '')
  const title = String(rows[1]?.[0] ?? rows[0]?.[0] ?? file)

  let metrics = []
  if (kind === 'profit_and_loss') metrics = extractProfitAndLoss(pairs, periodLabel)
  else if (kind === 'balance_sheet') metrics = extractBalanceSheet(pairs, periodLabel)
  else if (kind === 'chart_of_accounts') metrics = extractChartOfAccounts(rows)
  else if (kind === 'products_and_services') metrics = extractProducts(rows)
  else metrics = extractGeneric(pairs, id)

  // Deduplicate metric ids within pack
  const seen = new Set()
  metrics = metrics.filter((m) => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })

  return {
    id,
    title,
    kind,
    periodLabel,
    sourceFile: file,
    sourcePath: filePath.replace(ROOT + '/', ''),
    asOf: periodLabel,
    generatedAt: new Date().toISOString(),
    metricCount: metrics.length,
    metrics,
  }
}

function collectFiles() {
  const files = []
  for (const dir of SCAN_DIRS) {
    if (!existsSync(dir)) continue
    for (const name of readdirSync(dir)) {
      const ext = extname(name).toLowerCase()
      if (!['.xlsx', '.xls', '.csv'].includes(ext)) continue
      files.push(join(dir, name))
    }
  }
  return files
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const files = collectFiles()
  if (files.length === 0) {
    console.warn('No CFO packs found in', SCAN_DIRS.join(', '))
    writeFileSync(
      join(OUT_DIR, 'manifest.json'),
      JSON.stringify({ generatedAt: new Date().toISOString(), packs: [] }, null, 2),
    )
    return
  }

  const packs = []
  for (const file of files) {
    try {
      const pack = buildPack(file)
      const outName = `${pack.id}.json`
      writeFileSync(join(OUT_DIR, outName), JSON.stringify(pack, null, 2))
      packs.push({
        id: pack.id,
        title: pack.title,
        kind: pack.kind,
        periodLabel: pack.periodLabel,
        sourceFile: pack.sourceFile,
        file: outName,
        asOf: pack.asOf,
        metricCount: pack.metricCount,
        generatedAt: pack.generatedAt,
      })
      console.log(`Built ${outName} (${pack.kind}) — ${pack.metricCount} metrics`)
    } catch (err) {
      console.error(`Failed ${file}:`, err)
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    packCount: packs.length,
    metricCount: packs.reduce((s, p) => s + p.metricCount, 0),
    scanDirs: SCAN_DIRS.map((d) => d.replace(ROOT + '/', '')),
    packs,
  }
  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(
    `CFO manifest: ${packs.length} packs, ${manifest.metricCount} metrics → public/data/cfo/`,
  )
}

main()
