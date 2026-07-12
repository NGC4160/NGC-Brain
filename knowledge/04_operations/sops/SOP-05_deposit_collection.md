# SOP-05 — Deposit Collection & Order Release

**Owner:** Office Coordinator (Christine)  
**Backup:** Service Manager (Ryan)  
**Last verified:** 2026-07-12  
**Applies to:** All NGC locations (amounts from company policy; payment methods from Location Profile)  
**Status:** Draft — ready for Christine pilot

## Purpose

Collect the required deposit **before** any battery, motor, controller, or special-order parts are ordered — so NGC is not floating material cost or card fees.

## When to use

Any job that needs:

- Lithium conversion kit (any Professional Kit SKU)
- Lead-acid battery set / replacement
- Motor
- Controller
- Any **special-order** part not stocked on the shelf

Also use when working the daily deposit alerts queue (`deposit_alerts.md` / morning briefing).

## Prerequisites

- Approved estimate or clear job type in Housecall Pro
- Deposit amount known (table below or Service Manager override in writing on the job)
- Payment link / invoice ready to send
- Board / HCP lane aware: job sits in **Waiting deposit/parts** until released

## Hard rule (non-negotiable)

| Do | Do not |
|----|--------|
| Collect deposit **before** ordering | Order parts “on faith” or “customer said they’ll pay” |
| Note `Deposit received YYYY-MM-DD` on the job | Leave paid deposits undocumented |
| Tell Service Manager when order is **released** | Assume Ryan knows deposit cleared |

**No deposit → no order.** Exception only with Service Manager written approval on that job (rare).

## Required deposit amounts

Deposit must cover **material cost + card processing fees**. Typical amounts:

| Job type | Required deposit | Block parts order if paid less than |
|----------|-----------------:|-------------------------------------|
| Lithium conversion (Professional Kit) | **$1,800** | $1,800 |
| Standard lead-acid battery replacement | **$800** | $800 |
| Motor / controller / other special order | **Enough to cover materials + fees** (often ~50% of job total — confirm with Service Manager) | Agreed amount |
| Diagnostic only | $179 + tax (service charge — not a parts deposit) | N/A for parts; collect before scheduling when policy requires |

If stock is already on the shelf and no order is needed, still confirm payment plan with Service Manager before starting install of high-ticket kits.

## Steps

### 1. Identify deposit-required jobs

Each morning (and when a new estimate is approved):

1. Check jobs in **Waiting deposit / PARTS** on the board and in HCP.
2. Open deposit alerts if available (`knowledge/.generated/deposit_alerts.md` or ask Cursor **“deposit alerts”**).
3. Work **lithium and battery** `BLOCK_PARTS` items first.

### 2. Tell the customer clearly

On phone or text, state:

- Exact deposit amount  
- What it covers (parts order — balance due at completion)  
- That **parts are ordered only after deposit posts**  
- How to pay (HCP payment link preferred)

**Spoken / text example:**

> To order your [batteries / lithium kit / motor / controller], we need a deposit of $[amount]. Once that posts, we order the parts. The remaining balance is due when the cart is ready.

**Lithium example:**

> Your Professional lithium conversion requires an $1,800 deposit before we order the kit. Typical install turnaround after parts arrive is about 2–3 business days.

### 3. Send payment request

1. Send HCP invoice / payment link for the **deposit amount** (or full job with deposit noted — follow current HCP practice).
2. Add job note: `Deposit requested YYYY-MM-DD — $[amount] — awaiting payment`.
3. Move / keep card in **PARTS / DEPOSIT** with `$ dep?` until paid.

### 4. Confirm payment posted

Deposit counts only when payment is **received** in HCP (not a verbal promise).

1. Verify paid amount meets the threshold in the table above.
2. Add job note: `Deposit received YYYY-MM-DD — $[amount] — [method if useful]`.
3. Text customer confirmation (optional but preferred):

> We received your deposit — thank you. We’ll order your parts and update you when they’re in.

### 5. Order release (hand off to Service Manager)

Only after Step 4:

1. Notify Service Manager: invoice #, what to order (kit voltage / battery set / motor / controller), deposit confirmed.
2. Service Manager (or designated orderer) places the vendor order (see future SOP-14 / SOP-52).
3. Update job note: `Order released YYYY-MM-DD — deposit cleared`.
4. Update board: still **PARTS** but note `Waiting parts — ordered [date]` (no longer waiting deposit).
5. For lithium: check **Deposit received** on the day 0/1/2 tracker ([shop_throughput.md](../shop_throughput.md)).

### 6. If deposit is late or refused

| Situation | Action |
|-----------|--------|
| No payment after **24 hours** | One reminder text with pay link |
| No payment after **48 hours** | Call once; note outcome |
| Still unpaid | Do **not** order. Leave on waitlist / waiting deposit. Tell Service Manager — do not start bay work that depends on those parts |
| Customer asks to waive / reduce | Service Manager only — Office Coordinator does not discount deposits |
| Customer cancels after paying deposit | Service Manager handles refund / restocking per case — do not invent a refund policy |

**Reminder text:**

> Just a reminder — we still need the $[amount] deposit before we can order your parts. Here’s your payment link: [link]

## Done when (exit criteria)

| State | Done when |
|-------|-----------|
| **Waiting deposit** | Customer notified; amount + link sent; board/HCP show waiting deposit |
| **Deposit collected** | Payment posted; `Deposit received` note on job |
| **Order released** | SM notified; order placed or queued; board says waiting **parts** (not deposit) |
| **Blocked** | Unpaid after follow-ups; no parts ordered; SM aware |

## Exceptions

| Situation | Action |
|-----------|--------|
| Parts already in stock | Confirm with SM whether deposit still required before install; document decision on job |
| Fleet / HOA multi-cart | Deposit per cart or PO terms — SM sets terms in writing before any order |
| Comeback / warranty part | SM decides if deposit applies; default still no free special-order float |
| Partial payment below threshold | Not released — collect remainder first |
| Admin Bot / alerts disagree with HCP | Trust HCP payment screen; fix alert data later |

## Who does what

| Step | Office Coordinator | Service Manager |
|------|:-----------------:|:---------------:|
| Request & collect deposit | **R** | Backup |
| Approve waive / reduce | — | **A** |
| Place vendor order after release | Notify | **R** |
| Board / HCP status accuracy | **R** | Audits EOD |
| Jill / QBO deposit posting | Support | Coordinate as needed (SOP-71) |

## Location variables

Payment methods accepted, pay-link tooling, and who places vendor orders may vary by shop — set in Location Profile. **Deposit dollar amounts are company policy** unless SM changes them in writing.

## Related

- [shop_services.md](../../03_services/shop_services.md) — deposit policy  
- [lithium_conversions.md](../../02_products/lithium_conversions.md) — $1,800 lithium deposit  
- [shop_throughput.md](../shop_throughput.md) — waiting deposit/parts lane; lithium tracker  
- [ngc_admin_bot_spec.md](../../10_automation/ngc_admin_bot_spec.md) — deposit gate alerts  
- SOP-01 Intake · SOP-04 Lithium quote · SOP-07 Payment closeout · SOP-14 Parts special-order · SOP-32 Lithium day tracker  
