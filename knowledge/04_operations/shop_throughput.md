# Shop Throughput

**Last verified:** 2026-06-28  
**Owner:** Ryan (service manager)  
**Live board:** `knowledge/.generated/shop_board.md` (regenerate after HCP sync)

## Goal

Move carts through the shop predictably — especially **lithium conversions in 2–3 days** — without overloading Taylor and Marlon.

## Current constraints

| Resource | Capacity (planning) |
|----------|-------------------|
| Taylor + Marlon | ~2 primary repair lanes, ~6 productive hrs/day each |
| Peyton | Advanced diagnostics only — timeboxed, by trigger |
| Roy | Pickup/delivery — batch by zone, not one-off all day |
| Christine | Intake + deposits — gate before parts orders |
| Shop hours | Mon–Fri 8–5 |

**Planning math:** One Professional lithium kit ≈ **6 hours**. With two techs, plan **at most 2 lithium starts per day** if the shop is lithium-heavy; mix in smaller jobs only when WIP allows.

## WIP limits (non-negotiable targets)

| Lane | Target max | Why |
|------|------------|-----|
| In progress (all jobs) | **6** | ~1 day of work per tech with buffer |
| In progress (lithium) | **4** | Protect 2–3 day promise |
| Needs scheduling | **5** | Christine queue; book or decline within 48 hrs |
| Unassigned in progress | **0** | Every cart has an owner by **8:30 AM** |

When WIP exceeds limits: **stop scheduling new drop-offs** until oldest jobs complete or get a firm parts date.

## Shop lanes (HCP + floor)

Use these stages in HCP notes/tags and on the physical board:

```
INTAKE → DIAGNOSE → WAITING DEPOSIT/PARTS → IN REPAIR → QC/TEST DRIVE → READY → CLOSED
```

| Lane | Who owns | Exit criteria |
|------|----------|---------------|
| Intake / needs scheduling | Christine | Appointment booked or cart in bay |
| Diagnose | Assigned tech | Complaint verified, estimate approved |
| Waiting deposit/parts | Christine + Ryan | Deposit collected **before** battery/motor/controller order |
| In repair | Taylor / Marlon | Work complete per estimate |
| QC | Assigned tech | 7-point safety + test drive; fault codes cleared |
| Ready | Christine | Customer notified; balance collected or arranged |
| Pickup/delivery | Roy | Cart off lot |

## Daily rhythm

### 8:00 — Christine (10 min)

- Clear **needs scheduling** queue: book, callback, or waitlist
- Confirm deposits on any job waiting parts
- Give Roy today’s pickup/delivery list (zone batched)

### 8:15 — Ryan shop huddle (10 min)

Full procedure: [sops/SOP-10_morning_huddle.md](sops/SOP-10_morning_huddle.md)

- Read `knowledge/.generated/shop_board.md`
- Assign every in-progress cart to **Taylor or Marlon**
- Name **today’s finish list** (max 2 lithium + 2–4 repairs per tech)
- Flag **Peyton** jobs with one-line symptom (controller, intermittent, data log needed)

### End of day — Ryan (5 min)

- Update HCP status for anything that moved lanes
- Move stale **in progress** jobs to correct status (waiting parts, ready, etc.)
- Log blockers in [`../09_daily_ops/decision_log.md`](../09_daily_ops/decision_log.md) if policy changed

## Lithium tracker (per cart)

Copy into HCP job notes or a shared sheet — **no customer name required**, use invoice #:

| Field | Day 0 | Day 1 | Day 2 | Day 3+ |
|-------|-------|-------|-------|--------|
| Deposit received | ☐ | — | — | — |
| Kit pulled / ordered | ☐ | — | — | — |
| Install started | — | ☐ | — | — |
| QC + test drive | — | — | ☐ | — |
| Care guide given | — | — | — | ☐ |
| Customer notified ready | — | — | — | ☐ |

**SLA:** Day 3 = escalate to Ryan. Same-day promise only when kit is in stock **and** bay is open.

## Peyton trigger (when to loop in)

Use Peyton when **any** apply — otherwise keep on primary tech:

- Intermittent driveability after standard diag path
- Controller/monitor programming beyond handheld reset
- Repeated comeback on same electrical complaint
- Fleet/HOA multi-cart pattern

Timebox: diagnostic block scheduled, not open-ended WIP.

## Metrics (weekly)

Track in Friday weekly review:

| Metric | Target |
|--------|--------|
| Avg days in shop — lithium | ≤ 3 |
| Avg days in shop — general repair | ≤ 5 |
| In progress count (Fri AM) | ≤ 6 |
| Needs scheduling count (Fri AM) | ≤ 5 |
| Jobs closed per tech per week | Trend up as WIP drops |

## Known bottlenecks (from HCP snapshot)

As of last sync, the pipeline showed **heavy stale WIP** (many in-progress jobs 15+ days) and **11 needs scheduling**. Treat that as a **status hygiene + intake** problem first — throughput cannot improve until HCP reflects reality and WIP is capped.

**Immediate actions:**

1. Audit every **in progress** job older than 7 days — complete, waiting parts, or correct status
2. Assign all unassigned in-progress jobs
3. Prioritize lithium jobs over 3 days
4. Pause new lithium booking until at-risk lithium clears (if bays are full)

## Physical board

See [shop_whiteboard_layout.md](shop_whiteboard_layout.md) — 7-column layout, job cards, color code, and HCP sync cheat sheet.

## Related docs

- [shop_workflow.md](shop_workflow.md) — customer journey
- [sops/SOP-11_job_lane_lifecycle.md](sops/SOP-11_job_lane_lifecycle.md) — **lane moves, HCP sync, who moves cards**
- [../02_products/lithium_conversions.md](../02_products/lithium_conversions.md) — SLA and deposits
- [../05_team/roles.md](../05_team/roles.md) — RACI
- [../09_daily_ops/improvement_backlog.md](../09_daily_ops/improvement_backlog.md) — backlog

## Commands

```bash
./scripts/sync/run_hcp_sync.sh      # refresh jobs from HCP
./scripts/sync/run_shop_board.sh    # rebuild shop_board.md
```

Morning briefing prompt: [`../../prompts/morning_briefing.md`](../../prompts/morning_briefing.md)
