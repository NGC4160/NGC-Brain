# Phase 2 review checklist

**Goal:** Create and update work orders in NGC, with a shop status board and deposit gates.

**Live URL:** https://ngc4160.github.io/NGC-Brain/

## What shipped

- **New / edit work orders** from Jobs and Status Board (customer, cart, issue, status, tech, totals, deposits)
- **Status Board** (`#/board`) — columns for Received → Diagnosing → Waiting Parts → In Repair → QA → Ready
- **Deposit gates** before parts / bay work:
  - Lithium: **$1,800**
  - Battery: **$800**
  - Diagnostic: **$179**
  - Motor/controller: half of job total (min $179)
- **Persistence**
  - GitHub Pages: saves on **this device** (browser localStorage)
  - Local DMS (`npm run dev:all`): saves to **SQLite** via `/api/dms/jobs`
- Agent Input status updates write through the same store

## Please verify on your phone

1. Open https://ngc4160.github.io/NGC-Brain/
2. Bottom nav shows **Home · Board · Jobs · Input · AR · More**
3. Board → **New job** → create a cart; it appears in Received
4. Move a job with unpaid lithium/battery deposit into **Waiting Parts** or **In Repair** — expect a block (or use override)
5. Jobs list → tap a job → edit and save
6. Refresh the page — your new/edited jobs should still be there on that phone

## Notes

- Pages is static: writes do **not** sync across phones unless you run the local API
- HCP-imported jobs still appear; NGC-created jobs use `wo_*` / `wo_local-*` ids
- Accounting remains in QBO for Griffin & Furman, LLC (Phase 5)

## Out of scope (later phases)

- Customer CRM (Phase 3)
- Pricebook & inventory (Phase 4)
- Live QBO sync (Phase 5)
- Scheduling (Phase 6)

Reply **approve Phase 2** to unlock Phase 3, or list changes you want first.
