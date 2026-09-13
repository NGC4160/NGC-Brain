---
bulletin: NGC-OPS-FIN-2026-09
date: 2026-09-11
filed: 2026-09-13
status: recommendation
approved: false
live_policy: false
---

# NGC-OPS-FIN-2026-09 — Pickup/Delivery Cost Assignment

**STATUS = recommendation pending Ryan approval. NOT live policy yet.**

Do **not** quote, estimate, or book as if **$160**, a **30-mile** included radius, or a **$129** 31–40 mile charge is in effect.

**Live practice until Ryan approves** remains:

- Customer: free within **40 mi Northshore**; **$99** flat outside 40 mi or Southshore
- Internal: **$90** free P/D trip cost, once per job, hidden on the estimate

See [shop_services.md](../03_services/shop_services.md#pickup--delivery).

| Field | Value |
|-------|-------|
| **Bulletin No.** | NGC-OPS-FIN-2026-09 |
| **Date** | September 11, 2026 |
| **Status (on the bulletin)** | Revised Recommendation — Management Approval and Prospective Implementation |
| **Subject** | Pickup/Delivery Cost Assignment, Included Service Radius, and Outer-Zone Pricing |
| **Filed in Brain** | 2026-09-13 (source PDF provided by Ryan White) |
| **Source PDF** | `NGC-OPS-FIN-2026-09_Pickup_Delivery_Cost_Allocation.pdf` — **not committed** (this repo stores official SOP PDFs in Drive Procedures; it does not keep ops-bulletin binaries) |

## Who this is for

- **Chief / CFO / Books** — find the recommendation and the cited inputs
- **Shop** — keep using live HCP rules until Ryan says this is policy
- **Front Desk** — do **not** change customer language or zone fees from this file

The bulletin is silent on a Northshore / Southshore split. Do **not** invent a Southshore change. Live Southshore remains the **$99** paid zone until Ryan says otherwise.

## Executive recommendation (proposed — not approved)

- Revise **internal** transportation cost assignment from **$90 → $160** per transported repair ticket
- Reduce the included pickup / return delivery area from **40 → 30** one-way road miles from the Covington shop
- Charge **$129** for customers **31–40** one-way road miles
- Trips **beyond 40** road miles: individually quoted and management-approved

## Key inputs cited

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

One-way road miles → estimated total cost. Figures copied from the bulletin.

| One-way miles | Estimated total cost |
|--------------:|---------------------:|
| 10 | $85.43 |
| 15 | $121.78 |
| 20 | $158.14 |
| 25 | $194.49 |
| 30 | $230.84 |
| 35 | $267.19 |
| 40 | $303.55 |

## Proposed customer pricing table

| One-way miles | Customer charge | Internal assignment | Treatment |
|---------------|----------------:|--------------------:|-----------|
| 0–30 | $0 | $160 | Included |
| 31–40 | $129 | $160 | Outer-zone charge |
| >40 | Quoted | Actual review | Management approval |

## Customer-facing terminology (proposed)

Replace **“Round Trip”** with **“Pickup & Return Delivery Transportation Charge”**.

Do **not** change HCP line names or customer copy until Ryan approves.

## Implementation controls (proposed)

These are controls on the recommendation, not live SOP steps.

- Apply only to tickets that need NGC pickup & delivery
- Do **not** duplicate the **$160** in QBO as a second vehicle / payroll expense
- Measure by **one-way driving miles**
- Record mileage for **60–90 days**
- Track exceptions
- Quarterly review
- Route stacking

## Live vs proposed (bots)

| Topic | Live now | This bulletin |
|-------|----------|---------------|
| Status | Policy (2026-07-13 / 2026-09-01) | Recommendation only |
| Internal free-P/D cost | **$90** once per job, hidden | Proposes **$160** |
| Included radius | **40** mi Northshore | Proposes **30** one-way road miles |
| 31–40 mi customer | Still inside free Northshore (if Northshore) | Proposes **$129** |
| Outside 40 mi / Southshore | **$99** flat | >40 mi individually quoted + management-approved |
| Estimate GP check | Add **$90** once, then sell >= (line costs + 90) / 0.46 | Do **not** swap in $160 unless Ryan approves |

If Ryan approves, write it to [decision_log.md](../09_daily_ops/decision_log.md) and update [shop_services.md](../03_services/shop_services.md) the same day. Until then, this file is the findable copy of the recommendation only.
