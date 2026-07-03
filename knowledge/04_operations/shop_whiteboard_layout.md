# Shop Whiteboard Layout

**Last verified:** 2026-06-28  
**Owner:** Ryan · **Used by:** Ryan, Taylor, Marlon, Christine, Roy  
**Pairs with:** [shop_throughput.md](shop_throughput.md) · HCP job statuses · `knowledge/.generated/shop_board.md`

---

## Purpose

One wall board the whole team reads at 8:15. **Physical board = truth on the floor.** HCP updates at open, lunch, and close so the digital board matches.

---

## Board spec

| Item | Recommendation |
|------|----------------|
| Size | **4×6 ft** minimum (or two 3×4 boards side by side) |
| Location | Shop floor — visible from bays **and** office door |
| Surface | Whiteboard or magnetic whiteboard |
| Columns | **7 lanes** (tape lines, ~8–10 in wide each on 6 ft board) |
| Cards | **3×5 index cards**, cut in half → 2.5×3 in magnets on back |
| Pens | Black (cards), red (overdue), blue (lithium), green (ready) |

---

## Full layout (top → bottom)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  NGC SHOP BOARD — Mon ___ / ___ / ___          WIP: __/6    Li: __/4    Updated: _____ AM   │
├──────────┬──────────┬──────────┬─────────────────────┬──────────┬──────────┬──────────────┤
│ 1 INTAKE │ 2 DIAG   │ 3 PARTS  │ 4 IN REPAIR         │ 5 QC     │ 6 READY  │ 7 OUT TODAY  │
│  (max 3) │  (max 2) │  (max 4) │  T:___ M:___ P:___  │  (max 2) │  (max 4) │  Roy route   │
├──────────┴──────────┴──────────┴─────────────────────┴──────────┴──────────┴──────────────┤
│ TODAY'S FINISH LIST (Ryan sets at huddle — max 4 cards total)                               │
│  [ ] _____________   [ ] _____________   [ ] _____________   [ ] _____________             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Column details

| # | Lane | WIP max | Who moves cards | HCP equivalent |
|---|------|--------:|-----------------|----------------|
| 1 | **INTAKE** | 3 | Christine → Ryan | Needs scheduling / scheduled (not started) |
| 2 | **DIAG** | 2 | Assigned tech | In progress (diagnostic) |
| 3 | **PARTS / DEPOSIT** | 4 | Christine + Ryan | In progress — note "waiting deposit" or "waiting parts" |
| 4 | **IN REPAIR** | 3 per tech | Taylor / Marlon | In progress |
| 5 | **QC** | 2 | Assigned tech | In progress — final test drive |
| 6 | **READY** | 4 | Christine | In progress — ready for pickup |
| 7 | **OUT TODAY** | — | Roy | Scheduled pickup/delivery (today only) |

**IN REPAIR** column is split into three rows on the board (label with tape):

```
IN REPAIR
  T — Taylor
  M — Marlon
  P — Peyton (diag block only)
```

---

## Job card template

Write **one card per cart**. Shop floor uses invoice # and cart — not required to write customer name (Christine’s desk copy can have name).

```
┌─────────────────────────┐
│ #17321          [Li]    │  ← blue dot/stripe if lithium
│ 48V Club Car            │
│ diag → no start         │
│ Tech: M    Day: ●●○     │  ← fill dot per day in shop (max 3 for Li)
│ $ dep? ☐   Parts? ☐     │
└─────────────────────────┘
```

| Field | Rule |
|-------|------|
| **Invoice #** | Top left — matches HCP |
| **[Li]** | Blue marker if lithium conversion |
| **Cart** | Voltage + brand (48V Club Car, 36V EZGO, etc.) |
| **Issue** | 3–5 words max |
| **Tech** | T / M / P — **blank = not allowed overnight** |
| **Day dots** | One dot per calendar day in shop; **3+ dots on Li = red flag** |
| **$ dep / Parts** | Check when cleared; card stays in PARTS until both done |

**Overdue:** Red clip or red corner fold if lithium >3 days or repair >7 days.

---

## Color code (tape on column headers)

