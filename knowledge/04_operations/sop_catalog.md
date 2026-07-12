# NGC SOP Catalog — Build the Operating System

**Last verified:** 2026-07-12  
**Catalog status:** All Core SOPs drafted — [review index](sops/README_REVIEW.md)  
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
| **SOP-01** | Phone & walk-in intake | Same questions every time; correct job type; no wrong promises | Wave 1 | **Live** — [sops/SOP-01_customer_intake.md](sops/SOP-01_customer_intake.md) |
| **SOP-02** | Scheduling & capacity gate | Enforce WIP limits before booking drop-offs / lithium | Wave 1 | **Draft** — [sops/SOP-02_scheduling_capacity_gate.md](sops/SOP-02_scheduling_capacity_gate.md) |
| **SOP-03** | Quote & estimate (repair) | $179 diagnostic rule; known-issue vs full diag; Christine script | Wave 1 | **Draft** — [sops/SOP-03_repair_diagnostic_quote.md](sops/SOP-03_repair_diagnostic_quote.md) |
| **SOP-04** | Quote & estimate (Professional lithium) | SKU pick, add-ons, deposit $1,800, 2–3 day SLA language | Wave 1 | **Draft** — [sops/SOP-04_lithium_quote.md](sops/SOP-04_lithium_quote.md) |
| **SOP-05** | Deposit collection & order release | Batteries/motors/controllers never ordered without deposit | Wave 1 | **Draft** — [sops/SOP-05_deposit_collection.md](sops/SOP-05_deposit_collection.md) |
| **SOP-06** | Customer notification (status / ready / delay) | Text/email templates; no PII in shared sheets | Wave 2 | **Draft** — [sops/SOP-06_customer_notification.md](sops/SOP-06_customer_notification.md) |
| **SOP-07** | Payment collection & closeout | Balance, methods, invoice send, HCP close | Wave 1 | **Draft** — [sops/SOP-07_payment_closeout.md](sops/SOP-07_payment_closeout.md) |
| **SOP-08** | Complaint / comeback intake | Log, schedule, no free rework without Ryan rule | Wave 2 | **Draft** — [sops/SOP-08_complaint_comeback.md](sops/SOP-08_complaint_comeback.md) |
| **SOP-09** | Fleet / HOA intake | Multi-cart jobs, billing contact vs site contact | Wave 3 | **Draft** — [sops/SOP-09_fleet_hoa_intake.md](sops/SOP-09_fleet_hoa_intake.md) |

### B. Shop workflow control (Ryan primary)

| ID | SOP | Why it matters | Priority | Status |
|----|-----|----------------|----------|--------|
| **SOP-10** | Morning huddle & board update | Assign every cart by 8:30; finish list; Peyton flags | Wave 1 | **Draft** — [sops/SOP-10_morning_huddle.md](sops/SOP-10_morning_huddle.md) |
| **SOP-11** | Job lane lifecycle (HCP + whiteboard) | INTAKE → … → CLOSED; status hygiene; no stale IP | Wave 1 | **Draft** — [sops/SOP-11_job_lane_lifecycle.md](sops/SOP-11_job_lane_lifecycle.md) |
| **SOP-12** | WIP limits & stop-scheduling rule | Protect lithium SLA; pause intake when over limit | Wave 1 | **Draft** — [sops/SOP-12_wip_stop_scheduling.md](sops/SOP-12_wip_stop_scheduling.md) |
| **SOP-13** | End-of-day lane audit | Correct statuses; blockers logged | Wave 1 | **Draft** — [sops/SOP-13_end_of_day_lane_audit.md](sops/SOP-13_end_of_day_lane_audit.md) |
| **SOP-14** | Parts special-order process | Deposit → order → receive → release to bay | Wave 2 | **Draft** — [sops/SOP-14_parts_special_order.md](sops/SOP-14_parts_special_order.md) |
| **SOP-15** | Job prioritization (lithium vs repair) | Day-aged lithium first; comebacks; waiters | Wave 2 | **Draft** — [sops/SOP-15_job_prioritization.md](sops/SOP-15_job_prioritization.md) |

### C. Technician workflows (Taylor / Marlon; Peyton where noted)

