# NGC SOP Catalog — Build the Operating System

**Last verified:** 2026-07-12  
**Owner:** Ryan (service manager)  
**Purpose:** Complete list of SOPs to write so Covington runs without tribal knowledge — and so a second shop in a new service area can open from the same playbook.

**Related:** [shop_workflow.md](shop_workflow.md) · [shop_throughput.md](shop_throughput.md) · [../05_team/roles.md](../05_team/roles.md) · [../09_daily_ops/improvement_backlog.md](../09_daily_ops/improvement_backlog.md)

---

## Design rules (every SOP)

1. **Shop-only** — no mobile steps, no trip charges, no NGC Conversion products.
2. **Role-named** — each SOP has a primary owner (Christine / Ryan / Roy / tech / Jill).
3. **Exit criteria** — every procedure ends with a clear “done when…” and next lane.
4. **Transfer-ready** — put **location variables** (address, phone, zone map, tax parishes, GBP) in a one-page **Location Profile**, not buried inside every SOP.
5. **No customer PII** in templates stored in this repo — use invoice # / job #.

### Location Profile vs Core SOP

| Put in Location Profile (per shop) | Put in Core SOP (company-wide) |
|------------------------------------|--------------------------------|
| Address, suite, hours, phone | Intake script, deposit rules, diagnostic path |
| Pickup zone map & flat fees | Driver checklist, batching rules |
| Sales tax parishes | HCP/QBO job lifecycle, lane names |
| Local vendors / tow / dump | Lithium kit install sequence |
| Staff roster for that site | 7-point safety inspection |

---

## How we build these (guided process)

### Wave method

Do not write 40 docs at once. Ship in **waves** so staff can use them this week.

| Wave | Focus | Outcome |
|------|-------|---------|
| **Wave 1** | Money + flow | Intake → deposit → shop board → ready → close works the same every day |
| **Wave 2** | Bay work | Techs diagnose, repair, lithium, QC without asking Ryan |
| **Wave 3** | Logistics + quality | Roy routes clean; photos/notes/care guides always happen |
| **Wave 4** | People + admin | Hiring, counseling, Jill handoffs, month-end |
| **Wave 5** | Multi-site | Location Profile + open-a-shop checklist |

### Writing ritual (one SOP at a time)

1. **Pick the next SOP** from the priority table below.
2. **Walk it live once** with the person who does the job (Christine/Roy/Taylor).
3. **Draft** using the template in this file (or ask Cursor: “Draft SOP-XX from sop_catalog”).
4. **Strip mobile legacy** — if copying Drive docs, delete trip/mobile language first.
5. **Pilot 5 jobs** — mark gaps in the SOP, not in someone’s head.
6. **Publish** — one-pager on the wall or laminated card + link in HCP job type notes.
7. **Log** completion date in the Status column; update [decision_log.md](../09_daily_ops/decision_log.md) if policy changed.

### Standard SOP template

```markdown
# SOP-XX — Title
Owner: | Backup: | Last verified:
Applies to: Covington | All NGC locations

## Purpose
One sentence.

## When to use
Triggers.

## Prerequisites
Tools, deposits, HCP status, parts on hand.

## Steps
Numbered. Who does what.

## Done when (exit criteria)
Lane change + customer/comms + money state.

## Exceptions
Comebacks, no deposit, after-hours, Peyton trigger, etc.

## Location variables
Link to Location Profile fields used (if any).

## Related
Pricebook SKUs, other SOPs, care guides.
```

**Length target:** 1–2 pages. Checklists as separate one-pagers when techs need them on the cart.

---

## Master SOP list

Status: **Todo** · **Draft** · **Live** · **Needs refresh**

### A. Front office & customer intake (Christine primary)

