# NGC Morning Briefing — 2026-08-15

**Saturday, August 15, 2026** · Service manager view · no customer names  
**HCP jobs export:** 2026-08-14T14:28:53.724350+00:00  
**Generated:** 2026-08-15 04:53 UTC

## Snapshot

- In progress: **15** (target 6) · over by 9
- Needs scheduling: **14** (target 5)
- Scheduled incoming: 14
- Stale 15+ days: **7** · Lithium in progress: 1 · Lithium >3d: **1**
- Deposit gate: 2 BLOCK_PARTS · 9 unpaid diag · 26 balances due

## Top 3 priorities

1. **WIP hygiene** — 15 in progress (target 6), 7 jobs 15+ days. Audit oldest tickets in HCP: close, move to waiting parts, or put a bay owner on the card. Hold new drop-offs until WIP ≤ 6.
2. **Protect lithium SLA** — #17248 is 102d in shop (promise is 2–3 days). Finish, reschedule with a firm date, or escalate. Do not start a second lithium until this lane is honest.
3. **Jesse deposit gate** — 2 BLOCK_PARTS (#17182-2, #17419). Collect deposit before any battery/motor/controller order.

## Lithium jobs at risk (2–3 day turnaround)

- #17248 · 48V Professional Lithium Battery Conversion Kit Installed · 102d · bay Marlon, Dylan · Roy on ticket (Li)
- Also watch (not in-bay, but lithium / deposit-blocked):
  - #17425 · Batteries & Cables - 3.0- NGC Lithium Conversion, 72V 105AH · 3d · unassigned (Li, DISCONTINUED SKU) · `needs scheduling`
  - #17182-2 · Accessories - 1.0-Replace Charger Port, Lithium upgrade · 24d · Richard · Roy on ticket (Li) · `scheduled`
- **Do not quote NGC Conversion** — open ticket(s) still on the discontinued line. Professional Kits only for new work.
  - #17425 · Batteries & Cables - 3.0- NGC Lithium Conversion, 72V 105AH · 3d · unassigned (Li, DISCONTINUED SKU)

## Deposit / parts-order follow-ups (Jesse)

**BLOCK_PARTS — do not order**
- #17182-2 · Accessories - 1.0-Replace Charger Port, Lithium upgrade · `scheduled` · gap $1473 — Do not order parts — collect deposit first
- #17419 · 1.5-Complete Battery Replacement, 8V · `in progress` · gap $800 — Do not order parts — collect deposit first
**Unpaid diagnostic — collect $179 before booking**
- #17433 · gap $202
- #17432 · gap $202
- #17429 · gap $202
- #17428 · gap $202
- #17424 · gap $202
- #17423 · gap $202
- … and 3 more unpaid diagnostics
**In-progress balances ≥ $300 — collect before more labor / pickup**
- #17395 · General - ***SEE NOTES*** · gap $950
- #17409 · General - 1.0 - Golf Cart Diagnostic & Inspection · gap $311
- #17381 · ***SEE NOTES*** · gap $311

## Carts in shop (HCP in progress — no customer names)

- #17248 · 48V Professional Lithium Battery Conversion Kit Installed · 102d · bay Marlon, Dylan · Roy on ticket (Li)
- #17260 · Accessories - 1.0-Seat belt kit installation · 101d · bay Dylan · Roy on ticket
- #17109-2 · Brakes - 1.0-Brake Inspection & Adjustment · 80d · bay Taylor, Marlon · Roy on ticket
- #17383 · General - ***SEE NOTES*** · 24d · Roy on ticket
- #17381 · ***SEE NOTES*** · 24d · bay Ryan · Roy on ticket
- #17390 · General - 1.0 - Golf Cart Diagnostic & Inspection · 22d · bay Marlon · Roy on ticket
- #17395 · General - ***SEE NOTES*** · 18d · bay Marlon · Roy on ticket
- #17409 · General - 1.0 - Golf Cart Diagnostic & Inspection · 11d · bay Marlon · Roy on ticket
- #17410 · General - 1.0 - Golf Cart Diagnostic & Inspection · 10d · bay Marlon · Roy on ticket
- #17411 · ***SEE NOTES*** · 9d · bay Ryan · Roy on ticket
- #17412 · General - 1.0 - Golf Cart Diagnostic & Inspection · 8d · bay Marlon · Roy on ticket
- #17416 · ***SEE NOTES*** · 7d · Roy on ticket
- #17414 · General - 1.0 - Golf Cart Diagnostic & Inspection · 7d · bay Marlon · Roy on ticket
- #17418 · General - 1.0 - Golf Cart Diagnostic & Inspection · 6d · Roy on ticket
- #17419 · 1.5-Complete Battery Replacement, 8V · 4d · Roy on ticket

## Improvement backlog — touch today

- **HCP WIP hygiene — audit stale "in progress" (15+ days), correct statuses** (Open)
- 20 minutes: walk the 15+ day list with Jesse and restatus or finish two tickets.

## Staff / Roy / urgent

- Staff today: **not provided** — assume full shop (Ryan, Jesse, Taylor, Marlon, Roy). Peyton is on-call for advanced diag only.
- Pickups/deliveries for Roy: **none listed** in HCP descriptions. Jesse to set a zone-batched route.
- Urgent: **not provided.**

## What I still need from you

- Who is in / out today (especially Taylor, Marlon, Jesse, Roy, Peyton)
- Roy's actual pickup/delivery list (or confirm none)
- Any fire (comeback, angry customer, fleet) — do not paste names/phones
- Which 15+ day tickets are physically in a bay vs stale HCP status
- Confirm HCP assignees not on the current roster: **Dylan, Richard** (first names only — close or reassign those tickets)

## Notes

- Diagnostic is **$179** minimum — not waived; applies toward repair on known-issue jobs.
- Pickup/delivery: free within 40 mi Northshore; **$99** outside or Southshore. No mobile / trip charges.
- Lithium: Professional Kits only (36V/48V/MINI/72V/150AH). NGC Conversion is discontinued.

Regenerate: `./scripts/sync/run_morning_briefing.sh`  
Daily email: morning-sync GitHub Action → Ryan@NGCgolfcarts.com (needs SMTP secrets).