| ID | SOP | Why it matters | Priority | Status |
|----|-----|----------------|----------|--------|
| **SOP-20** | Cart receive & bay setup | Tag cart, photos, complaint restated, HCP note | Wave 2 | **Draft** — [sops/SOP-20_cart_receive_bay_setup.md](sops/SOP-20_cart_receive_bay_setup.md) |
| **SOP-21** | 7-point safety inspection | Free with every job; checklist on cart | Wave 2 | **Draft** — [sops/SOP-21_seven_point_safety.md](sops/SOP-21_seven_point_safety.md) |
| **SOP-22** | Standard electric diagnostic path | Existing Drive diag SOP → shop-only rewrite | Wave 2 | **Draft** — [sops/SOP-22_electric_diagnostic_path.md](sops/SOP-22_electric_diagnostic_path.md) |
| **SOP-23** | Gas cart diagnostic path | Separate from electric; same photo/log rules | Wave 3 | **Draft** — [sops/SOP-23_gas_diagnostic_path.md](sops/SOP-23_gas_diagnostic_path.md) |
| **SOP-24** | Estimate handoff to front office | Findings → Christine quote; no parts order yet | Wave 2 | **Draft** — [sops/SOP-24_estimate_handoff.md](sops/SOP-24_estimate_handoff.md) |
| **SOP-25** | General repair execution | Work to estimate; change-order path | Wave 2 | **Draft** — [sops/SOP-25_general_repair_execution.md](sops/SOP-25_general_repair_execution.md) |
| **SOP-26** | Lead-acid battery replacement | Deposit $800, cores, warranty notes | Wave 2 | **Draft** — [sops/SOP-26_lead_acid_battery_replacement.md](sops/SOP-26_lead_acid_battery_replacement.md) |
| **SOP-27** | Peyton escalation triggers | Intermittent, controller programming, comebacks, fleet pattern | Wave 2 | **Draft** — [sops/SOP-27_peyton_escalation.md](sops/SOP-27_peyton_escalation.md) |
| **SOP-28** | QC, test drive & ready tag | Fault codes cleared; .CPF saved; ready lane | Wave 2 | **Draft** — [sops/SOP-28_qc_test_drive_ready.md](sops/SOP-28_qc_test_drive_ready.md) |
| **SOP-29** | Documentation & photo standard | Before/after, fault codes, parts used — transfer-critical | Wave 2 | **Draft** — [sops/SOP-29_documentation_photo_standard.md](sops/SOP-29_documentation_photo_standard.md) |

### D. Lithium conversion (product line)

| ID | SOP | Why it matters | Priority | Status |
|----|-----|----------------|----------|--------|
| **SOP-30** | Lithium pre-install checklist | Deposit, kit SKU, charger, DC-DC, monitor on hand | Wave 2 | **Draft** — [sops/SOP-30_lithium_preinstall.md](sops/SOP-30_lithium_preinstall.md) |
| **SOP-31** | Professional Kit install (36/48/MINI/150AH/72V) | ~6 hr sequence; voltage-specific notes | Wave 2 | **Draft** — [sops/SOP-31_professional_kit_install.md](sops/SOP-31_professional_kit_install.md) |
| **SOP-32** | Lithium day 0/1/2 tracker | Protect 2–3 day promise | Wave 1 | **Draft** — [sops/SOP-32_lithium_day_tracker.md](sops/SOP-32_lithium_day_tracker.md) |
| **SOP-33** | Lithium QC + customer care handoff | Care guide, charger-only rule, SOC guidance | Wave 2 | **Draft** — [sops/SOP-33_lithium_qc_care_handoff.md](sops/SOP-33_lithium_qc_care_handoff.md) |
| **SOP-34** | Lithium add-on installs | Charger port, reducer, fuse box — sold with quote | Wave 3 | **Draft** — [sops/SOP-34_lithium_addons.md](sops/SOP-34_lithium_addons.md) |
| **SOP-35** | Core return & disposal | Core fees; lead-acid handling | Wave 3 | **Draft** — [sops/SOP-35_core_return_disposal.md](sops/SOP-35_core_return_disposal.md) |

### E. Driver / pickup & delivery (Roy primary)

