# Shop Services & Policies

**Last verified:** 2026-08-30  
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

| Zone | Fee |
|------|-----|
| **Within 40 miles of shop on the Northshore** | **Free** |
| **Outside 40 miles OR Southshore** | **$99** flat (Standard Pick-up/Drop-off) |

**Policy (final — 2026-07-13):** 40-mile Northshore free zone is firm. Outside that zone or Southshore = **$99** flat. No trip charges / mobile service.

**Driver:** Roy handles pickups and deliveries.

After a customer **approves**, queue pickup or drop-off. Do **not** say a time is locked, a spot is held, or that this is an easy yes. Do not invent booking language.

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

Service manuals and procedures: `external_docs/My Drive/NGC Document Repository /`

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
