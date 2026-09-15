# Shop Services & Policies

**Last verified:** 2026-09-14  
**Pricing source:** Housecall Pro pricebook export (282 items) — see [pricebook_reference.md](pricebook_reference.md)

## Service model

- **All work is performed in-shop** at 71363 Thelma Ln, Suite E, Covington
- **No mobile / on-site service** — no trip charges
- Customers may use **free or paid pickup & delivery** (see below)

## Diagnostics

| Service | Price | Notes |
|---------|------:|-------|
| **Diagnostic & Inspection (shop)** | $179 | **Not waived**; applies toward repair on known-issue jobs |
| **Diagnostic Testing (1 hr)** | $125 | |
| **Advanced Diagnostics (in-shop)** | $145 | Complex cases escalate to Ryan |
| **Shop labor (1 hr)** | $125 | |
| **7-Point Safety Inspection** | $0 | **Free** with every service |

NGC does **not** use a separate minimum service charge. Work that used to be billed that way is billed as **diagnostic**.

### Known-issue jobs

For jobs that **do not require full diagnosis** (e.g. broken suspension, noises), bill **diagnostic** ($179). That diagnostic fee **applies toward the repair**.

## Preventive maintenance

| Service | Price |
|---------|------:|
| Deluxe Electric PM Service | $179 |
| Deluxe Gas PM Service | $199 |
| Fleet Inspection (0.5 hr) | $60 |

## Lead-acid battery replacement

| Service | Price |
|---------|------:|
| Complete 6V set + install | $1,199 |
| Complete 8V set + install | $1,399 |
| Complete 12V set + install | $1,399 |
| Full Lead Acid Battery Replacement (starting) | $1,399 |
| 72V / 8×6V sets | $1,559 – $1,989 |

**Deposit:** typically **$800** for standard battery replacements.

Crown batteries referenced in pricebook; 18-month free replacement warranty on some 8V sets. Core charge: $20/battery (6V/8V), $30 (12V).

## Pickup & delivery

**Live policy (customer bands amended 2026-09-14 — NGC-OPS-FIN-2026-09).** Full bulletin: [pickup_delivery_cost_allocation_ngc_ops_fin_2026_09.md](../08_finance/pickup_delivery_cost_allocation_ngc_ops_fin_2026_09.md).

Applies **only** when NGC does **pickup AND return delivery**. Customer drop-off / customer pickup with no NGC transport does **not** get the internal **$160**. Measure **one-way road (driving) miles** from **71363 Thelma Ln, Suite E, Covington**. Not straight-line.

**Northshore vs Southshore:** lake split (north of Lake Pontchartrain vs south). Do not invent a parish list. If unsure, ask Jesse / Ryan — do not guess a cheaper Northshore band.

**0–30 inclusive remains $0** on Northshore (Ryan did not restate on 2026-09-14; preserves the live included zone). Edges are **half-open** so 40.0 / 50.0 / 60.0 do not double: Ryan’s spoken 30–40 / 40–50 / 50–60 = the table below.

**Northshore**

| One-way road miles | Customer charge | Internal assignment |
|--------------------|----------------:|--------------------:|
| **0–30 inclusive** | **$0** (included) | **$160** |
| **(30, 40]** | **$129** — **Pickup & Return Delivery Transportation Charge** | **$160** |
| **(40, 50]** | **$149** — same line name | **$160** |
| **(50, 60]** | **$179** — same line name | **$160** |
| **>60** | **No service** — do not quote / do not offer | — |

**Southshore:** **$179** flat, same line name. Do **not** apply Northshore free / $129 / $149. Ryan did not restate a Southshore mileage cap — do not invent one.

Do **not** quote the old **$90** internal cost, **40-mile included** radius, **$99** outside-40 / Southshore flat, **>40 individually quoted**, or **free within 40 miles**. Do **not** post **$160** in QBO as a second vehicle or payroll expense.

**Driver:** Hayden Silva (Driver / Shop Technician Assistant) handles pickups and deliveries. Driver first; shop assist only when transport and management priorities allow. Official SOP: **NGC-OPS-DRIVER-09032026R0** in Drive Procedures — [driver_sop.md](../04_operations/driver_sop.md). **Roy Gautreaux** is off roster (2026-09-03).

After a customer **approves**, queue pickup or drop-off. Do **not** say a time is locked, a spot is held, or that this is an easy yes. Do not invent booking language.

### Estimate GP check (standing)

