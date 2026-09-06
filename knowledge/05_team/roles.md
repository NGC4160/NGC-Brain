# Team & Roles

**Last verified:** 2026-09-06

## Ownership

| Name | Role | Ownership |
|------|------|-----------|
| Ryan White | Service manager | 50% owner |
| Christine White | Co-owner / part-time assistant | 50% owner |

## Staff

| Name | Role | Responsibilities |
|------|------|------------------|
| **Ryan White** | Service manager | Technician oversight, diagnostics, training, QC, owner-level pricing/warranty exceptions |
| **Jesse** | Administrative assistant / service coordinator | **Primary shop operations coordinator** (she/her) — see scope below |
| **Christine** | Part-time assistant (co-owner) | Backup coverage when Jesse is out; owner-level exceptions |
| **Hayden Silva** | Driver / Shop Technician Assistant | **Primary driver** — pickups and deliveries Jesse routes. **Secondary** shop / mechanical / tech-assist / errands only when transport and management priorities allow. Official SOP: **NGC-OPS-DRIVER-09032026R0** in Drive [Procedures](https://drive.google.com/drive/folders/1-NjzSQxTsbXqlOhbK7ptZzg1H5G2ntdh) — [driver_sop.md](../04_operations/driver_sop.md). **Not** an independent diagnostic tech. |
| **Marlon** | Golf cart technician | In-shop repair and service. Official SOP: **NGC-OPS-TECH-092026R0** (Sep 2026) in Drive [Procedures](https://drive.google.com/drive/folders/1-NjzSQxTsbXqlOhbK7ptZzg1H5G2ntdh) — [technician_sop_sep2026.md](../04_operations/technician_sop_sep2026.md). |
| **Ryan Gorgoglione** | Golf cart technician | In-shop repair and service (not the owner — that is Ryan White). Official SOP: **NGC-OPS-TECH-092026R0** — [technician_sop_sep2026.md](../04_operations/technician_sop_sep2026.md). |

## Former (do not assign work)

Do not schedule, assign, or quote these names as current staff.

| Name | Status | As of |
|------|--------|-------|
| **Roy Gautreaux** | Off roster | 2026-09-03 |
| **Taylor** | Terminated | 2026-08-22 |
| **Peyton** | Resigned | 2026-08-22 |

## External

| Name | Role | Firm |
|------|------|------|
| **Jessica** | Bookkeeper (QBO) | Griffin & Furman |

## Grok Bot roster (live)

**Do not invent extra bots.** Chief is Ryan’s **only** point of contact. All other bots report to Chief. Approvals go through Chief, who asks Ryan: Slack to Jesse, money, payroll submit, sign-in, delete a bot, orders, **CartScope app changes**.

| Bot | Role |
|-----|------|
| **Chief** (COS) | id `4bfa99c8-c29c-4149-a4ea-1a404d61f5a1` — Ryan’s only POC. Routes every task (see below). Collects weekday 11am America/Chicago lead forms, then asks Ryan before Slack to Jesse. |
| **Inbox** | Intake / mail. Must **not** auto-Slack Jesse because lithium “stays with Jesse.” Lead forms only from **NGC985 / ryan@ / contact@**. |
| **Shop** | **Housecall Pro owner** — jobs, estimates, price book, line items, taxable flags, pricing/margin checks, dispatch/WIP. |
| **Diagnostics** | Evidence-first diagnostic support — known-good / known-faulted library and case write-ups in [`../diagnostics/README.md`](../diagnostics/README.md). Supports techs (**TEST BEFORE REPLACEMENT**); does **not** replace hands-on tests. Does **not** own HCP jobs (Shop owns HCP). |
| **Front Desk** | Customer replies (lithium kit/warranty from `customer_reply_standard.md`) |
| **Parts** | Parts / deposit-before-order |
| **Books** | Books coordination |
| **Betty** | HR |
| **CFO** | Finance |
| **Marketing** | Marketing |
| **IT** | IT |
| **Call Coach** | Call coaching |
| **Print** | Blake birdhouses — **not** NGC shop process. Live repo: [NGC4160/PersonalProjects](https://github.com/NGC4160/PersonalProjects). |
| **Bot Manager** | Create / manage bots only. **Never delete a bot** without Ryan (via Chief). |

### Chief routing (standing)

**Confirmed 2026-09-01 by Ryan White.** This is standing, not a one-off.

Ryan talks **ONLY** to Chief. He should never have to message another shop bot or hunt another chat.

On **EVERY** task Ryan asks: Chief immediately decides which bot is appropriate and **PASSES** the work to that bot. Then Chief brings the result back to Ryan in **Chief’s thread**.

Do **not** start specialist work first and hand off later. If no bot owns the job, tell Ryan a new bot is worth creating and why. Do **not** quietly become Shop / Parts / Books.

**Chief’s own work only:** talking to Ryan; yes/no approvals (Slack Jesse, money, payroll, sign-in, **CartScope Tester change plans**); writing facts back to Brain the **same day** Ryan corrects them; routing.

**Lanes (already true):** Shop owns HCP (jobs, estimates, price book, line items, taxable flags, pricing/margin, dispatch/WIP). **Diagnostics** owns the diagnostic evidence library (known-good / known-faulted / cases) and supports techs on test-before-replacement. Parts, Books, Betty, Inbox, Front Desk, CFO, IT, Marketing, and the rest keep their lanes.

Ask Ryan before any Slack to Jesse. Results stay in Chief’s thread.

**Standing rules:** NGC-Brain (`knowledge/`) is source of truth; write durable facts back the same day Ryan corrects them. Updates to Ryan or Chief = **bullet lists**. Ask Ryan before any Slack to Jesse Killian. **Parts updates** (Chief → Jesse Slack): five fields only — see [daily ops](../09_daily_ops/README.md#bot-slack-to-jesse). **CartScope app changes:** CartScope Tester presents a change plan and gets Ryan’s yes through Chief before implementing — [cartscope.md](../06_systems/cartscope.md). **No** HCP customer-message watching. See [daily ops](../09_daily_ops/README.md).

The deposit-alert **batch script** in `scripts/admin_bot/` is planned/live automation — **not** a Grok Bot and **not** the COS. Spec: [ngc_admin_bot_spec.md](../10_automation/ngc_admin_bot_spec.md).

## Jesse — scope (current)

Jesse owns day-to-day coordination so Ryan can stay on diagnostics, training, and QC. She handles the majority of work Christine previously did **plus**:

| Area | What she owns |
|------|----------------|
| Front office | Phones, intake, deposits, customer updates, HCP wait codes |
| Estimating | Standard **and advanced** estimates in HCP from tech findings + pricebook. **Credit card surcharge on every estimate**; recalc to the final total before invoice or payment (do not invent a %) |
| Pricebook | Maintenance in Housecall Pro (add/edit/deactivate lines; Ryan approves new rates) |
| Inventory | Parts/stock visibility, counts, QBO/HCP alignment |
| Parts | Ordering, vendor follow-up, ETA tracking, deposit gate before order |
| Shop workflow | Board/HCP hygiene, lane movement, WIP visibility, finish-list support. On approved deposit jobs: **COPY TO JOB** → **Awaiting Deposit** → **Need to Order** → **Waiting for Materials** ([shop_workflow.md](../04_operations/shop_workflow.md)) |
| Pickup / delivery | Routing and scheduling for Hayden Silva (zones, batching, $99 vs free) |
| Data & reporting | Shop metrics, deposit/parts queues, weekly numbers Ryan needs |
| And more | Other coordinator work as the shop needs it |

**Escalate to Ryan White:** wrench work, diagnostic calls, warranty/courtesy write-offs, discounts, angry/fleet fights, ad strategy, payroll/banking. Christine covers when Jesse or Ryan White is out.

## Driver / Shop Technician Assistant — scope (current)

**Filled: Hayden Silva.** Official package: **NGC-OPS-DRIVER-09032026R0** (effective 2026-09-03, Rev. R0). Full text is the staff master PDF in Drive [Procedures](https://drive.google.com/drive/folders/1-NjzSQxTsbXqlOhbK7ptZzg1H5G2ntdh): [NGC-OPS-DRIVER-09032026R0 Driver Shop Technician Assistant SOP.pdf](https://drive.google.com/file/d/13ZJ9FxUQFD_d9yvVRfr6Ae2xE9P6hsk2/view) (file id `13ZJ9FxUQFD_d9yvVRfr6Ae2xE9P6hsk2`). Brain summary: [driver_sop.md](../04_operations/driver_sop.md).

| Priority | What this role owns |
|----------|---------------------|
| **1 — Driver** | Pickup, loading/securement, transport, delivery that Jesse routes |
| **2 — Shop assist** | Mechanical / tech-assist / errands **only** when transport and management priorities allow |

**Not this role:** independent diagnostics, diagnostic calls, or unsupervised tech work. Those stay with Ryan White / Marlon / Ryan Gorgoglione.

**Roy Gautreaux** is off roster as of 2026-09-03.

## RACI summary

| Function | Primary | Backup |
|----------|---------|--------|
| Customer phone / scheduling | Jesse | Christine (part-time) |
| Estimates (standard + advanced) | Jesse | Ryan White (exceptions only) |
| Deposits & payment collection | Jesse | Christine |
| Pricebook maintenance | Jesse | Ryan White (rate approval) |
| Inventory | Jesse | Ryan White |
| Parts ordering & tracking | Jesse | Ryan White |
| Shop workflow management | Jesse | Ryan White |
| Data management & reporting | Jesse | Ryan White |
| Pickup/delivery routing & scheduling | Jesse | Hayden Silva (drive) / Christine |
| Pickup & delivery (drive) | Hayden Silva | — |
| Service management / tech oversight | Ryan White | — |
| Shop repair work | Marlon, Ryan Gorgoglione | Hayden Silva (tech-assist only when transport/management allow; **not** independent diag) |
| Bookkeeping | Jessica (Griffin & Furman) | Christine |
| Owner exceptions / warranty / discounts | Ryan White | Christine |

## Hiring

**Phone screen first** (15–20 min) — score transferable electrical/mechanical skill, diagnostic thinking, safety, and coachability. Golf cart experience is a **bonus, not a gate**. Logistics (hours, commute, availability) are cleared via Indeed application questions.

- Printable HTML (Print / Save PDF): `external_docs/templates/hiring/NGC_Technician_Phone_Interview_Scorecard.html`
- PDF copy: `external_docs/templates/hiring/NGC_Technician_Phone_Interview_Scorecard.pdf`
- Guide / regenerate: `external_docs/templates/hiring/README.md`
- **Command Center:** Documents → Technician Phone Interview Scorecard (hub: `documents/index.html`)

**Shop evaluation** for phone-screen ADVANCE candidates (~3–4 hours):

- Hands-on scorecard: `external_docs/templates/hiring/NGC_Technician_Hands_On_Eval_Scorecard.pdf`
- Written quiz: `external_docs/templates/hiring/NGC_Technician_Hiring_Quiz.pdf` (40Q · 120 pts · pass 75%; answer key separate)
- Live safety gate → written → hands-on stations → troubleshooting
- Same 1–4 scale as phone screen; Hire / Second look / Pass
- **Command Center:** Documents → Hiring (phone, quiz, hands-on)

## Administrative Assistant / Service Coordinator — filled

**Filled 2026-08-15: Jesse (she/her).** Front-office SOPs, KPI scorecard, and Gusto remain the operating pack. Do **not** recruit another admin unless her seat is open.

| Doc | Path |
|-----|------|
| Front-office SOPs (living) | `external_docs/templates/hiring/NGC_Admin_Front_Office_SOPs.md` |
| Weekly KPI + 30/60/90 review | `external_docs/templates/hiring/NGC_Admin_KPI_and_Review.html` |
| Job description (historical + Indeed copy) | `external_docs/templates/hiring/NGC_Admin_Job_Description.md` |
| Phone + desk eval scorecard | `external_docs/templates/hiring/NGC_Admin_Phone_and_Desk_Eval_Scorecard.html` |
| Ryan 2-week time log (hiring gate, historical) | `external_docs/templates/hiring/NGC_Admin_Ryan_Time_Log.html` |
| Pack guide | `external_docs/templates/hiring/README.md` |

Keep Tech #3 recruiting separate — AUTH/PARTS backlog is **not** a technician-capacity trigger.

## Future growth

- Sales and rentals planned after service operations are solid
- DMS migration may add shop-specific roles (service writer, parts counter)

## Personnel counseling

Documented coaching and warnings: [personnel_counseling.md](personnel_counseling.md)  
Template: `external_docs/templates/personnel_counseling/NGC_Personnel_Counseling_Form.html`

## Privacy note

This document intentionally excludes pay rates, personal contact info, and home addresses.
