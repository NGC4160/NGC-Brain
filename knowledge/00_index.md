# Neighborhood Golf Carts — Knowledge Base Index

**Last verified:** 2026-07-12  
**Maintained for:** Cursor AI, NGC Admin Bot, staff reference, customer-facing assistance

## Purpose

Single source of truth for Neighborhood Golf Carts (NGC) business operations. Use these files before answering questions about services, pricing, policies, team, or systems.

## Document map

| File | Contents |
|------|----------|
| [01_company/profile.md](01_company/profile.md) | Identity, contact, location, positioning, legal |
| [02_products/lithium_conversions.md](02_products/lithium_conversions.md) | Professional lithium kits, warranty, deposits, turnaround |
| [03_services/shop_services.md](03_services/shop_services.md) | Diagnostics, fees, pickup/delivery, deposits |
| [03_services/pricebook_reference.md](03_services/pricebook_reference.md) | Pricebook categories and key line items |
| [04_operations/shop_workflow.md](04_operations/shop_workflow.md) | How work flows through the shop today |
| [04_operations/shop_throughput.md](04_operations/shop_throughput.md) | **WIP limits, daily rhythm, lithium SLA, shop board** |
| [04_operations/shop_whiteboard_layout.md](04_operations/shop_whiteboard_layout.md) | **Physical whiteboard — columns, cards, colors, daily use** |
| [05_team/roles.md](05_team/roles.md) | Team roster and responsibilities |
| [05_team/personnel_counseling.md](05_team/personnel_counseling.md) | **Personnel counseling form** — branded template & procedure |
| [06_systems/tools.md](06_systems/tools.md) | Housecall Pro, QuickBooks, future DMS |
| [07_customers_marketing/market.md](07_customers_marketing/market.md) | Service area, customer types, channels |
| [08_finance/overview.md](08_finance/overview.md) | Income categories, COA structure, sales tax, June 2026 highlight |
| [08_finance/datasets/](08_finance/datasets/README.md) | **Monthly KPI / ZIP / staff JSON+CSV** from CFO packs |
| [08_finance/monthly/](08_finance/monthly/2026-06.md) | Month narratives (Jan, Mar, Apr forecast, Jun) |
| [archive/legacy_mobile.md](archive/legacy_mobile.md) | Discontinued mobile service items — do not quote |
| [09_daily_ops/README.md](09_daily_ops/README.md) | **Daily operating guide** — rhythms, roles, data to feed AI |
| [09_daily_ops/improvement_backlog.md](09_daily_ops/improvement_backlog.md) | Growth & ops projects (prioritized) |
| [09_daily_ops/decision_log.md](09_daily_ops/decision_log.md) | Policy decisions with dates |
| [10_automation/README.md](10_automation/README.md) | **Connectors, MCP, hooks, automation roadmap** |
| [10_automation/hcp_api_setup.md](10_automation/hcp_api_setup.md) | **HCP MAX API** — key, sync, MCP, webhooks |
| [10_automation/ngc_admin_bot_spec.md](10_automation/ngc_admin_bot_spec.md) | **Admin Bot** — deposit alerts, review requests, webhooks |
| [10_automation/legacy_pricebook_cleanup.md](10_automation/legacy_pricebook_cleanup.md) | **Deactivate mobile / NGC Conversion pricebook items** |

**Quick start:** [`START_HERE.md`](../START_HERE.md) · **Prompts:** [`prompts/`](../prompts/) · **Sync:** `./scripts/sync/run_ingest.sh`

| Path | Description |
|------|-------------|
| `external_docs/exports/pricebook/NeighborhoodGolfCarts_pricebook_export.csv` | Housecall Pro pricebook (282 items) |
| `external_docs/exports/qbo/chart_of_accounts.xlsx` | QuickBooks chart of accounts |
| `external_docs/exports/qbo/profit_and_loss_last_12_months.xlsx` | QBO P&L (Jun 2025 – Jun 2026) |
| `external_docs/exports/qbo/balance_sheet_current.xlsx` | QBO balance sheet (Jun 28, 2026) |
| `external_docs/exports/qbo/products_and_services.xlsx` | QBO product/service list |
| `external_docs/exports/cfo_reports/` | PAGCW monthly CFO / boardroom PDFs (Jan–Jun 2026) |
| `external_docs/My Drive/NGC Document Repository/` | SOPs, manuals, procedures (Google Drive sync) |

## Authority rules

When information conflicts, use this order:

1. **Owner/staff verbal confirmation** (most recent)
2. **`knowledge/` files** (this folder)
3. **Raw exports** in `external_docs/exports/`
4. **Google Drive documents** — check `archive/legacy_mobile.md` for outdated mobile SOPs
5. **Never use** discontinued NGC Conversion products or mobile-only pricebook lines for current quotes

## Privacy — do not store or repeat

- Customer names, addresses, phone numbers, or invoice details
- Login credentials or API keys
- Specific bank account numbers (account names like "Chase OPEX" are OK)

## Update cadence

Refresh exports and update `Last verified` dates when:

- Pricebook changes in Housecall Pro
- New lithium SKUs or warranty terms change
- Team roles change
- HCP → Everlogic migration completes
- Pickup/delivery zone boundaries are finalized