| ID | SOP | Why it matters | Priority | Status |
|----|-----|----------------|----------|--------|
| **SOP-40** | Daily route build & zone batching | Free: 40 mi North Shore; $99 South Shore / outside | Wave 1 | **Draft** — [sops/SOP-40_daily_route_zone_batching.md](sops/SOP-40_daily_route_zone_batching.md) |
| **SOP-41** | Pickup from customer | Condition notes, photos, keys, intake form to Christine | Wave 1 | **Draft** — [sops/SOP-41_pickup_from_customer.md](sops/SOP-41_pickup_from_customer.md) |
| **SOP-42** | Delivery to customer | Payment confirm, care guide if lithium, signature/photo | Wave 1 | **Draft** — [sops/SOP-42_delivery_to_customer.md](sops/SOP-42_delivery_to_customer.md) |
| **SOP-43** | Vehicle & trailer safety | Load/secure, road check — liability | Wave 2 | **Draft** — [sops/SOP-43_vehicle_trailer_safety.md](sops/SOP-43_vehicle_trailer_safety.md) |
| **SOP-44** | Failed pickup / customer not home | Retry rules; communicate Christine | Wave 3 | **Draft** — [sops/SOP-44_failed_pickup.md](sops/SOP-44_failed_pickup.md) |
| **SOP-45** | Zone map & fee exception log | Until zones finalized — document every exception | Wave 1 | **Draft** — [sops/SOP-45_zone_fee_exception_log.md](sops/SOP-45_zone_fee_exception_log.md) |

### F. Parts, inventory & vendors

| ID | SOP | Why it matters | Priority | Status |
|----|-----|----------------|----------|--------|
| **SOP-50** | Receiving & put-away | Match PO/job; QBO inventory touch | Wave 3 | **Draft** — [sops/SOP-50_receiving_putaway.md](sops/SOP-50_receiving_putaway.md) |
| **SOP-51** | Bay parts pull & return | Shrink control | Wave 3 | **Draft** — [sops/SOP-51_bay_parts_pull_return.md](sops/SOP-51_bay_parts_pull_return.md) |
| **SOP-52** | Vendor order (kits, batteries, controllers) | Who orders; net of fees after deposit | Wave 2 | **Draft** — [sops/SOP-52_vendor_order.md](sops/SOP-52_vendor_order.md) |
| **SOP-53** | Min/max stocking (fast movers) | Location Profile vendors + core list | Wave 4 | **Draft** — [sops/SOP-53_minmax_stocking.md](sops/SOP-53_minmax_stocking.md) |

### G. Safety, quality & facilities

| ID | SOP | Why it matters | Priority | Status |
|----|-----|----------------|----------|--------|
| **SOP-60** | Shop safety & PPE | Daily open/close hazards | Wave 2 | **Draft** — [sops/SOP-60_shop_safety_ppe.md](sops/SOP-60_shop_safety_ppe.md) |
| **SOP-61** | Battery handling & spill / fire response | Lead-acid + LiFePO4 | Wave 2 | **Draft** — [sops/SOP-61_battery_spill_fire.md](sops/SOP-61_battery_spill_fire.md) |
| **SOP-62** | Tool / equipment care | Chargers, programmers, DVOM | Wave 3 | **Draft** — [sops/SOP-62_tool_equipment_care.md](sops/SOP-62_tool_equipment_care.md) |
| **SOP-63** | Shop open & close checklist | Lights, doors, keys, WIP board photo optional | Wave 2 | **Draft** — [sops/SOP-63_shop_open_close.md](sops/SOP-63_shop_open_close.md) |
| **SOP-64** | Warranty claim (battery / BMS / parts) | 5yr lithium; lead-acid warranty paths | Wave 3 | **Draft** — [sops/SOP-64_warranty_claim.md](sops/SOP-64_warranty_claim.md) |

### H. Finance & admin handoffs

| ID | SOP | Why it matters | Priority | Status |
|----|-----|----------------|----------|--------|
| **SOP-70** | Daily cash/card reconciliation | Christine → Jill | Wave 3 | **Draft** — [sops/SOP-70_daily_cash_card_reconciliation.md](sops/SOP-70_daily_cash_card_reconciliation.md) |
| **SOP-71** | Deposit accounting | Lithium $1,800 / battery $800 posted correctly | Wave 2 | **Draft** — [sops/SOP-71_deposit_accounting.md](sops/SOP-71_deposit_accounting.md) |
| **SOP-72** | Month-end export ritual | Pricebook + QBO → knowledge sync | Wave 3 | **Draft** — [sops/SOP-72_month_end_export_ritual.md](sops/SOP-72_month_end_export_ritual.md) |
| **SOP-73** | Pricebook change control | Who edits HCP; deactivate legacy; no inventing prices | Wave 2 | **Draft** — [sops/SOP-73_pricebook_change_control.md](sops/SOP-73_pricebook_change_control.md) |
| **SOP-74** | Sales tax by parish (jobs vs location) | Multi-parish LA — Location Profile | Wave 4 | **Draft** — [sops/SOP-74_sales_tax_parish.md](sops/SOP-74_sales_tax_parish.md) |

