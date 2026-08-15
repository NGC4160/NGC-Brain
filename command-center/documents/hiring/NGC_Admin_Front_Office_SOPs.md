# Admin / Service Coordinator — Front Office SOPs

**Neighborhood Golf Carts**  
**Audience:** Jesse (Administrative Assistant / Service Coordinator), Christine (part-time backup), Ryan (escalations)  
**Last updated:** 2026-08-15  
**Related:** Job description · KPI scorecard · `knowledge/03_services/shop_services.md` · pricebook export

These SOPs cover the three board-critical admin workflows: **wait codes**, **standard estimates**, and **approval follow-up**. Also includes call triage, pickup language, deposits, and marketing admin checks.

---

## 0. Non-negotiable shop policies (say this correctly every time)

| Topic | Policy |
|-------|--------|
| Service model | **Shop-only** — no mobile / on-site repair, no trip charges |
| Diagnostic | **$179** minimum — not waived; applies toward repair on known-issue jobs |
| Pickup / delivery | **Free** within 40 mi Northshore; **$99** flat outside 40 mi or Southshore |
| Lithium | **Professional Kits only** — do not quote discontinued NGC Conversion line |
| Deposits | Required before ordering batteries, motors, controllers, special-order parts |
| Pricing | Use Housecall Pro / pricebook — **never invent** a price |
| Escalation | Unusual scope, discounts, warranty exceptions, angry customers → Ryan (Christine if Ryan is out) |

---

## 1. Call triage SOP

### Goal
Answer or acknowledge same business day. Pull Ryan/techs only when the call is technical or escalated.

### Steps
1. Answer: “Neighborhood Golf Carts, this is [Name], how can I help you?”
2. Capture: name preference, callback number, cart brand/model if known, symptom in **customer words** (not diagnosis).
3. Route:
   - **Schedule / status / pickup / estimate / payment** → handle or book
   - **“What’s wrong with my cart?”** → book shop diagnostic; do not diagnose on the phone
   - **Upset / warranty fight / fleet / complex lithium scope** → Ryan (Christine if Ryan is out)
4. Log outcome in HCP (note + next action). No customer PII in Cursor/chat logs.

### Scripts (short)

**Dead cart / wants mobile:**  
“We’re an in-shop service center in Covington — we don’t do mobile repairs. We can schedule a diagnostic here, and Roy can pick up the cart if that helps. Diagnostic is $179 and goes toward the repair when it’s a known issue.”

**Pickup quote:**  
“Pickup and delivery are free within 40 miles on the Northshore. Outside that, or Southshore, it’s a flat $99.”

---

## 2. Wait-code SOP (workflow visibility)

### Goal
Every waiting cart has **one primary wait reason** so Ryan can see real technician capacity vs. authorization/parts delays.

### Codes (use exactly)

| Code | Meaning | Example |
|------|---------|---------|
| **AUTH** | Waiting on customer authorization / estimate decision | Estimate sent; no yes/no yet |
| **PARTS** | Waiting on parts / vendor / special order | Solenoid ordered; ETA Friday |
| **TECH** | Repair-ready — waiting on technician labor | Approved + parts here; needs bay time |
| **PICKUP** | Waiting on pickup or redelivery logistics | Roy scheduled Thursday |
| **OTHER** | Anything else — **must write reason** | Waiting on Ryan for lithium scope; customer traveling |

### Rules
- One **primary** code per cart (secondary note OK).
- **TECH** only when work is approved **and** parts are on hand (or not needed).
- Do **not** code AUTH/PARTS delays as TECH — that falsely triggers Tech #3 hiring pressure.
- Update the code the same day the status changes.
- Morning sweep (with shop board / HCP): list counts by code for Ryan’s huddle.

### HCP hygiene checklist (daily)
- [ ] Open estimates have AUTH (or closed/approved)
- [ ] Jobs on order have PARTS + ETA note
- [ ] Approved + ready jobs show TECH
- [ ] Transport jobs show PICKUP + date
- [ ] No blank / “unknown” wait reasons older than 1 business day

---

## 3. Standard estimate SOP

### Goal
Same business day when technician findings and standard pricing are complete.

### When Admin builds the estimate
- Tech has documented findings / recommended work in HCP or written notes
- Items map cleanly to pricebook lines (parts + labor hours)
- No custom engineering, unclear root cause, or “good/better/best” judgment calls

### When to escalate to Ryan (do not guess)
- Lithium conversion scope / kit selection edge cases
- Warranty or courtesy write-offs
- Bundled discounts or “customer says competitor quoted X”
- Findings incomplete or conflicting
- Job likely to change after further diagnosis

