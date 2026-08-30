# Shop Workflow

**Last verified:** 2026-08-30

## Current state

NGC operates as a **shop-first** business. All repair, diagnostic, and lithium conversion work happens at the Covington location. Mobile service has been discontinued. **In-shop only — no mobile.**

## Customer journey (typical)

```
Call for work → Estimate for approval → (if approved) queue for pickup or customer drop-off →
When there is an opening in the slot, schedule → In-shop work → Payment → Pickup/delivery OR customer pickup
```

### 1. Customer contact & estimate

- **Jesse** (administrative assistant / service coordinator) owns intake, estimating, workflow, parts/inventory, and Roy’s routing; **Christine** covers part-time as backup
- Hours: Mon–Fri 8 AM – 5 PM
- Shop is **in-shop only** (no mobile)
- **Credit card surcharge on every estimate** (shop-wide, 2026-08-30). Not lithium-only. Before sending the invoice for payment, or before taking payment, update the surcharge so it matches the final total. Do not invent a % or $. Policy: [shop_services.md](../03_services/shop_services.md#credit-card-surcharge-shop-wide-office-rule).

### HCP job pipeline — pickup / drop-off queue

**Confirmed 2026-08-24 by Ryan White.** Use Ryan’s wording. Do not expand this into a scheduling product. Do not invent booking language.

When NGC gets a call for work, we send an estimate for approval. If the customer approves it, they go in the queue for pickup or customer drop-off. When there is an opening in the slot, we schedule them.

In the HCP jobs pipeline, the stages **New job** and **Customer drop off** ARE that queue.

**Exact HCP stage names** (use these; do not rename): **New job**, **Customer drop off**. Both ARE the queue.

**Queue order:** Go by job number unless it makes sense to pick up another cart in the same area on the same run.

Do **not** say we lock a time, hold a spot, or make it an easy yes.

**Queue snapshot (2026-08-24):** Steve Tresch is in the pickup/drop-off queue (**New job** / **Customer drop off**). HCP job **#17444** (from the existing HCP jobs export — not invented). No other customer details here.

This queue is **distinct** from the parts-deposit pipeline below. The deposit pipeline still applies to approved work that needs a parts deposit.

### 2. Vehicle arrival

Options:

- Customer drops cart at shop
- **Roy** picks up cart (free within 40 mi Northshore; **$99** flat outside zone / Southshore)

### 3. Service execution

- **Ryan White** — service manager; oversees jobs and workflow
- **Marlon** — golf cart technician; primary shop work
- **Ryan Gorgoglione** — golf cart technician; primary shop work
- Complex diagnostics escalate to **Ryan White** (Peyton resigned 2026-08-22)

Every service includes **free 7-point safety inspection**.

For electric diagnostics, follow: `NGC Document Repository /Procedures/NGC_Technician_Standard_Diagnosing_Test_Process_and_Procedure.docx`

Key diagnostic sequence:

1. Static voltage + IR check, visual inspection
2. DVOM setup for load test
3. Handheld programmer to motor controller
4. Review/clear fault codes (photo or save .CPF)
5. Monitor review
6. Log file for complaint
7. Test drive with voltage monitoring
8. Save post-drive .CPF

### 4. Parts & deposits

- Large-ticket items (batteries, motors, controllers, special orders) require **deposit before ordering**
- Inventory tracked in QBO (~$19.7k inventory asset as of Jun 2026)
- Approved work that needs a parts deposit follows the **HCP job pipeline** below — not a combined “waiting deposit/parts” column

### HCP job pipeline — approved work that needs a parts deposit

**Confirmed 2026-08-23 by Ryan White.** Distinct from the pickup / drop-off queue above. Shop bots and staff use these **existing HCP deposit-pipeline stages**. Do not invent other deposit stages.

Applies when the customer has approved estimate(s) and the job needs a parts deposit (battery, motor, controller, lithium kit, or other special-order parts).

| Step | When | HCP action |
|------|------|------------|
| 1 | Customer approves | **COPY TO JOB** — copy the approved estimate(s) onto the job. Then move the job to **Awaiting Deposit**. Queue pickup or drop-off. |
| 2 | Deposit received | Move the job to **Need to Order** |
| 3 | Parts ordered | Move the job to **Waiting for Materials** |

**Exact HCP stage names** (use these; do not rename):

| HCP pipeline stage | Use when |
|--------------------|----------|
| **Awaiting Deposit** | Approved estimate(s) are on the job; deposit not in yet |
| **Need to Order** | Deposit received; parts not ordered yet |
| **Waiting for Materials** | Parts have been ordered |

**Name check (2026-08-23):** Repo search found **no prior HCP pipeline column** named Need to Order, Awaiting Deposit, or Waiting for Materials. Knowledge files only had a shop-floor lane `WAITING DEPOSIT/PARTS` and HCP **notes** “waiting deposit” / “waiting parts” — those are not pipeline stage names. Ryan said **Need to Order**; use that exact name.

**Hard rules:**

- Deposit is required **before** ordering a battery, motor, or controller
- After approval, queue pickup or drop-off — do not say lock a time, hold a spot, or easy yes. That queue is **New job** / **Customer drop off** (above). This deposit pipeline is separate.
- Do not invent other deposit-pipeline stages. Deposit stages are **Awaiting Deposit**, **Need to Order**, and **Waiting for Materials**.

### 5. Lithium conversions

- Turnaround: **2–3 days**, sometimes same day
- Professional Kit install ~6 hours
- Provide lithium care guide at pickup

### 6. Job completion & payment

- Collect payment at pickup or invoice via HCP (text/email)
- **Before sending the invoice for payment, or before taking payment:** update the credit card surcharge so it matches the **final total**. The line must already be on the estimate (every estimate). Do not invent a rate.
- **Roy** delivers cart if customer used pickup service

### 7. Documentation

Historical mobile SOPs referenced Housecall Pro photos, checklists, and NGC stickers on carts. Shop workflow should maintain:

- Before/after photos where applicable
- Diagnostic notes and fault codes
- Parts used / ordered
- Customer-facing summary of work performed

## Internal reference documents

| Document | Location |
|----------|----------|
| 7-point inspection report (print) | `external_docs/templates/operations/NGC_Golf_Cart_Inspection_Report.pdf` |
| Mobile repair SOP (legacy) | `NGC Document Repository /Procedures/Mobile Golf Cart Repair and Safety Protocol.docx` |
| Procedure checklist (legacy HCP flow) | `NGC Document Repository /Checklists/NGC Mobile Golf Cart Repair Services Procedure Checklist.docx` |
| Technician hiring test | `My Drive/Hiring quiz evaluation - Technician.docx` |
| Bill of sale form | `Management/NGC Golf Cart Bill of Sale Form (2).pdf` (for future sales) |

## Future: DMS migration

| System | Status |
|--------|--------|
| **Housecall Pro** | Current — scheduling, pricebook, invoicing |
| **Everlogic** | Preferred DMS candidate when shop slows enough to migrate |
| **BitDMS** | Under consideration |

HCP was chosen for mobile operations. Migration to Everlogic (or similar dealer/shop DMS) planned because NGC no longer offers mobile service.

**Before migration:**

1. Deactivate legacy mobile pricebook items
2. Remove discontinued NGC Conversion products
3. Confirm Professional lithium SKUs and current policies in new system