| ID | SOP | Why it matters | Priority | Status |
|----|-----|----------------|----------|--------|
| **SOP-01** | Phone & walk-in intake | Same questions every time; correct job type; no wrong promises | Wave 1 | Todo |
| **SOP-02** | Scheduling & capacity gate | Enforce WIP limits before booking drop-offs / lithium | Wave 1 | Todo |
| **SOP-03** | Quote & estimate (repair) | $179 diagnostic rule; known-issue vs full diag; Christine script | Wave 1 | Todo |
| **SOP-04** | Quote & estimate (Professional lithium) | SKU pick, add-ons, deposit $1,800, 2–3 day SLA language | Wave 1 | Todo |
| **SOP-05** | Deposit collection & order release | Batteries/motors/controllers never ordered without deposit | Wave 1 | Todo |
| **SOP-06** | Customer notification (status / ready / delay) | Text/email templates; no PII in shared sheets | Wave 2 | Todo |
| **SOP-07** | Payment collection & closeout | Balance, methods, invoice send, HCP close | Wave 1 | Todo |
| **SOP-08** | Complaint / comeback intake | Log, schedule, no free rework without Ryan rule | Wave 2 | Todo |
| **SOP-09** | Fleet / HOA intake | Multi-cart jobs, billing contact vs site contact | Wave 3 | Todo |

### B. Shop workflow control (Ryan primary)

| ID | SOP | Why it matters | Priority | Status |
|----|-----|----------------|----------|--------|
| **SOP-10** | Morning huddle & board update | Assign every cart by 8:30; finish list; Peyton flags | Wave 1 | Todo |
| **SOP-11** | Job lane lifecycle (HCP + whiteboard) | INTAKE → … → CLOSED; status hygiene; no stale IP | Wave 1 | Todo |
| **SOP-12** | WIP limits & stop-scheduling rule | Protect lithium SLA; pause intake when over limit | Wave 1 | Todo |
| **SOP-13** | End-of-day lane audit | Correct statuses; blockers logged | Wave 1 | Todo |
| **SOP-14** | Parts special-order process | Deposit → order → receive → release to bay | Wave 2 | Todo |
| **SOP-15** | Job prioritization (lithium vs repair) | Day-aged lithium first; comebacks; waiters | Wave 2 | Todo |

### C. Technician workflows (Taylor / Marlon; Peyton where noted)

| ID | SOP | Why it matters | Priority | Status |
|----|-----|----------------|----------|--------|
| **SOP-20** | Cart receive & bay setup | Tag cart, photos, complaint restated, HCP note | Wave 2 | Todo |
| **SOP-21** | 7-point safety inspection | Free with every job; checklist on cart | Wave 2 | Todo |
| **SOP-22** | Standard electric diagnostic path | Existing Drive diag SOP → shop-only rewrite | Wave 2 | Todo |
| **SOP-23** | Gas cart diagnostic path | Separate from electric; same photo/log rules | Wave 3 | Todo |
| **SOP-24** | Estimate handoff to front office | Findings → Christine quote; no parts order yet | Wave 2 | Todo |
| **SOP-25** | General repair execution | Work to estimate; change-order path | Wave 2 | Todo |
| **SOP-26** | Lead-acid battery replacement | Deposit $800, cores, warranty notes | Wave 2 | Todo |
| **SOP-27** | Peyton escalation triggers | Intermittent, controller programming, comebacks, fleet pattern | Wave 2 | Todo |
| **SOP-28** | QC, test drive & ready tag | Fault codes cleared; .CPF saved; ready lane | Wave 2 | Todo |
| **SOP-29** | Documentation & photo standard | Before/after, fault codes, parts used — transfer-critical | Wave 2 | Todo |

### D. Lithium conversion (product line)

| ID | SOP | Why it matters | Priority | Status |
|----|-----|----------------|----------|--------|
| **SOP-30** | Lithium pre-install checklist | Deposit, kit SKU, charger, DC-DC, monitor on hand | Wave 2 | Todo |
| **SOP-31** | Professional Kit install (36/48/MINI/150AH/72V) | ~6 hr sequence; voltage-specific notes | Wave 2 | Todo |
| **SOP-32** | Lithium day 0/1/2 tracker | Protect 2–3 day promise | Wave 1 | Todo |
| **SOP-33** | Lithium QC + customer care handoff | Care guide, charger-only rule, SOC guidance | Wave 2 | Todo |
| **SOP-34** | Lithium add-on installs | Charger port, reducer, fuse box — sold with quote | Wave 3 | Todo |
| **SOP-35** | Core return & disposal | Core fees; lead-acid handling | Wave 3 | Todo |

### E. Driver / pickup & delivery (Roy primary)

