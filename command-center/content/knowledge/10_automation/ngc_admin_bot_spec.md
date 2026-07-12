# NGC Admin Bot — Specification

**Last verified:** 2026-06-28  
**Owner:** Ryan  
**Status:** Phase 1 MVP (deposit gate alerts) — batch script  
**Brain:** `knowledge/` · **Data:** HCP API · **Future home:** `external_docs/My Drive/NGC Admin Bot/` (empty today)

---

## Purpose

NGC Admin Bot is the **automation layer** between Housecall Pro, the team, and (selectively) customers. It handles repetitive follow-ups so Christine and Ryan don't rely on memory or stale HCP statuses.

**Not in scope:** replacing HCP scheduling, quoting, or tech workflows. The bot **nudges, alerts, and sends templated messages** at the right trigger.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        NGC Admin Bot                             │
├─────────────────────────────────────────────────────────────────┤
│  Phase 1 (now)     │  Batch scripts after HCP sync              │
│  Phase 2           │  HCP webhooks → small HTTP handler         │
│  Phase 3           │  Outbound SMS/email via HCP or Twilio      │
└─────────┬───────────────────────────────┬───────────────────────┘
          │                               │
   ┌──────▼──────┐                 ┌──────▼──────┐
   │  HCP API    │                 │  knowledge/ │
   │  jobs, pay  │                 │  policies   │
   └─────────────┘                 └─────────────┘
```

| Layer | Tool | Role |
|-------|------|------|
| Policy | `knowledge/02_products/`, `knowledge/03_services/` | Deposit amounts, review rules |
| Data | `scripts/connectors/hcp_client.py` | Live jobs, payments |
| Phase 1 output | `knowledge/.generated/deposit_alerts.md` | Christine daily queue (no PII) |
| Phase 2 trigger | HCP webhooks (`job.updated`, `payment.paid`) | Real-time |
| Phase 3 delivery | HCP customer SMS/email **or** Twilio | Customer-facing |

**Privacy rule:** Generated files use **invoice # + job description only**. Customer names/phones stay in HCP; Christine opens the job there to act.

---

## Automation roadmap

| Phase | Automation | Trigger | Owner | Delivery | Status |
|-------|--------------|---------|-------|----------|--------|
| **1** | **Deposit gate alert** | Daily HCP sync | Christine | `deposit_alerts.md` + morning briefing | **Building** |
| **2** | **Google review request** | Job paid + complete | Customer | HCP SMS/email template | Spec ready |
| **3** | Deposit reminder (customer) | 48h unpaid deposit on Li/battery job | Customer | HCP message | Backlog |
| **4** | Job completed → weekly metrics | Webhook | Ryan | Sheet / review file | Backlog |
| **5** | Lithium day-3 SLA ping | Daily scan | Ryan | Email/Slack | Backlog |

---

## Phase 1 — Deposit gate alert (first ship)

### Problem

Active HCP pipeline shows **most jobs with balance due**. Large-ticket work (lithium, batteries, motors, controllers) must not proceed to parts order until deposit policy is met ([deposits](../03_services/shop_services.md), [lithium](../02_products/lithium_conversions.md)).

### Rules

| Job type (from description) | Required deposit | Block parts order if paid < |
|-----------------------------|-----------------:|----------------------------|
| Lithium conversion | $1,800 | $1,800 |
| Lead-acid battery replacement | $800 | $800 |
| Motor / controller / special order | 50% of job total | 50% of total |
| Diagnostic only | $179 (full min charge) | N/A — flag if unpaid before scheduling |

**Paid amount** = `total_amount - outstanding_balance` (HCP amounts in cents).

### Alert types

| Code | Meaning | Action |
|------|---------|--------|
| `BLOCK_PARTS` | Deposit-required job below threshold | Do not order parts; call/text for deposit |
| `COLLECT_BALANCE` | Active job with any balance due | Collect before release / pickup |
| `SCHEDULE_UNPAID` | Needs scheduling + full balance = diagnostic unpaid | Book only after payment or manager OK |

### Output

Script: `scripts/admin_bot/deposit_gate_alerts.py`  
Run: `./scripts/admin_bot/run_deposit_alerts.sh` (chained after HCP sync)

Writes: `knowledge/.generated/deposit_alerts.md`

### Christine daily use (2 min)

1. Open deposit alerts file or ask Cursor **"deposit alerts"**
2. Work `BLOCK_PARTS` first — lithium and battery jobs
3. Open invoice in HCP → send payment link → add note `Deposit received [date]`
4. Tell Ryan when parts can be ordered

---

## Phase 2 — Google review request (second ship)

### Trigger

All must be true:

- `work_status` = complete (rated or unrated)
- `outstanding_balance` = 0
- Job total ≥ **$500** (skip small tire/brake-only jobs unless Ryan opts in)
- Not tagged `no review` (warranty comebacks, courtesy jobs)
- **24–48 hours** after completion (not same hour — customer needs drive time)

### Skip if

- HCP native review campaign already enabled (check HCP settings first — don't duplicate)
- Job description contains `courtesy`, `warranty`, `fleet inspection` (0.5 hr fleet lines)

### Message template (SMS/email via HCP)

```
Hi — thanks for trusting Neighborhood Golf Carts with your cart service.

