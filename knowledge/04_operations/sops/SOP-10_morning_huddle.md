# SOP-10 — Morning Huddle & Board Update

**Owner:** Service Manager (Ryan)  
**Attendees:** Taylor, Marlon (required); Christine joins for deposits/OUT TODAY; Roy for route handoff; Peyton when scheduled  
**Last verified:** 2026-07-12  
**Applies to:** All NGC locations (same agenda; times may shift with hours)  
**Status:** Draft — ready for shop pilot

## Purpose

Start every shop day with a **10-minute** huddle so every cart has an owner, today’s finish list is real, lithium SLA risk is visible, and WIP stoplight controls new intake.

## When to use

Every operating day, **~8:15 AM**, at the physical shop board.  
Skip only if the shop is closed. If Ryan is out, the backup lead still runs the same agenda.

## Prerequisites

- Christine’s **8:00** desk pass done (or in progress): needs scheduling, deposits, Roy list — see below  
- Board cards current from prior EOD (SOP-11 / SOP-13)  
- Optional: `knowledge/.generated/shop_board.md` or morning briefing after HCP sync  
- Deposit alerts available if used (`deposit_alerts.md`)  

## Hard rules (non-negotiable)

| Do | Do not |
|----|--------|
| Finish huddle with **every** DIAG / IN REPAIR / QC card assigned (T/M/P) | Leave tech blank “we’ll figure it out later” |
| Set a **finish list** (max ~4 cards) | Pretend everything on the board is today’s priority |
| Count WIP and set stoplight | Book new drop-offs when stoplight is red without clearing WIP |
| Put aged **lithium (3+ day dots)** on the finish list first | Start new lithium while Day 3+ Li carts sit |
| Keep huddle to **~10 minutes** | Turn it into a 45-minute staff meeting |

## Pre-huddle — Christine (8:00, ≈10 min)

Do this **before** or as Ryan walks the board:

1. Clear **needs scheduling** toward max **5** (book, callback, or waitlist).  
2. Confirm deposits on **PARTS** cards — chase per SOP-05.  
3. Build Roy’s pickup/delivery list (zone batched: North Shore free vs South Shore / outside **$99**).  
4. Move today’s deliveries to **OUT TODAY**; notify READY customers if not already.  
5. Tell Ryan: deposit blockers + anything that must leave today.  

## Huddle agenda (8:15, ≈10 min)

Stand at the board. Ryan leads; techs answer only when asked about their cards.

### 1. WIP count & stoplight (1 min)

Count cards in lanes **2–5** (DIAG + PARTS + IN REPAIR + QC).

| WIP | Stoplight | Booking rule today |
|----:|-----------|--------------------|
| 0–4 | **Green** | Normal intake |
| 5–6 | **Yellow** | New lithium only if kit in stock + SM OK |
| 7+ | **Red** | **No new drop-offs** until finish list clears (SOP-12) |

Also count lithium cards → target max **4** in progress.

Write on board header: `WIP: __/6   Li: __/4   Updated: __ AM`

### 2. Assign every active card (3 min)

For each card in DIAG, IN REPAIR, QC:

- Write **T / M / P**  
- Blank tech after huddle = **failure** — fix before leaving the board  
- Peyton only when trigger applies (below) — timeboxed block, not open WIP  

**Peyton triggers (any one):**

- Intermittent after standard diag  
- Controller/monitor programming beyond handheld reset  
- Repeated comeback on same electrical complaint  
- Fleet/HOA multi-cart pattern  

### 3. Today’s finish list (3 min)

Write up to **4** invoice #s on **TODAY’S FINISH LIST**.

Priority order:

1. Lithium with **3+ day dots** or past SLA  
2. READY / OUT TODAY money or customer waits (Christine/Roy)  
3. Jobs that unblock bay space (QC almost done, parts just arrived)  
4. Other repairs on estimate  

Planning guide: about **2 lithium starts max** on a lithium-heavy day; mix smaller jobs only if WIP allows.

Techs leave huddle knowing their #1 and #2 for the morning.

### 4. Parts / deposit blockers (2 min)

- Which PARTS cards are **waiting deposit** vs **waiting parts**?  
- Christine: who gets called/texted first (SOP-05)  
- Ryan: what can be ordered **today** only if deposit cleared  
- Do **not** move PARTS → IN REPAIR without deposit + parts (SOP-05 / SOP-11)  

### 5. Roy + Christine close (1 min)

- Confirm **OUT TODAY** list and zone fees  
- Any READY cart without customer notify → Christine does it first  
- Huddle ends — techs to bays  

### Optional — digital sync (if used)

- Glance `shop_board.md` / morning briefing for HCP jobs missing cards  
- Add missing cards same morning — board is floor truth  

## Huddle script (Ryan)

> WIP is [N] — stoplight [green/yellow/red].  
> Lithium at risk: [invoice #s].  
> Finish list today: [1] [2] [3] [4].  
> Taylor you’re on […]. Marlon you’re on […].  
> Peyton block if any: […].  
> Christine — deposits and READY. Roy — OUT TODAY. Let’s go.

## Done when (exit criteria)

| Check | Pass |
|-------|------|
| Tech assigned | Zero blank T/M/P on DIAG / IN REPAIR / QC |
| Finish list | 1–4 cards written; aged Li included if any |
| Stoplight | Header updated; Christine knows booking rule |
| PARTS | Deposit vs parts wait labeled; chase owners clear |
| OUT TODAY | Roy has today’s list |
| Time | Huddle ≤ ~12 minutes |

## Exceptions

| Situation | Action |
|-----------|--------|
| Ryan late / out | Designated lead runs same agenda; text Ryan finish list photo |
| Tech out | Reassign that row’s cards before finish list; do not leave orphans |
| Red stoplight | Christine stops new drop-offs; waitlist only (SOP-12) |
| Emergency walk-in | SM only — bump finish list consciously, don’t ignore WIP math |
| No lithium in shop | Still run huddle — repair WIP and READY matter |
| Board wrong vs HCP | Fix board for today; fix HCP by lunch or EOD (SOP-11) |

## Who does what

| Step | Ryan | Christine | Techs | Roy |
|------|:----:|:---------:|:-----:|:---:|
| Pre-huddle desk | I | **R** | — | Gets list |
| WIP / assign / finish list | **R** / **A** | C | Confirm load | — |
| Deposit chase | C | **R** | — | — |
| Execute finish list | A | READY notify | **R** | OUT TODAY |

## Location variables

Huddle clock time follows shop open (default Covington **8:15** after **8:00** desk pass). Lane names and WIP caps are company-wide.

## Related

- [shop_throughput.md](../shop_throughput.md) — capacity math  
- [shop_whiteboard_layout.md](../shop_whiteboard_layout.md) — board layout  
- SOP-11 Lanes · SOP-12 WIP stop · SOP-13 EOD · SOP-05 Deposit · SOP-27 Peyton · SOP-32 Lithium tracker  
- Prompt: [`prompts/morning_briefing.md`](../../../prompts/morning_briefing.md)  
