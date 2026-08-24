# Systems & Tools

**Last verified:** 2026-08-24

## Current stack

| System | Purpose | Status |
|--------|---------|--------|
| **Housecall Pro** | Scheduling, pricebook, jobs, invoicing, customer comms | Active |
| **QuickBooks Online** | Accounting, inventory, sales tax, P&L | Active — books clean |
| **Google Drive** | SOPs, document repository, internal docs | Active (`external_docs/My Drive/`) |
| **Website** | [NGCGolfCarts.com](https://www.NGCGolfCarts.com) | Active |
| **Google Business Profile** | Local presence, reviews | Active |
| **GarageBuddy** | Open-source garage DMS (eval sandbox) | Eval — see [garagebuddy.md](garagebuddy.md) |

## Housecall Pro

**Why it was chosen:** Built for mobile field service (dispatch, "On My Way," on-site jobs).

**Current use (shop model):**

- Pricebook (282 items) — source of truth for service pricing
- Job creation and tracking
- **Pickup / drop-off queue** — HCP stages **New job** and **Customer drop off** ARE that queue after estimate approval (distinct from the deposit pipeline)
- **Job pipeline** for approved work that needs a parts deposit (existing deposit stages only — do not invent others)
- Invoicing and payment collection
- Customer notifications

**HCP pickup / drop-off queue** (Ryan White, 2026-08-24): When NGC gets a call for work, we send an estimate for approval. If the customer approves it, they go in the queue for pickup or customer drop-off. When there is an opening in the slot, we schedule them. In the HCP jobs pipeline, the stages **New job** and **Customer drop off** ARE that queue. Do not say lock a time, hold a spot, or easy yes. In-shop only (no mobile). Distinct from the deposit pipeline below. Full rule: [shop_workflow.md](../04_operations/shop_workflow.md).

**HCP job pipeline — approved work that needs a parts deposit** (Ryan White, 2026-08-23):

1. **COPY TO JOB** (copy approved estimate(s) onto the job) → move to **Awaiting Deposit**
2. Deposit received → **Need to Order** (Ryan’s exact name; repo had no prior HCP column spelling of this stage)
3. Parts ordered → **Waiting for Materials**

Queue pickup or drop-off after approval. Do not say lock a time, hold a spot, or easy yes. Deposit is required before ordering a battery, motor, or controller. This deposit pipeline is **distinct** from the **New job** / **Customer drop off** queue. Full rule: [shop_workflow.md](../04_operations/shop_workflow.md).

**Export location:** `external_docs/exports/pricebook/NeighborhoodGolfCarts_pricebook_export.csv`

**Known cleanup needed:**

- Deactivate legacy mobile/on-site line items
- Remove discontinued NGC Conversion products
- Remove TEST PARTIAL KIT and cart sales placeholders
- Update pickup/delivery descriptions to match current free-zone policy

## QuickBooks Online

**Bookkeeper:** Jessica (Griffin & Furman)

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
| **GarageBuddy** | Open-source ASP.NET eval — submodule `tools/GarageBuddy`; not production |

**Setup:** [garagebuddy.md](garagebuddy.md) · `./scripts/garagebuddy/setup.sh`

**Migration trigger:** When shop volume slows enough to execute migration off HCP.

**Migration checklist:**

1. Export pricebook (done)
2. Map QBO products/services to DMS SKUs
3. Archive mobile-only workflows
4. Train Jesse + Ryan on new scheduling/invoicing flow
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
| `scripts/admin_bot/deposit_gate_alerts.py` | Phase 1 — Jesse deposit queue |
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
