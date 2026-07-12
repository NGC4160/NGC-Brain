# KPI Reporting Hub

Central place for every KPI the DMS tracks, filtered by role — including **CFO / QuickBooks data packs**.

**Live:** https://ngc4160.github.io/NGC-Brain/#/kpi-hub

## Access

| Role | Visibility |
|------|------------|
| Ryan / Christine / Owner | Full executive library + all CFO pack KPIs |
| Technicians | Shop ops + personal WIP / completions / labor logs |
| Drivers | Ready queue, deliveries, fleet accounts, on-time placeholder |
| Office | Same full library as Christine |

## CFO data packs (auto-updating)

Source folders (scanned on every `build:cfo-packs` / `build:pages`):

1. `external_docs/exports/qbo/`
2. `external_docs/exports/cfo/`
3. `data/cfo-packs/`

**Currently on file (4 packs):**

| File | Kind | Example KPIs |
|------|------|--------------|
| `profit_and_loss_last_12_months.xlsx` | P&L | Total income, gross profit/margin, NOI, net income, LFP revenue, payroll, marketing, fuel |
| `balance_sheet_current.xlsx` | Balance sheet | Cash, A/R, inventory, liabilities, equity, Stripe loan, undeposited funds |
| `chart_of_accounts.xlsx` | COA | Account count, bank/AR/AP balances, type count |
| `products_and_services.xlsx` | Pricebook | Item count, service SKUs, avg sales price, lithium SKUs |

### Add a future pack

1. Drop a new `.xlsx` / `.xls` / `.csv` into any scan folder above  
2. Run `npm run build:cfo-packs` (or deploy via `build:pages`)  
3. Open **KPI Hub → CFO / QuickBooks Packs** — new metrics appear automatically  

Known layouts (P&L, Balance Sheet, Account List, Product/Service List) get typed KPIs. Unknown layouts use **generic auto-extraction** of total/net lines and top amounts.

Built JSON lands in `public/data/cfo/` (`manifest.json` + one file per pack).

## Architecture

| Path | Role |
|------|------|
| `scripts/build-cfo-packs.mjs` | Parse Excel/CSV → JSON metrics + manifest |
| `src/kpi/cfo/loadPacks.ts` | Fetch packs in the browser |
| `src/kpi/registry.ts` | Ops KPI metadata |
| `src/kpi/compute.ts` | Merge ops + CFO into role-scoped snapshots |
| `src/hooks/useKpiHub.ts` | Filters + pack refresh |
| `src/pages/KpiHubPage.tsx` | UI |

## Features

- Date range: Today / Week / MTD / QTD / YTD / Custom (ops KPIs)
- CFO KPIs from latest pack export (point-in-time)
- Search + category filter
- Status (green / yellow / red) vs target
- Trend vs prior comparable period
- Detail modal with chart + admin thresholds (Ryan / Christine)
- CSV export + print-to-PDF