If we earned it, a quick Google review helps other Northshore owners find us:
[GBP review link]

Questions? Reply here or call 985-402-1206.

— Christine, Neighborhood Golf Carts
```

**GBP review link:** use Google Business Profile short link from [company profile](../01_company/profile.md).

### Implementation options

| Option | Effort | Notes |
|--------|--------|-------|
| **A — HCP built-in** | Low | Enable in HCP marketing/reviews; bot only logs sent |
| **B — Webhook + script** | Medium | On `payment.paid`, queue review job for +24h |
| **C — Zapier** | Low | HCP job paid → delay → send SMS |

**Recommendation:** Check HCP native review requests first. If insufficient, build Option B in Admin Bot Phase 2.

---

## Phase 3+ — Backlog (spec only)

### Customer deposit reminder

- **Trigger:** Estimate approved + lithium/battery line + 48h no payment
- **Template:** Friendly reminder with deposit amount and HCP pay link
- **Owner:** Christine; bot drafts, human sends until trust is high

### Lithium SLA alert (internal)

- **Trigger:** Lithium job in progress > 3 calendar days
- **Notify:** Ryan
- **Output:** Append to morning briefing / Slack

### Webhook handler (when ready)

```
POST /webhooks/hcp
  → verify signature
  → route: job.updated | payment.paid | job.completed
  → idempotent (store event IDs in sqlite or jsonl)
```

Host options: Cloudflare Worker, Railway, or small VPS. URL registered via HCP `POST /webhook_subscriptions` — see [hcp_api_setup.md](hcp_api_setup.md).

---

## Configuration

| Variable | Purpose | Phase |
|----------|---------|-------|
| `HCP_API_KEY` | Already in `.env` | 1 |
| `NGC_ALERT_EMAIL` | Christine inbox for future email delivery | 3 |
| `NGC_SLACK_WEBHOOK` | Optional team alerts | 3 |
| `NGC_REVIEW_MIN_TOTAL_CENTS` | Default `50000` ($500) | 2 |
| `NGC_REVIEW_DELAY_HOURS` | Default `24` | 2 |

---

## Success metrics

| Metric | Target (90 days) |
|--------|------------------|
| Parts ordered without deposit | **0** |
| `BLOCK_PARTS` alerts open > 48h | **< 3** |
| Google reviews / month | +20% vs baseline |
| Manual "did they pay?" calls | −50% |

---

## Implementation checklist

### Phase 1 (this week)

- [x] Spec document (this file)
- [x] `deposit_gate_alerts.py` + run script
- [x] Chain after `run_hcp_sync.sh`
- [ ] Christine validates alert list against 5 real jobs
- [ ] Add HCP note convention: `Deposit received YYYY-MM-DD`

### Phase 2 (next)

- [ ] Confirm HCP native review settings
- [ ] Pick delivery (native vs webhook)
- [ ] Test one completed lithium job end-to-end
- [ ] Add `no review` tag in HCP for exceptions

### Phase 3 (quarter)

- [ ] Webhook endpoint + subscription
- [ ] Customer deposit reminder template
- [ ] Optional Slack/email push

---

## Related

- [automations_catalog.md](automations_catalog.md)
- [hcp_api_setup.md](hcp_api_setup.md)
- [integration_playbook.md](integration_playbook.md)
- [../06_systems/tools.md](../06_systems/tools.md)
