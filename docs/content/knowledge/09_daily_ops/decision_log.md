# Decision Log

Record business decisions here so the knowledge base stays aligned with reality.  
The AI can append entries when you say **"log this decision: …"**

Format: `YYYY-MM-DD | Decision | Owner | Notes`

---

## 2026

| Date | Decision | Owner | Notes |
|------|----------|-------|-------|
| 2026-06-28 | Shop-only model — no mobile service or trip charges | Ryan | Mobile SOPs archived in `knowledge/archive/` |
| 2026-06-28 | Professional lithium kits only — NGC Conversion line discontinued | Ryan | 36V/48V/MINI/72V/150AH active |
| 2026-06-28 | Warranty: 5 years battery + BMS | Ryan | |
| 2026-06-28 | Free pickup/delivery: 40 mi Northshore; paid flat rate outside/Southshore | Ryan | Exact paid boundary TBD |
| 2026-06-28 | Deposits: $1800 lithium, $800 lead-acid; cover materials + card fees | Ryan | |
| 2026-06-28 | No cart sales/rentals until service shop is solid | Ryan | |
| 2026-06-28 | HCP MAX plan — API sync scripts + MCP path documented | Ryan | See hcp_api_setup.md |
| 2026-06-28 | Diagnostic fee $179 — not waived; applies toward repair on known-issue jobs | Ryan | |
| 2026-07-13 | Paid pickup/delivery flat rate = **$99** | Ryan | Outside 40 mi Northshore or Southshore |
| 2026-07-13 | Free pickup/delivery zone = **40 miles Northshore** (final) | Ryan | Boundary is distance + Northshore; Southshore always paid |
| 2026-07-13 | Keep customer-supplied lithium install at **$549** | Ryan | Active offer; clarify warranty scope on customer packs |
| 2026-07-13 | Morning Sync live — daily HCP + QBO → Command Center | Ryan | 7:30 AM CST; finance knowledge refreshed from API P&L |
| 2026-07-25 | Tech hiring: golf cart experience not required; Indeed handles logistics gates; phone screen scores transferable skill + safety before shop eval | Ryan | Scorecard: `external_docs/templates/hiring/NGC_Technician_Phone_Interview_Scorecard.pdf` |
| 2026-07-25 | Command Center **Documents** zone + hub — all present/future working docs cataloged in `scripts/documents_catalog.py` | Ryan | Hub: `docs/documents/index.html` |
| 2026-07-26 | Hands-on shop eval scorecard added — next step after phone ADVANCE; pairs with 120/120/60 hiring quiz | Ryan | `NGC_Technician_Hands_On_Eval_Scorecard.pdf` |
| 2026-07-26 | Written hiring quiz locked v1.0 — 40Q / 120 pts / 75% pass / ★ safety hard-fail; 8 critique loops | Ryan | `NGC_Technician_Hiring_Quiz.pdf` |
| 2026-07-26 | GarageBuddy cloned as submodule for open-source DMS eval; Command Center Systems + Tools links added | Ryan | `tools/GarageBuddy` · setup: `scripts/garagebuddy/setup.sh` · not production |
| 2026-08-03 | Admin / Service Coordinator hiring pack drafted (time log, JD, phone+desk eval, front-office SOPs, weekly KPI + 30/60/90); new-hire packet via **Gusto** | Ryan | Templates: `external_docs/templates/hiring/NGC_Admin_*` · Board Jul 2026 scope/KPIs |
| 2026-08-15 | **Jesse** (she/her) is Administrative Assistant / Service Coordinator. **Christine** is part-time assistant (still 50% co-owner). Jesse owns day-to-day front office **plus** inventory, parts ordering/tracking, data & reporting, pricebook maintenance, advanced estimating, shop workflow, and pickup/delivery routing. | Ryan | See `knowledge/05_team/roles.md` |
| 2026-08-15 | Bookkeeper is **Jessica at Griffin & Furman** (not Jill Stoltz). | Ryan | QBO / month-end |
| 2026-08-22 | **Taylor** terminated. **Peyton** resigned. Do not assign work to either. | Ryan | See `knowledge/05_team/roles.md` |
| 2026-08-22 | **Ryan Gorgoglione** is a golf cart technician (not the owner). Do not invent hire date, pay, or other HR details. | Ryan | Distinguishes from Ryan White. Marlon remains technician; Roy remains driver; Jesse (she/her) remains service coordinator / admin |
| 2026-08-23 | Full name and title confirmed: **Ryan Gorgoglione**, golf cart technician. | Ryan | Updates the 2026-08-22 roster entry; still no hire date, pay, or other HR details |
| 2026-08-23 | Approved work that needs a parts deposit follows the existing HCP job pipeline only: **COPY TO JOB** → **Awaiting Deposit** → (deposit received) **Need to Order** → (parts ordered) **Waiting for Materials**. After approval, queue pickup or drop-off. Do not say lock a time, hold a spot, or easy yes. Deposit required before ordering battery/motor/controller. | Ryan | See `shop_workflow.md` / `tools.md`. Repo had no prior HCP column named Need to Order — Ryan’s wording is the stage name. |
| 2026-08-23 | No separate minimum service charge. Work that used to be billed as a minimum service charge is billed as diagnostic. | Ryan | Diagnostic fee itself unchanged ($179). Do not quote a separate MSC. See `shop_services.md` / `pricebook_reference.md`. |
| 2026-08-23 | Lithium customer replies: kit is LiFePO4 battery + charger + monitor only. Vatrer packs; inspect, test, and tune every lithium install. Battery + BMS = **5-year full replacement**. Convenience package is HCP `3.0-NGC Lithium Conversion Convenience Package` at **$599 plus tax** (AC charge port + 15' cord; 20A key-switched 48V-to-12V DC/DC; 6-position 12V fuse box). No EcoBoost unless that exact line is on the live estimate. No shop phone on these replies — close Thanks / Neighborhood Golf Carts team. Do not invent turnaround unless asked. Do not say lock a time / hold a spot / easy yes. | Ryan White | See `customer_reply_standard.md` / `lithium_conversions.md`. HCP Professional Kit descriptions still list a longer kit — do not use that list in customer answers. CSV export is missing the convenience package; live HCP has it. |
| 2026-08-24 | When NGC gets a call for work, we send an estimate for approval. If the customer approves it, they go in the queue for pickup or customer drop-off. When there is an opening in the slot, we schedule them. In the HCP jobs pipeline, the stages **New job** and **Customer drop off** ARE that queue. Do not say lock a time, hold a spot, or easy yes. In-shop only (no mobile). Distinct from the parts-deposit pipeline (COPY TO JOB → Awaiting Deposit → Need to Order → Waiting for Materials), which still applies to approved work that needs a parts deposit. | Ryan | See `shop_workflow.md`. Do not expand into a scheduling product. |
| 2026-08-24 | Pickup/drop-off queue order: go by job number unless it makes sense to pick up another cart in the same area on the same run. As of 2026-08-24, **Steve Tresch** is in that queue (**New job** / **Customer drop off**); HCP job **#17444** from the existing jobs export (not invented). Estimate-approval → queue → schedule when there is an opening in the slot. Do not say lock a time, hold a spot, or easy yes. | Ryan | See `shop_workflow.md`. Snapshot will go stale — update when the queue changes. No other customer details. |
| 2026-08-22 | Hard WIP cap of **6 jobs in progress is disregarded**. Do not present 6-in-progress as a non-negotiable limit. Lithium deposit-before-order and other deposit/lithium rules are unchanged. | Ryan | See `shop_throughput.md` / `shop_whiteboard_layout.md` |
| 2026-08-22 | **Chief** (Ryan's Grok Bot COS) and shop bots must operate from this brain and write durable facts back to `knowledge/`. | Ryan | See `knowledge/00_index.md` |
| 2026-08-26 | Every NGC bot must ask Ryan and wait for a yes before any Slack to **Jesse Killian** (DMs, channel posts, or messages-as-Ryan). Not exceptions: lithium jobs, BMS recordings, website leads, estimates, HCP updates. Chief still collects website/Google Ads lead forms weekdays at 11:00 AM America/Chicago, then asks Ryan before Slack to Jesse. Inbox must not auto-Slack Jesse because lithium “stays with Jesse.” | Ryan White | See `knowledge/09_daily_ops/README.md` |
| 2026-08-28 | Every shop bot, including Chief, must send updates as a clean bullet list. No dense paragraph dumps. Applies when reporting to Ryan or to Chief. | Ryan White | See `knowledge/09_daily_ops/README.md` |
| 2026-08-30 | Ryan made the Lithium Conversion Sales Guide the office quoting process (Essential / Ready-to-Run / Accessory-Ready). | Ryan White | Internal quoting only — do not hand the sheet to the customer. Inspect first. Lead with Essential; default talk to Ready-to-Run; Accessory-Ready only when accessories exist or are planned. Do not invent package prices. Do not default-pitch the $599 convenience package (that SKU is all three extras). See `lithium_sales_guide.md`. |
| 2026-08-30 | Credit card surcharge goes on **every estimate** (shop-wide, not lithium-only). Before sending the invoice for payment, or before taking payment from the customer, update the surcharge amount so it matches the final total. | Ryan White | Rate not specified — do not invent a % or $. See `shop_services.md` / `shop_workflow.md`. |

---

## Pending decisions

| Topic | Options | Target date |
|-------|---------|-------------|
| *(none)* | — | — |