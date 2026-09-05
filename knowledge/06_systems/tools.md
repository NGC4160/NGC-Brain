# Systems & Tools

**Last verified:** 2026-09-05

## Current stack

| System | Purpose | Status |
|--------|---------|--------|
| **Housecall Pro** | Scheduling, pricebook, jobs, invoicing, customer comms | Active |
| **QuickBooks Online** | Accounting, inventory, sales tax, P&L | Active — books clean |
| **Google Drive** | Staff SOPs, Procedures, manuals | **Live content** = Drive connector (NGC985). Brain catalog = `knowledge/.generated/drive_catalog.md` |
| **Website** | [NGCGolfCarts.com](https://www.NGCGolfCarts.com) | Active |
| **Google Business Profile** | Local presence, reviews | Active |
| **GarageBuddy** | Open-source garage DMS (**future/eval** sandbox) | Not current shop process — see [garagebuddy.md](garagebuddy.md) |
| **CartScope** | Tech-facing step-by-step golf cart diagnostic checklist (web app) | Active — see [cartscope.md](cartscope.md) |

## Housecall Pro

**Why it was chosen:** Built for mobile field service (dispatch, "On My Way," on-site jobs).

**Current use (shop model):**

- Pricebook (282 items) — source of truth for service **line-item** pricing
- **Material markup matrix** — lives **inside Housecall Pro** (see below)
- Job creation and tracking
- **Pickup / drop-off queue** — HCP stages **New job** and **Customer drop off** ARE that queue after estimate approval (distinct from the deposit pipeline)
- **Job pipeline** for approved work that needs a parts deposit (existing deposit stages only — do not invent others)
- Invoicing and payment collection
- Customer notifications

**HCP pickup / drop-off queue** (Ryan White, 2026-08-24): When NGC gets a call for work, we send an estimate for approval. If the customer approves it, they go in the queue for pickup or customer drop-off. When there is an opening in the slot, we schedule them. In the HCP jobs pipeline, the stages **New job** and **Customer drop off** ARE that queue. Queue order: go by job number unless it makes sense to pick up another cart in the same area on the same run. Do not say lock a time, hold a spot, or easy yes. In-shop only (no mobile). Distinct from the deposit pipeline below. Full rule: [shop_workflow.md](../04_operations/shop_workflow.md).

**HCP job pipeline — approved work that needs a parts deposit** (Ryan White, 2026-08-23):

1. **COPY TO JOB** (copy approved estimate(s) onto the job) → move to **Awaiting Deposit**
2. Deposit received → **Need to Order** (Ryan’s exact name; repo had no prior HCP column spelling of this stage)
3. Parts ordered → **Waiting for Materials**

Queue pickup or drop-off after approval. Do not say lock a time, hold a spot, or easy yes. Deposit is required before ordering a battery, motor, or controller. This deposit pipeline is **distinct** from the **New job** / **Customer drop off** queue. Full rule: [shop_workflow.md](../04_operations/shop_workflow.md).

**Material markup matrix (Ryan White, 2026-09-01; table from live HCP screenshot 2026-09-02):** The NGC material markup matrix is **inside Housecall Pro**, not Google Drive. Do **not** treat Drive files **“Parts list Matrix”** (sheet) or **“Price Markup”** (HEIC) as the source of truth. Shop owns this check. Same table: [pricebook_reference.md](../03_services/pricebook_reference.md).

Quoted from the live HCP screenshot (Settings › Price Book › Materials › Materials Markup; do not invent other bands or a target-sell column):

- **Path:** Price book settings gear → Materials tab → Materials Markup
- **URL:** https://pro.housecallpro.com/app/settings/price_book/materials
- **Toggle:** On
- **HCP help text:** Apply markups by cost range. Set ranges and a % markup, and we'll apply it to all matching materials in your Price Book.
- **Columns:** Markups | Cost from | Cost to | Markup % | Profit % (no target-sell column)

| Markups | Cost from | Cost to | Markup % | Profit % |
|---------|----------:|--------:|---------:|---------:|
| Markup 1 | $0.01 | $9.99 | 307.00% | 75.43% |
| Markup 2 | $10.00 | $39.99 | 185.71% | 65.00% |
| Markup 3 | $40.00 | $99.99 | 104.00% | 50.98% |
| Markup 4 | $100.00 | $399.99 | 81.82% | 45.00% |
| Markup 5 | $400.00 | $999.99 | 60.00% | 37.50% |
| Markup 6 | $1,000.00 | $1,999.99 | 42.86% | 30.00% |
| Markup 7 | $2,000.00 | $4,999.99 | 37.93% | 27.50% |
| Markup 8 | $5,000.00 | $ — | 33.33% | 25.00% |

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

## Document repository (Google Drive)

| Layer | Truth |
|-------|--------|
| **Live file content** | Google Drive connector (NGC985). Bots read SOPs there. |
| **Brain catalog** | [`knowledge/.generated/drive_catalog.md`](../.generated/drive_catalog.md) — GENERATED, not policy. Names, ids, mime, modifiedTime, parent, view URL. |
| **Actions refresh** | `scripts/sync/run_drive_sync.py` if secret `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON` is set. Missing secret = skip; does **not** fail HCP/QBO. |
| **`external_docs/My Drive/`** | **Not** a live sync. Do not treat it as a Drive clone. |
| **Never commit** | File_000 zip (`1JABSf3vzt4W0PLjTSEPsZdX06dKJLP-j`) or any Drive binary/PDF. |

| Folder | Drive ID | Open |
|--------|----------|------|
| **NGC Document Repository** | `1koI6xu03NfGzr7AMKaAnCHiguZOU7L6r` | [folder](https://drive.google.com/drive/folders/1koI6xu03NfGzr7AMKaAnCHiguZOU7L6r) |
| **Procedures** | `1-NjzSQxTsbXqlOhbK7ptZzg1H5G2ntdh` | [folder](https://drive.google.com/drive/folders/1-NjzSQxTsbXqlOhbK7ptZzg1H5G2ntdh) |
| **Checklists** | `1aNp0s5gGqq6B_SjxpAyCU3O-IkzUFPkp` | [folder](https://drive.google.com/drive/folders/1aNp0s5gGqq6B_SjxpAyCU3O-IkzUFPkp) |
| **Manuals** | `1-1QqJQh4UojQEERawwpfEjKYOor2VMuR` | [folder](https://drive.google.com/drive/folders/1-1QqJQh4UojQEERawwpfEjKYOor2VMuR) |

**NGC-OPS-DRIVER-09032026R0** (Driver / Shop Technician Assistant SOP) lives in Drive Procedures: [NGC-OPS-DRIVER-09032026R0 Driver Shop Technician Assistant SOP.pdf](https://drive.google.com/file/d/13ZJ9FxUQFD_d9yvVRfr6Ae2xE9P6hsk2/view) (file id `13ZJ9FxUQFD_d9yvVRfr6Ae2xE9P6hsk2`). Brain summary: [driver_sop.md](../04_operations/driver_sop.md). **NGC-QC-1** and **NGC-IR-1** were **not** found in Drive Procedures by those titles (2026-08-30). Keep the short rules in [shop_workflow.md](../04_operations/shop_workflow.md). Lithium sales PDF is in Procedures: [lithium_sales_guide.md](../02_products/lithium_sales_guide.md).

## Deposit-alert script (not a Grok Bot)

Batch automation after HCP sync. **Not** the COS. Live Grok roster: [roles.md](../05_team/roles.md).

| Resource | Purpose |
|----------|---------|
| [10_automation/ngc_admin_bot_spec.md](../10_automation/ngc_admin_bot_spec.md) | Planned/batch spec — deposit alerts, review requests |
| `scripts/admin_bot/deposit_gate_alerts.py` | Phase 1 — Jesse deposit queue |
| `knowledge/.generated/deposit_alerts.md` | Generated snapshot (invoice # + description only) — **not policy** |

Run: `./scripts/admin_bot/run_deposit_alerts.sh` (auto-runs after HCP sync)

This knowledge base (`knowledge/`) is the policy layer for **Chief** and shop bots.

## Integrations & fees

- **Payment processing:** Merchant fees tracked in QBO (~$13.5k/year period)
- **Stripe Capital (via HCP):** Fees tracked separately
- **Shop supply fee:** Passed to customers where applicable ($1,981 in period)

## Do not store here

- Login credentials for HCP, QBO, Google, or DMS
- API keys or tokens