### I. People & training

| ID | SOP | Why it matters | Priority | Status |
|----|-----|----------------|----------|--------|
| **SOP-80** | New hire onboarding (tech) | Hiring quiz → shadow days → solo lanes | Wave 3 | **Draft** — [sops/SOP-80_onboarding_tech.md](sops/SOP-80_onboarding_tech.md) |
| **SOP-81** | New hire onboarding (office / driver) | Intake scripts / route SOPs | Wave 3 | **Draft** — [sops/SOP-81_onboarding_office_driver.md](sops/SOP-81_onboarding_office_driver.md) |
| **SOP-82** | Skills matrix & job assignment | Taylor vs Marlon vs Peyton | Wave 3 | **Draft** — [sops/SOP-82_skills_matrix.md](sops/SOP-82_skills_matrix.md) |
| **SOP-83** | Personnel counseling | Already live — [personnel_counseling.md](../05_team/personnel_counseling.md) | — | **Live** — [../05_team/personnel_counseling.md](../05_team/personnel_counseling.md) |
| **SOP-84** | Cross-training checklist | Second-site resilience | Wave 4 | **Draft** — [sops/SOP-84_cross_training.md](sops/SOP-84_cross_training.md) |

### J. Multi-site transfer (new service area)

| ID | SOP | Why it matters | Priority | Status |
|----|-----|----------------|----------|--------|
| **SOP-90** | Location Profile template | All variables for a second shop on one page | Wave 5 | **Draft** — [sops/SOP-90_location_profile.md](sops/SOP-90_location_profile.md) |
| **SOP-91** | New location open checklist | Lease, utilities, insurance, tools, inventory kit, HCP/QBO setup | Wave 5 | **Draft** — [sops/SOP-91_new_location_open.md](sops/SOP-91_new_location_open.md) |
| **SOP-92** | Soft open & first-30-days operating rhythm | Same lanes/WIP; local zone map; staffing | Wave 5 | **Draft** — [sops/SOP-92_soft_open_30_days.md](sops/SOP-92_soft_open_30_days.md) |
| **SOP-93** | Brand & GBP setup for new market | Phone, hours, photos, lithium offer | Wave 5 | **Draft** — [sops/SOP-93_brand_gbp_new_market.md](sops/SOP-93_brand_gbp_new_market.md) |
| **SOP-94** | Knowledge / pricebook clone | Copy Core SOPs; swap Location Profile only | Wave 5 | **Draft** — [sops/SOP-94_knowledge_pricebook_clone.md](sops/SOP-94_knowledge_pricebook_clone.md) |

### K. Future (do not build until service is solid)

| ID | SOP | Notes | Priority | Status |
|----|-----|-------|----------|--------|
| **SOP-F1** | Cart sales (bill of sale, deposits) | Form exists in Drive — park until ready | Later | Deferred |
| **SOP-F2** | Rentals | Strategic defer | Later | Deferred |
| **SOP-F3** | DMS migration cutover (Everlogic) | After shop-only pricebook clean | Later | Deferred |

---

## Wave 1 — status

All Wave 1 SOPs are drafted (SOP-01 Live). See [sops/README_REVIEW.md](sops/README_REVIEW.md) to review.

1. ~~SOP-01~~ Live
2. ~~SOP-02~~ Draft
3. ~~SOP-03~~ Draft
4. ~~SOP-04~~ Draft
5. ~~SOP-05~~ Draft
6. ~~SOP-07~~ Draft
7. ~~SOP-10~~ Draft
8. ~~SOP-11~~ Draft
9. ~~SOP-12~~ Draft
10. ~~SOP-13~~ Draft
11. ~~SOP-32~~ Draft
12. ~~SOP-40 / 41 / 42 / 45~~ Draft

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