### Build steps
1. Confirm customer + cart on the correct HCP job.
2. Enter pricebook lines only (labor hours per tech note).
3. Include diagnostic already charged / how it applies when relevant.
4. Write a plain-language summary the customer will understand (what + why + total).
5. Set job/estimate status so it appears on the **open estimates** list.
6. Set wait code **AUTH**.
7. Send estimate (HCP text/email) and note date/time sent.
8. Add to **same-day or next-morning follow-up list**.

### Deposit jobs (batteries, motors, controllers, lithium, special order)
- Estimate may go out for approval, but **do not place the vendor order** until deposit is collected (amount: material + card fees — confirm with Ryan if unclear).
- Typical anchors (confirm current): lithium conversion deposit ~$1,800; standard battery replacement ~$800.

---

## 4. Approval follow-up SOP

### Goal
Every open estimate is reviewed and contacted **daily** until approved, declined, or parked with a dated next step.

### Daily rhythm
1. **Morning:** Pull open estimates (AUTH list).
2. Work oldest first; same-day sends get end-of-day or next-morning contact.
3. For each: call first when possible; text/email per customer preference.
4. Document in HCP: contacted / no answer / left voicemail / decision / next date.
5. **End of day:** Zero open estimates without a note from today (or explicit next-date parked by Ryan).

### Outcomes to record

| Customer says | Your action | Wait code |
|---------------|-------------|-----------|
| Approved | Collect deposit if ordering parts; move to PARTS or TECH | PARTS or TECH |
| Declined | Close/estimate declined reason; thank them | (remove from AUTH) |
| Thinking / spouse | Set specific follow-up date/time; note it | AUTH |
| Wants change / cheaper option | Escalate to Ryan — do not freelance discount | AUTH or OTHER |
| No answer ×2 days | Alternate contact method; flag Ryan if aging | AUTH |

### Tone
Helpful and direct. Ask for a decision. Never argue. Never invent a lower price.

**Sample:**  
“Hi [Name], this is [You] at Neighborhood Golf Carts. Checking on the estimate we sent for the [part/work] on your [cart]. Do you want us to move forward, or do you have questions I can answer?”

---

## 5. Scheduling & pickup / redelivery

1. Confirm date/time windows with customer and shop capacity (Ryan for bay load).
2. Coordinate Roy for pickup/delivery; confirm address zone (free vs $99) before promising free.
3. Code **PICKUP** until cart is in shop or returned; then update.
4. Status texts: only facts (received, waiting approval, parts ordered ETA, ready for pickup).

---

## 6. Marketing admin checklist (under direction only)

Assigned when Ryan/consultant asks — Admin does **not** change strategy solo.

Daily or per-campaign check:
- [ ] Each active Facebook ad destination URL matches the intended landing page
- [ ] Landing page loads; phone CTA and form still work
- [ ] Screenshot or note anything broken → Ryan/consultant same day
- [ ] Do not raise budget, rewrite ads, or swap landing pages without approval

---

## 7. Escalation decision tree

```
Incoming need
├─ Standard schedule / status / estimate / approval / pickup quote → Admin handles
├─ Technical diagnosis question → Book diagnostic; do not advise repair steps
├─ Upset customer / warranty / money exception → Ryan (Christine if Ryan is out)
├─ Lithium kit choice / non-standard scope → Ryan
├─ Deposit amount unclear → Ryan
└─ Ad strategy / budget / creative → Ryan or consultant only
```

---

## 8. Day-1 / Week-1 training checklist (Admin)

**Day 1**
- [ ] Gusto onboarding complete (I-9, tax, deposit) — payroll system of record
- [ ] HCP login + shadow Ryan (or Christine if covering) on 3 live calls
- [ ] Read this SOP + policy table
- [ ] Tour wait codes on live jobs with Ryan
- [ ] Practice one sample estimate (not sent)

**Week 1**
- [ ] Own phones for defined blocks with backup
- [ ] Build ≥3 standard estimates (Ryan review before send)
- [ ] Run full open-estimate follow-up list once solo
- [ ] Complete one marketing URL audit if ads are active
- [ ] End of week: review KPI scorecard baseline with Ryan

---

## Privacy

- Customer names, phones, and invoice details stay in HCP/Gusto as appropriate.
- Do not paste customer PII into Cursor chats, shared notes, or marketing tools.
- Passwords and bank details are never stored in hiring or SOP files.
