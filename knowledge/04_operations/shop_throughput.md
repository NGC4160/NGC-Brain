# Shop Throughput

**Last verified:** 2026-08-23  
**Owner:** Ryan (service manager)  
**Live board:** `knowledge/.generated/shop_board.md` (regenerate after HCP sync)

## Goal

Move carts through the shop predictably — especially **lithium conversions in 2–3 days** — without overloading the shop team.

## Current constraints

| Resource | Capacity (planning) |
|----------|-------------------|
| Marlon + Ryan Gorgoglione | Two golf cart technicians; ~6 productive hrs/day each |
| Roy | Pickup/delivery — batch by zone, not one-off all day |
| Jesse | Intake, deposits, parts/inventory, workflow, Roy routing (Christine part-time backup) |
| Shop hours | Mon–Fri 8–5 |

**Planning math:** One Professional lithium kit ≈ **6 hours**. Plan **at most 2 lithium starts per day** if the shop is lithium-heavy; mix in smaller jobs around the lithium SLA, not a headcount cap.

**Do not use a hard 6-in-progress cap.** That limit is **disregarded** (2026-08-22). Ryan decides intake from the floor, not an automatic stop at 6.

## Planning targets (not a 6-job booking stop)

| Lane | Target | Why |
|------|--------|-----|
| In progress (all jobs) | **No hard cap** | Former 6-job WIP cap is disregarded — do not present 6 as a non-negotiable limit |
| In progress (lithium) | **4** | Protect 2–3 day promise |
| Needs scheduling | **5** | Jesse queue; book or decline within 48 hrs |
| Unassigned in progress | **0** | Every cart has an owner by **8:30 AM** |

When the **lithium** lane is full or the schedule queue is overflowing: finish or date oldest lithium jobs, or book/decline the Jesse queue within 48 hrs. Deposit **before** ordering batteries, motors, or controllers still applies. Do **not** auto-stop all drop-offs just because total in-progress is above 6.

## Shop lanes (HCP + floor)

Use these **shop-floor** lanes on the physical board (and in HCP notes when useful). They are **not** HCP job pipeline stage names.

```
INTAKE → DIAGNOSE → WAITING DEPOSIT/PARTS → IN REPAIR → QC/TEST DRIVE → READY → CLOSED
```

For **approved work that needs a parts deposit**, move the HCP **job pipeline** through these existing stages only (Ryan White, 2026-08-23) — do not invent others:

**COPY TO JOB** → **Awaiting Deposit** → (deposit received) **Need to Order** → (parts ordered) **Waiting for Materials**

Ryan said **Need to Order**. The repo had no prior HCP column with that name; the floor lane above stays `WAITING DEPOSIT/PARTS`. Full rule: [shop_workflow.md](shop_workflow.md).

| Lane | Who owns | Exit criteria |
|------|----------|---------------|
| Intake / needs scheduling | Jesse | Appointment booked or cart in bay |
| Diagnose | Assigned tech | Complaint verified, estimate approved |
| Waiting deposit/parts (floor) | Jesse | HCP pipeline: **Awaiting Deposit** → **Need to Order** → **Waiting for Materials**. Deposit collected **before** battery/motor/controller order; Jesse orders and tracks parts |
| In repair | Marlon / Ryan Gorgoglione | Work complete per estimate |
| QC | Assigned tech | 7-point safety + test drive; fault codes cleared |
| Ready | Jesse | Customer notified; balance collected or arranged |
| Pickup/delivery | Roy | Cart off lot |

## Daily rhythm

### 8:00 — Jesse (10–15 min)

- Clear **needs scheduling** queue: book, callback, or waitlist
- Confirm deposits; move HCP pipeline **Awaiting Deposit** → **Need to Order** when paid; order/track parts, then **Waiting for Materials**
- After new approvals: **COPY TO JOB**, stage **Awaiting Deposit**, queue pickup or drop-off (do not lock a time / hold a spot / easy yes)
- Set Roy’s pickup/delivery route (zone batched; free vs $99)
- Flag WIP / AUTH / PARTS counts for Ryan’s huddle

### 8:15 — Ryan shop huddle (10 min)

- Read `knowledge/.generated/shop_board.md`
- Assign every in-progress cart to **Marlon or Ryan Gorgoglione**
- Name **today’s finish list** (max 2 lithium + 2–4 repairs per tech)
- Flag complex electrical / comeback jobs for **Ryan** with one-line symptom (controller, intermittent, data log needed)

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

## Complex diagnostics (escalate to Ryan)

Peyton is **no longer on the team** (resigned 2026-08-22). Keep the job on the assigned shop tech unless **any** apply — then escalate to **Ryan White**:

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
| In progress count (Fri AM) | Report the count — **no ≤6 target** |
| Needs scheduling count (Fri AM) | ≤ 5 |
| Jobs closed per tech per week | Trend up as stale WIP drops |

## Known bottlenecks (from HCP snapshot)

As of last sync, the pipeline showed **heavy stale WIP** (many in-progress jobs 15+ days) and **11 needs scheduling**. Treat that as a **status hygiene + intake** problem first — throughput cannot improve until HCP reflects reality. Do **not** re-impose a 6-job in-progress cap.

**Immediate actions:**

1. Audit every **in progress** job older than 7 days — complete, waiting parts, or correct status
2. Assign all unassigned in-progress jobs
3. Prioritize lithium jobs over 3 days
4. Pause new lithium booking until at-risk lithium clears (if bays are full)

## Physical board

See [shop_whiteboard_layout.md](shop_whiteboard_layout.md) — 7-column layout, job cards, color code, and HCP sync cheat sheet.

## Related docs

- [shop_workflow.md](shop_workflow.md) — customer journey
- [../02_products/lithium_conversions.md](../02_products/lithium_conversions.md) — SLA and deposits
- [../05_team/roles.md](../05_team/roles.md) — RACI
- [../09_daily_ops/improvement_backlog.md](../09_daily_ops/improvement_backlog.md) — backlog

## Commands

```bash
./scripts/sync/run_hcp_sync.sh      # refresh jobs from HCP
./scripts/sync/run_shop_board.sh    # rebuild shop_board.md
```

Morning briefing prompt: [`../../prompts/morning_briefing.md`](../../prompts/morning_briefing.md)
