# Systems & Tools

**Last verified:** 2026-06-28

## Current stack

| System | Purpose | Status |
|--------|---------|--------|
| **Housecall Pro** | Scheduling, pricebook, jobs, invoicing, customer comms | Active |
| **QuickBooks Online** | Accounting, inventory, sales tax, P&L | Active — books clean |
| **Google Drive** | SOPs, document repository, internal docs | API for cloud (`google_drive_setup.md`); Mac Desktop sync optional |
| **Website** | [NGCGolfCarts.com](https://www.NGCGolfCarts.com) | Active |
| **Google Business Profile** | Local presence, reviews | Active |

## Housecall Pro

**Why it was chosen:** Built for mobile field service (dispatch, "On My Way," on-site jobs).

**Current use (shop model):**

- Pricebook (282 items) — source of truth for service pricing
- Job creation and tracking
- Invoicing and payment collection
- Customer notifications

**Export location:** `external_docs/exports/pricebook/NeighborhoodGolfCarts_pricebook_export.csv`

**Known cleanup needed:**

- Deactivate legacy mobile/on-site line items
- Remove discontinued NGC Conversion products
- Remove TEST PARTIAL KIT and cart sales placeholders
- Update pickup/delivery descriptions to match current free-zone policy

## QuickBooks Online

**Bookkeeper:** Jill Stoltz

**Key bank accounts (names only):**

| Account | Purpose |
|---------|---------|
| Chase Checking (7928) | Operating (OPEX) |
| Growth & Reserves (0056) | Reserves |
| Payroll 6966 | Payroll |
| Tax Account 6982 / Tax Reserves (0031) | Tax withholding |
| Housecall Pro Balance | HCP payouts |

**Exports:** `external_docs/exports/qbo/`

**Income tracking highlights:**

- `Sales and Services` — primary repair revenue bucket
- `LFP Conversions Only` — dedicated lithium income line
- `Services Income` / `Sales of Product Income` — additional buckets
- `Mobile Trip Income` — legacy; should trend to zero

## Planned: Dealer Management System (DMS)

| Candidate | Notes |
|-----------|-------|
| **Everlogic** | **Preferred** — lean toward this when migrating |
| **BitDMS** | Under evaluation |

**Migration trigger:** When shop volume slows enough to execute migration off HCP.

**Migration checklist:**

1. Export pricebook (done)
2. Map QBO products/services to DMS SKUs
3. Archive mobile-only workflows
4. Train Christine + Ryan on new scheduling/invoicing flow
5. Parallel-run period before cutting HCP

## Document repository

`external_docs/My Drive/NGC Document Repository /`

| Subfolder | Contents |
|-----------|----------|
| Procedures | Shop/mobile SOPs, diagnostic workflows |
| Checklists | Service procedure checklists |
| Manuals | OEM manuals by brand (Club Car, EZGO, Yamaha, etc.) |

## NGC Admin Bot

Folder: `external_docs/My Drive/NGC Admin Bot/` — automation/AI backend (empty; code lives in repo).

| Resource | Purpose |
|----------|---------|
| [10_automation/ngc_admin_bot_spec.md](../10_automation/ngc_admin_bot_spec.md) | Full spec + roadmap |
| `scripts/admin_bot/deposit_gate_alerts.py` | Phase 1 — Christine deposit queue |
| `knowledge/.generated/deposit_alerts.md` | Daily output (no PII) |

Run: `./scripts/admin_bot/run_deposit_alerts.sh` (auto-runs after HCP sync)

This knowledge base (`knowledge/`) serves as the bot's structured policy layer.

## Integrations & fees

- **Payment processing:** Merchant fees tracked in QBO (~$13.5k/year period)
- **Stripe Capital (via HCP):** Fees tracked separately
- **Shop supply fee:** Passed to customers where applicable ($1,981 in period)

## Do not store here

- Login credentials for HCP, QBO, Google, or DMS
- API keys or tokens