| ID | SOP | Why it matters | Priority | Status |
|----|-----|----------------|----------|--------|
| **SOP-40** | Daily route build & zone batching | Northshore free / outside + Southshore flat fee | Wave 1 | Todo |
| **SOP-41** | Pickup from customer | Condition notes, photos, keys, intake form to Christine | Wave 1 | Todo |
| **SOP-42** | Delivery to customer | Payment confirm, care guide if lithium, signature/photo | Wave 1 | Todo |
| **SOP-43** | Vehicle & trailer safety | Load/secure, road check — liability | Wave 2 | Todo |
| **SOP-44** | Failed pickup / customer not home | Retry rules; communicate Christine | Wave 3 | Todo |
| **SOP-45** | Zone map & fee exception log | Until zones finalized — document every exception | Wave 1 | Todo |

### F. Parts, inventory & vendors

| ID | SOP | Why it matters | Priority | Status |
|----|-----|----------------|----------|--------|
| **SOP-50** | Receiving & put-away | Match PO/job; QBO inventory touch | Wave 3 | Todo |
| **SOP-51** | Bay parts pull & return | Shrink control | Wave 3 | Todo |
| **SOP-52** | Vendor order (kits, batteries, controllers) | Who orders; net of fees after deposit | Wave 2 | Todo |
| **SOP-53** | Min/max stocking (fast movers) | Location Profile vendors + core list | Wave 4 | Todo |

### G. Safety, quality & facilities

| ID | SOP | Why it matters | Priority | Status |
|----|-----|----------------|----------|--------|
| **SOP-60** | Shop safety & PPE | Daily open/close hazards | Wave 2 | Todo |
| **SOP-61** | Battery handling & spill / fire response | Lead-acid + LiFePO4 | Wave 2 | Todo |
| **SOP-62** | Tool / equipment care | Chargers, programmers, DVOM | Wave 3 | Todo |
| **SOP-63** | Shop open & close checklist | Lights, doors, keys, WIP board photo optional | Wave 2 | Todo |
| **SOP-64** | Warranty claim (battery / BMS / parts) | 5yr lithium; lead-acid warranty paths | Wave 3 | Todo |

### H. Finance & admin handoffs

| ID | SOP | Why it matters | Priority | Status |
|----|-----|----------------|----------|--------|
| **SOP-70** | Daily cash/card reconciliation | Christine → Jill | Wave 3 | Todo |
| **SOP-71** | Deposit accounting | Lithium $1,800 / battery $800 posted correctly | Wave 2 | Todo |
| **SOP-72** | Month-end export ritual | Pricebook + QBO → knowledge sync | Wave 3 | Todo |
| **SOP-73** | Pricebook change control | Who edits HCP; deactivate legacy; no inventing prices | Wave 2 | Todo |
| **SOP-74** | Sales tax by parish (jobs vs location) | Multi-parish LA — Location Profile | Wave 4 | Todo |

### I. People & training

| ID | SOP | Why it matters | Priority | Status |
|----|-----|----------------|----------|--------|
| **SOP-80** | New hire onboarding (tech) | Hiring quiz → shadow days → solo lanes | Wave 3 | Todo |
| **SOP-81** | New hire onboarding (office / driver) | Intake scripts / route SOPs | Wave 3 | Todo |
| **SOP-82** | Skills matrix & job assignment | Taylor vs Marlon vs Peyton | Wave 3 | Todo |
| **SOP-83** | Personnel counseling | Already live — [personnel_counseling.md](../05_team/personnel_counseling.md) | — | Live |
| **SOP-84** | Cross-training checklist | Second-site resilience | Wave 4 | Todo |

### J. Multi-site transfer (new service area)

| ID | SOP | Why it matters | Priority | Status |
|----|-----|----------------|----------|--------|
| **SOP-90** | Location Profile template | All variables for a second shop on one page | Wave 5 | Todo |
| **SOP-91** | New location open checklist | Lease, utilities, insurance, tools, inventory kit, HCP/QBO setup | Wave 5 | Todo |
| **SOP-92** | Soft open & first-30-days operating rhythm | Same lanes/WIP; local zone map; staffing | Wave 5 | Todo |
| **SOP-93** | Brand & GBP setup for new market | Phone, hours, photos, lithium offer | Wave 5 | Todo |
| **SOP-94** | Knowledge / pricebook clone | Copy Core SOPs; swap Location Profile only | Wave 5 | Todo |

