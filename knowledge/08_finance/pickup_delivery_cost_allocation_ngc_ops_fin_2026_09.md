---
bulletin: NGC-OPS-FIN-2026-09
date: 2026-09-11
filed: 2026-09-13
approved: 2026-09-13
status: approved
live_policy: true
approved_by: Ryan White via Chief
---

# NGC-OPS-FIN-2026-09 — Pickup/Delivery Cost Assignment

**STATUS = APPROVED / live shop policy as of 2026-09-13 (Chief / Ryan).**

This bulletin is **live**. It supersedes the 2026-07-13 40-mile Northshore / **$99** Southshore-or-outside-40 rule and the 2026-09-01 **$90** hidden free-P/D internal cost.

Do **not** quote the old **$90**, **40-mile included**, or **$99** outside-40 / Southshore fees.

| Field | Value |
|-------|-------|
| **Bulletin No.** | NGC-OPS-FIN-2026-09 |
| **Date (bulletin)** | September 11, 2026 |
| **Approved** | 2026-09-13 by Ryan White via Chief |
| **Subject** | Pickup/Delivery Cost Assignment, Included Service Radius, and Outer-Zone Pricing |
| **Shop origin for miles** | 71363 Thelma Ln, Suite E, Covington, LA 70433 |
| **Source PDF** | `NGC-OPS-FIN-2026-09_Pickup_Delivery_Cost_Allocation.pdf` — provided by Ryan 2026-09-13; **not committed** (this repo stores official SOP PDFs in Drive Procedures; it does not keep ops-bulletin binaries) |

## Live rules (use these)

Applies **only** to tickets that actually need **NGC pickup AND return delivery**. Customer drop-off / customer pickup with no NGC transport does **not** get the internal **$160**.

Measure **actual one-way driving (road) miles** from the Covington shop. Do **not** use straight-line / as-the-crow-flies miles.

| One-way road miles | Customer charge | Internal assignment | Treatment |
|--------------------|----------------:|--------------------:|-----------|
| 0–30 | $0 | $160 | Included |
| 31–40 | $129 | $160 | Outer-zone charge |
| >40 | Individually quoted | Actual review | **Ryan / management approval required** |

- Internal transportation cost is **$160** per transported repair ticket (pickup **and** return).
- Do **not** post the **$160** in QuickBooks as a second vehicle or payroll expense.
- Customer-facing line name: **Pickup & Return Delivery Transportation Charge** (replaces “Round Trip”).
- Southshore is **not** a separate fee band. Use the same mileage bands. Do not invent a Southshore exception.

Customer policy home: [shop_services.md](../03_services/shop_services.md#pickup--delivery).

## Who this is for

- **Shop / Front Desk / Jesse** — quote and book from the live table above
- **Books / CFO** — **$160** is internal job-cost assignment only; do not duplicate it as a QBO vehicle/payroll expense
- **Hayden / driver routing** — one-way road miles; route stacking still applies

## Key inputs cited (from the bulletin)

Do not invent extra rates or a formula breakdown beyond what the bulletin states.

| Input | Figure |
|-------|--------|
| YTD vehicle expense | **$21,005** / **16,776** miles = **$1.252** per vehicle mile |
| Driver pay (current planning) | **$18/hr** base + **41.4%** burden = **$25.45/hr** burdened |
| Driver pay (prior, cited for contrast) | **$15/hr** → **~$21.21** burdened |
| Fuel planning | **$4.00/gal** (local ~**$3.60–$3.65**; start of 2026 ~**$2.40–$2.45**) |
| Planning speed | **45 MPH** |
| Onsite time | **30 minutes** total across pickup + return |

**Formula (as stated):** Estimated cost = **$12.73 + ($7.27 × one-way road miles)**

## Distance table (estimated total cost)

One-way road miles → estimated total cost. Figures copied from the bulletin. This is **cost support**, not the customer price list.

| One-way miles | Estimated total cost |
|--------------:|---------------------:|
| 10 | $85.43 |
| 15 | $121.78 |
| 20 | $158.14 |
| 25 | $194.49 |
| 30 | $230.84 |
| 35 | $267.19 |
| 40 | $303.55 |

## Estimate GP check (standing, updated 2026-09-13)

Shop owns this check. Once per job, not every SKU or line.

| Layer | GP rule | $160? |
|-------|---------|-------|
| **Price book services** | 50% GP after 4% CC **on that item only**: **sell >= cost / 0.46** | **No** — do not add $160 |
| **Materials** | HCP markup matrix only | **No** |
| **Estimate (NGC P&D, 0–30 mi included)** | Add **$160 once** to total job cost, then **sell >= (sum of line costs + 160) / 0.46** | **Once per job** — hide the trip from the customer |

On **31–40** mi jobs, the customer line is **$129** (Pickup & Return Delivery Transportation Charge). Internal assignment is still **$160**. Do not invent a second GP padding rule for the difference. **>40** mi is quoted and needs Ryan approval before it is sold.

The 2026-09-01 **~$196** extra-sell shorthand was for the old **$90** trip cost. Do **not** keep using **$90** or **~$196**.

The **4%** is only the fee used in this GP check — not a locked customer surcharge rate.

## Implementation controls (live)

- Apply only to tickets that need NGC pickup **and** return delivery
- Do **not** duplicate the **$160** in QBO as a second vehicle / payroll expense
- Measure by **one-way driving miles**
- Record mileage for **60–90 days**
- Track exceptions
- Quarterly review
- Route stacking

## What this supersedes

| Topic | Before (do not use) | Live as of 2026-09-13 |
|-------|---------------------|------------------------|
| Internal P/D cost | **$90** once per free-P/D job, hidden | **$160** per NGC pickup **and** return ticket |
| Included radius | **40** mi Northshore | **0–30** one-way **road** miles from Covington shop |
| 31–40 mi customer | Inside old free Northshore (if Northshore) | **$129** Pickup & Return Delivery Transportation Charge |
| Outside 40 mi / Southshore | **$99** flat | **>40** individually quoted + Ryan / management approval. Southshore uses the same mileage bands |
| Customer line name | “Round Trip” / Standard Pick-up/Drop-off | **Pickup & Return Delivery Transportation Charge** |

HCP pricebook export may still list **Standard Pick-up/Drop-off Service** at **$99**. That export line is **stale vs this policy**. Do not quote **$99**. Shop should align the live HCP line name and amount to this bulletin — do not invent that the HCP SKU is already updated.

If Ryan changes this again, write it to [decision_log.md](../09_daily_ops/decision_log.md) the same day.