**Updated 2026-09-14 by Ryan White via Chief** (supersedes the 2026-09-01 **$90** trip-cost layer; **$160** internal unchanged from 2026-09-13). Internal math. Shop owns this check. **$160** is once per NGC pickup-and-return job, not added to every price book line or SKU.

| Layer | GP rule | $160? |
|-------|---------|-------|
| **Price book services** | 50% GP after 4% CC **on that item only**: **sell >= cost / 0.46** | **No** — do not add $160 |
| **Materials** | HCP markup matrix only | **No** |
| **Estimate (NGC P&D, 0–30 mi included)** | Add **$160 once** to total job cost, then **sell >= (sum of line costs + 160) / 0.46** | **Once per job** |

On **0–30** mi included Northshore jobs, hide the **$160** from the customer (not a trip charge on the estimate). On **paid** P/D (Northshore **$129 / $149 / $179**, Southshore **$179**), show **Pickup & Return Delivery Transportation Charge** at the live amount; internal assignment is still **$160**. Do not invent extra GP padding for that difference. Northshore **>60** is not sold.

The old **~$196** extra-sell shorthand was for **$90**. Do **not** keep using **$90** or **~$196**.

The **4%** is only the fee used in this GP check. The customer-facing surcharge line still follows the live HCP line (do not invent that line’s % or $). Do not invent other GP targets. Same rule: [pricebook_reference.md](pricebook_reference.md#estimate-gp-check-standing).

## Deposits

Required when ordering:

- Batteries (lithium or lead-acid)
- Motors
- Controllers
- Special-order parts

**Amount:** enough to cover **material cost + card processing fees**.

| Job type | Typical deposit |
|----------|----------------:|
| Lithium conversion | $1,800 |
| Standard battery replacement | $800 |

**Deposit is required before ordering** a battery, motor, or controller.

### HCP pipeline after approval (deposit jobs)

When the customer approves work that needs a parts deposit, shop bots follow the existing HCP job pipeline — full rule in [shop_workflow.md](../04_operations/shop_workflow.md). Do not invent other stages.

1. **COPY TO JOB** — copy approved estimate(s) onto the job. Move the job to **Awaiting Deposit**. Queue pickup or drop-off.
2. Deposit received → move the job to **Need to Order** (Ryan’s wording; no prior HCP column spelling of this stage was in the repo).
3. Parts ordered → move the job to **Waiting for Materials**.

## Payment methods

Cash, card, check, Venmo, Zelle (per historical SOPs; confirm current preferred methods with Jesse).

### Credit card surcharge (shop-wide office rule)

**Confirmed 2026-08-30 by Ryan White.** This is **not lithium-only**. It applies to **every estimate** — repair, diagnostic, lithium, pickup, deposits, everything.

1. **Put the credit card surcharge on every estimate** before it goes out.
2. **Before sending the invoice for payment, or before taking payment from the customer,** update the surcharge amount so it matches the **final total**.

Do **not** invent a surcharge percentage or dollar amount. Ryan did not specify the rate. Use the live Housecall Pro surcharge / payment-processing line Jesse is actually adding. Recalc that line when the job total changes (added work, removed lines, deposit vs remaining balance).

HCP pricebook export lists payment-processing-fee items (some names include a printed %). Those names are **not** a locked office rate. Do not quote a % or $ unless it is on the live estimate / live HCP line.

## Cart brands serviced

All major makes and models, including:

- Club Car
- EZGO
- Yamaha
- Tomberlin, GEM, Columbia Par Car, Bad Boy Buggy, Star Classic, and others

Service manuals and procedures: Google Drive Procedures ([folder](https://drive.google.com/drive/folders/1-NjzSQxTsbXqlOhbK7ptZzg1H5G2ntdh)) — not live-synced into this repo.

## What's not offered

- Golf cart **sales** (planned for future)
- **Rentals** (planned for future)
- **Mobile / on-site repair**
- **NGC Conversion** lithium line (discontinued — Professional Kits only)

## Free inspection included

Every service includes the **7-point safety inspection**:

1. Wires, cables, terminals
2. Battery water levels (lead-acid)
3. Lights and horn
4. Tires — inflation, tread, wear
5. Steering and suspension
6. Drivetrain (axle & motor)
7. Brakes

**Printable form:** [`external_docs/templates/operations/NGC_Golf_Cart_Inspection_Report.pdf`](../../external_docs/templates/operations/NGC_Golf_Cart_Inspection_Report.pdf) — battery Δ / mOhm grid + Pass/Fail/N/A checklist. Used for complimentary campground / event inspections; promo **INSPECT10** = 10% off any service when the sheet is presented at booking.