### K. Future (do not build until service is solid)

| ID | SOP | Notes | Priority | Status |
|----|-----|-------|----------|--------|
| **SOP-F1** | Cart sales (bill of sale, deposits) | Form exists in Drive — park until ready | Later | Deferred |
| **SOP-F2** | Rentals | Strategic defer | Later | Deferred |
| **SOP-F3** | DMS migration cutover (Everlogic) | After shop-only pricebook clean | Later | Deferred |

---

## Wave 1 — write these first (money + flow)

Ship in this order so Covington stops depending on memory:

1. **SOP-01** Intake  
2. **SOP-05** Deposit collection & order release  
3. **SOP-04** Lithium quote (Professional Kits only)  
4. **SOP-03** Repair quote / $179 diagnostic  
5. **SOP-11** Job lane lifecycle  
6. **SOP-10** Morning huddle  
7. **SOP-12** WIP / stop-scheduling  
8. **SOP-32** Lithium day tracker  
9. **SOP-40 / 41 / 42** Driver route + pickup + delivery  
10. **SOP-07** Payment & closeout  
11. **SOP-45** Zone/fee exception log (until zones finalized)

**Already documented in knowledge (convert to staff SOPs, don’t rewrite from scratch):**

| Knowledge file | Feeds SOPs |
|----------------|------------|
| `shop_throughput.md` | SOP-10, 11, 12, 13, 15, 27, 32 |
| `shop_whiteboard_layout.md` | SOP-11 |
| `shop_workflow.md` | SOP-01, 20–22, 28 |
| `shop_services.md` / `lithium_conversions.md` | SOP-03–05, 30–33 |
| `roles.md` | All owner fields |
| `personnel_counseling.md` | SOP-83 (done) |

**Legacy Drive docs to refresh (strip mobile):**

- Technician diagnosing test process → **SOP-22**
- Mobile repair SOP / checklist → do **not** reactivate; harvest photos/HCP steps only into shop SOPs
- Lithium care guide → attach to **SOP-33**

---

## Transfer playbook (second location)

When opening a new service area:

1. **Clone Core SOPs** (everything except Location Profile fields).
2. **Fill Location Profile** (SOP-90): address, hours, phone, zone map, tax, vendors, roster.
3. **Run SOP-91** open checklist (tools, inventory starter kit, HCP company/location, QBO classes if used).
4. **Staff against skills matrix** (SOP-82) — at least one tech signed off on SOP-22 + SOP-31.
5. **Soft open** with WIP limits half of Covington until lanes are habit (SOP-92).
6. **Do not** invent local prices — clone pricebook, then adjust only with Ryan pricebook change control (SOP-73).

---

## Ownership RACI (SOP program)

| Activity | Ryan | Christine | Roy | Techs | Jill |
|----------|:----:|:---------:|:---:|:-----:|:----:|
| Approve Core SOPs | A | C | C | C | I |
| Draft front-office SOPs | C | R | I | I | I |
| Draft driver SOPs | C | I | R | I | I |
| Draft tech SOPs | R | I | I | C | I |
| Location Profile (new site) | A | C | C | I | C |
| Price / policy inside SOPs | A | C | I | I | C |

R = Responsible · A = Accountable · C = Consulted · I = Informed

---

## Metrics that prove SOPs are working

Track in Friday weekly review:

| Metric | Target |
|--------|--------|
| Avg days in shop — lithium | ≤ 3 |
| In progress count | ≤ 6 |
| Jobs ordered without deposit | 0 |
| Unassigned in-progress at 8:30 | 0 |
| Ready carts without customer notify same day | 0 |
| Driver fee exceptions undocumented | 0 |

---

## Ask Cursor to draft the next one

```
Draft SOP-01 Phone & walk-in intake for NGC.
Use knowledge/04_operations/sop_catalog.md template.
Shop-only. Christine primary. Include capacity gate and diagnostic $179 language.
No mobile. No customer PII examples.
```

Or: **"Start Wave 1 — draft the next unfinished SOP in sop_catalog."**