| Color | Column | Meaning |
|-------|--------|---------|
| Gray | 1 INTAKE | Not started |
| Yellow | 2 DIAG | Clock running — diagnostic $179 applies |
| Orange | 3 PARTS | Blocked — do not start repair |
| Blue | 4 IN REPAIR | Active wrench time |
| Purple | 5 QC | Test drive / 7-point / CPF |
| Green | 6 READY | Call customer / collect balance |
| Black | 7 OUT TODAY | Roy’s manifest only |

---

## Daily use

### Christine — 8:00 AM

1. New drop-offs → **INTAKE** card (invoice # from HCP)
2. Move card to **PARTS** if waiting deposit; mark `$ dep?`
3. **READY** → notify customer; move to **OUT TODAY** if Roy delivering
4. Erase **OUT TODAY** column at end of day

### Ryan — 8:15 AM huddle (10 min)

1. Count WIP in columns 2–5 — if **>6**, no new INTAKE until it drops
2. Assign **T/M/P** on every card in DIAG, IN REPAIR, QC
3. Write **TODAY'S FINISH LIST** (2–4 jobs max)
4. Red-flag lithium with 3+ day dots — those go to finish list first
5. Sync HCP assignments and notes

### Techs — when work changes

- Start diag → move to **DIAG**
- Waiting on customer or parts → **PARTS** (update HCP note)
- Wrenching → **IN REPAIR** on your row
- Done but not road-tested → **QC**
- Road test pass → **READY**; tell Christine

### Roy — after huddle

- Copy **OUT TODAY** to clipboard or phone list (invoice # + address zone N/S/40+)
- Pick up from **READY** when customer paid or approved

### Ryan — 4:45 PM

- Every card has a tech assigned or is in INTAKE/PARTS/READY
- HCP statuses match board
- WIP count on header updated for tomorrow

---

## WIP stoplight (header)

Write daily in top-right corner:

| WIP (cols 2–5) | Action |
|----------------|--------|
| **0–4** | Green — normal booking |
| **5–6** | Yellow — lithium OK only if kit in stock |
| **7+** | Red — **no new drop-offs** until finish list clears |

---

## Christine desk strip (optional 2×3 ft board)

If the main board is shop-only, Christine keeps a narrow **intake strip** at the front desk:

```
NEEDS SCHEDULE  →  SCHEDULED TODAY  →  WAITING CALLBACK
     (max 5)            (date)              (name + phone)
```

When a cart **arrives**, card moves to the **big board INTAKE** — not duplicated on both.

---

## HCP sync cheat sheet

Post this small legend next to the board:

| Board column | HCP status | Note to add in HCP |
|--------------|------------|-------------------|
| INTAKE | Needs scheduling / Scheduled | "On board: INTAKE" |
| DIAG | In progress | "On board: DIAG — tech T/M/P" |
| PARTS | In progress | "Waiting deposit" or "Waiting parts — ETA ___" |
| IN REPAIR | In progress | "On board: REPAIR" |
| QC | In progress | "On board: QC" |
| READY | In progress | "Ready for pickup" |
| OUT TODAY | Scheduled | "Roy delivery/pickup [date]" |

When job is done: **Complete** in HCP, **remove card** from board (archive stack by week for audit).

---

## Setup checklist (one-time)

- [ ] Mount board visible from bays
- [ ] Tape 7 columns + IN REPAIR sub-rows (T / M / P)
- [ ] Color tape on headers
- [ ] Pack of index cards + magnet dots + red clips
- [ ] Print card template (above) and tape to side of board
- [ ] Walk team 15 min — who moves cards when
- [ ] Audit existing jobs: one card per open HCP job, correct column
- [ ] Set WIP stoplight from current count

---

## First-week goal

| Day | Target |
|-----|--------|
| Mon | Every open job has a card; WIP count honest |
| Tue | Zero unassigned cards overnight |
| Wed | HCP notes match board columns |
| Thu | Lithium cards all ≤3 day dots or on finish list |
| Fri | WIP ≤6; review in weekly review |

---

## Related

- [shop_throughput.md](shop_throughput.md) — limits and rhythm
- [shop_workflow.md](shop_workflow.md) — customer journey
- [../05_team/roles.md](../05_team/roles.md) — who owns each lane
