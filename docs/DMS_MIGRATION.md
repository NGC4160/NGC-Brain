# NGC DMS Migration Guide

Neighborhood Golf Carts is moving from Housecall Pro (operations) to a standalone Dealer Management System (DMS) while keeping **QuickBooks Online** as the accounting system of record. **Griffin & Furman, LLC** handles bookkeeping in QBO (cash basis).

## What the DMS imports from Housecall Pro

Place HCP exports in `data/imports/hcp/` and run:

```bash
npm run import:hcp
```

Or use **Settings → Run Import** in the dashboard when the API server is running.

| File | Contents |
|------|----------|
| `jobs.json` | Work orders, customers, addresses, amounts (cents) |
| `company.json` | Shop profile |
| `pricebook_services.json` | Services from HCP API sync |
| `pricebook_material_categories.json` | Material category metadata |
| `NeighborhoodGolfCarts_pricebook_export.csv` | Full pricebook (282+ items) |
| `api_sync_manifest.json` | Last API sync timestamps |

The importer also falls back to `public/data/hcp-cache.json` if no export directory is found.

## Data flow

```
Housecall Pro exports  →  SQLite (data/ngc.db)  →  Dashboard / Jobs / KPIs
                              ↓
                    QuickBooks Online (Griffin & Furman, LLC)
                    Customers · Items · Invoices · Payments
```

## QuickBooks Online setup

1. Create an app at [Intuit Developer](https://developer.intuit.com/)
2. Add credentials to `.env` (see `.env.example`)
3. Open **Settings → Connect QuickBooks** in the dashboard
4. Complete OAuth; tokens are stored in `qbo_connection` table

### Income account routing (QBO)

| Job type | QBO income account |
|----------|-------------------|
| Lithium / LFP conversions | LFP Conversions Only |
| General repair & service | Sales and Services |
| Shop labor | Services Income |
| Parts | Sales of Product Income |
| Shop supply fee | Shop Supply Fee |

## Local development

```bash
npm install
npm run import:hcp      # one-time or after new HCP exports
npm run dev:all         # Vite :5173 + API :3001
```

## Phase roadmap

- **Phase 1 (current):** HCP import, SQLite DMS, read-only dashboard, QBO OAuth scaffold
- **Phase 2:** QBO customer/item/invoice sync, deposit gate alerts
- **Phase 3:** Writable work orders, scheduling, Stripe payments, inventory
