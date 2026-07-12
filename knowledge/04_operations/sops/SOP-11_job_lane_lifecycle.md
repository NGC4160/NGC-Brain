# SOP-11 — Job Lane Lifecycle (HCP + Whiteboard)

**Owner:** Service Manager (Ryan)  
**Backup:** Office Coordinator (Christine) for intake/ready; techs move their own cards  
**Last verified:** 2026-07-12  
**Applies to:** All NGC locations (same lane names; board size may vary)  
**Status:** Draft — ready for shop pilot

## Purpose

Every open job lives in **one clear lane** on the physical board and in Housecall Pro — so WIP is honest, nothing sits “in progress” for weeks, and the team knows who owns the next move.

## When to use

- Cart arrives, diagnosis starts, parts/deposit wait, repair, QC, ready, or leaves the lot  
- Morning huddle and end-of-day status audit  
- Any time someone asks “where is that cart?”

## Prerequisites

- Physical shop board set up per [shop_whiteboard_layout.md](../shop_whiteboard_layout.md)  
- One **job card per open HCP job** (invoice #)  
- Team knows who may move which cards (below)  
- Optional: digital board `knowledge/.generated/shop_board.md` after HCP sync  

## Hard rules (non-negotiable)

| Do | Do not |
|----|--------|
| One card = one cart = one HCP job | Duplicate cards on desk + floor for the same cart |
| Every DIAG / IN REPAIR / QC card has a tech (T/M/P) by **8:30 AM** | Leave tech blank overnight |
| Update **board and HCP** when the lane changes | Move the card and leave HCP stale (or vice versa) |
| Put blocked jobs in **PARTS / DEPOSIT** | Keep wrenching or fake “in repair” while waiting on money/parts |
| Remove card when HCP = **Complete** | Leave ghost cards on READY for days after cart left |

## The seven lanes

```
INTAKE → DIAG → PARTS/DEPOSIT → IN REPAIR → QC → READY → OUT TODAY → (card off / HCP Complete)
```

| # | Lane | Owner | Enter when | Exit when (done) |
|---|------|-------|------------|------------------|
| 1 | **INTAKE** | Christine → Ryan | Cart scheduled / dropped off; not started | Assigned to DIAG or moved to PARTS if deposit/parts first |
| 2 | **DIAG** | Assigned tech | Tech starts diagnostic path | Complaint verified; estimate path started / approved → PARTS or IN REPAIR |
| 3 | **PARTS / DEPOSIT** | Christine + Ryan | Waiting on deposit (SOP-05) or ordered parts | Deposit posted **and** parts in hand (or stock confirmed) |
| 4 | **IN REPAIR** | Taylor / Marlon (Peyton diag block only) | Active repair / lithium install per estimate | Work complete → QC |
| 5 | **QC** | Assigned tech | Ready for 7-point + test drive / fault clear | Pass → READY; fail → back to IN REPAIR |
| 6 | **READY** | Christine | QC passed | Customer notified; balance arranged; Roy or customer pickup set |
| 7 | **OUT TODAY** | Roy | On today’s pickup/delivery list | Cart off lot → HCP Complete; **remove card** |

**IN REPAIR** is split into rows: **T** (Taylor) · **M** (Marlon) · **P** (Peyton timeboxed only).

### WIP targets (board header)

| Metric | Max | If over |
|--------|----:|---------|
| Active WIP (lanes 2–5) | **6** | Stoplight **red** — no new drop-offs until finish list clears (SOP-12) |
| Lithium in progress | **4** | Prioritize aged Li on finish list; pause new Li starts |
| Needs scheduling (desk) | **5** | Book, callback, or decline within 48 hrs |
| Unassigned in DIAG/REPAIR/QC | **0** by 8:30 AM | Ryan assigns at huddle |

Stoplight: **0–4** green · **5–6** yellow · **7+** red (no new intake).

## Job card (minimum fields)

```
#Invoice    [Li if lithium]
Voltage + brand
Issue (3–5 words)
Tech: T/M/P     Day dots ●●○
$ dep? ☐   Parts? ☐
```

- Blue mark = lithium  
- One day-dot per calendar day in shop; **3+ on lithium = red flag** (finish list)  
- Red clip if lithium >3 days or repair >7 days  

## HCP sync (same language everywhere)

| Board | HCP status | HCP note (add/update) |
|-------|------------|------------------------|
| INTAKE | Needs scheduling / Scheduled | `On board: INTAKE` |
| DIAG | In progress | `On board: DIAG — tech T/M/P` |
| PARTS | In progress | `Waiting deposit` **or** `Waiting parts — ETA ___` |
| IN REPAIR | In progress | `On board: REPAIR — tech T/M` |
| QC | In progress | `On board: QC` |
| READY | In progress | `Ready for pickup` |
| OUT TODAY | Scheduled | `Roy delivery/pickup [date]` |
| Done | **Complete** | Card removed from board |

Sync moments: **open (with huddle), lunch if big moves, close (EOD audit).**

## Who moves the card

| From → To | Who moves |
|-----------|-----------|
| (new) → INTAKE | Christine |
| INTAKE → DIAG | Ryan / assigned tech at start |
| DIAG → PARTS | Tech or Christine when estimate needs deposit/parts |
| PARTS → IN REPAIR | Ryan after deposit cleared + parts ready (SOP-05) |
| IN REPAIR → QC | Tech when wrench work done |
| QC → READY | Tech after pass; tell Christine |
| QC → IN REPAIR | Tech if fail |
| READY → OUT TODAY | Christine when Roy/customer pickup is today |
| OUT TODAY → off board | Roy/Christine when cart gone; Ryan/Christine Complete in HCP |

## Daily rhythm (lane hygiene)

### 8:00 — Christine (≈10 min)

1. New arrivals → **INTAKE** cards  
2. Deposit waits → **PARTS** + `$ dep?`  
3. **READY** → notify customers; move today’s Roy jobs to **OUT TODAY**  
4. Clear desk **needs scheduling** toward max 5  

### 8:15 — Ryan huddle (≈10 min) — ties to SOP-10

1. Count WIP lanes 2–5; set stoplight  
2. Assign tech on every DIAG / IN REPAIR / QC card  
3. Set **TODAY’S FINISH LIST** (max ~4 cards; aged lithium first)  
4. Flag Peyton-only cards  
5. Match HCP notes to board  

### During day — Techs

Move your card when the work state changes. If blocked on money or parts → **PARTS**, not IN REPAIR.

### 4:45 — Ryan EOD (≈5 min) — ties to SOP-13

1. Every open job: correct lane + tech or INTAKE/PARTS/READY  
2. HCP notes match board  
3. OUT TODAY cleared for carts that left; Complete those jobs  
4. Update header WIP for tomorrow  
5. No unassigned overnight in DIAG/REPAIR/QC  

## Lane exit criteria (quick check)

| Lane | Do not leave until… |
|------|---------------------|
| INTAKE | Tech assigned and work type known (diag vs repair vs lithium) |
| DIAG | Findings noted; customer estimate/terms path started |
| PARTS | `Deposit received` (if required) **and** parts available |
| IN REPAIR | Scope on estimate finished (or change order approved) |
| QC | 7-point + test drive; codes cleared / docs saved as required |
| READY | Customer notified |
| OUT TODAY | Cart gone + HCP Complete |

## Exceptions

| Situation | Action |
|-----------|--------|
| Customer drop-off for lithium with no deposit | **PARTS** immediately — do not IN REPAIR |
| Waiting on customer approval only (no parts) | Stay DIAG or PARTS with note `Waiting approval` — not IN REPAIR |
| Comeback | New card or clear note on existing job; SM decides lane (usually DIAG) |
| Board and HCP disagree | **Board wins for the floor today**; fix HCP same day |
| Too many READY carts | Christine notifies / collects; do not hide them in IN REPAIR |
| Soft open / second site | Same lane names; start with half WIP limits (SOP-92) |

## Done when (exit criteria for this SOP)

- Any teammate can point to a cart’s lane in under 10 seconds  
- WIP count on the header matches cards in lanes 2–5  
- Zero unassigned DIAG/REPAIR/QC cards after 8:30 AM  
- No job older than 7 days still tagged generic “in progress” without a PARTS/READY/waiting note  

## Related

- [shop_whiteboard_layout.md](../shop_whiteboard_layout.md) — board build & card template  
- [shop_throughput.md](../shop_throughput.md) — WIP math, lithium tracker  
- SOP-05 Deposit · SOP-10 Morning huddle · SOP-12 WIP stop rule · SOP-13 EOD audit · SOP-32 Lithium day tracker  
