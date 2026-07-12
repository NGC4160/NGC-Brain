# Daily Operations Guide

**Last verified:** 2026-06-28  
**Primary user:** Ryan (service manager) — Christine and leads can use the same prompts

## How this workspace helps you run NGC

This is not just documentation — it's an **operating system**. Cursor + `knowledge/` acts as:

- **Service advisor** — quotes, policies, warranty answers
- **Ops coach** — workflow gaps, SOP reminders, delegation
- **Finance spotter** — flags from QBO exports (when refreshed)
- **Growth partner** — marketing, lithium funnel, DMS migration, future sales prep

## Daily workflow

### Morning (5–10 min)

1. Open Cursor → new chat
2. Run [`prompts/morning_briefing.md`](../../prompts/morning_briefing.md)
3. Tell the AI: carts in shop, tech availability, any fires

**Output you want:** Top 3 priorities, deposit follow-ups, pickup/delivery schedule for Roy, lithium jobs at risk of missing 2–3 day promise.

Auto shop board (after HCP sync): `knowledge/.generated/shop_board.md` — see [shop throughput playbook](../04_operations/shop_throughput.md).

### During the day (as needed)

| Need | Prompt / action |
|------|-----------------|
| Customer quote (lithium or repair) | [`prompts/quote_and_customer.md`](../../prompts/quote_and_customer.md) |
| Draft text/email for Christine | Same — specify audience |
| "How do we diagnose X on Club Car?" | AI searches `NGC Document Repository` |
| Staff instruction for Taylor/Marlon | Ask for shop-floor checklist from SOPs |
| Price check | AI reads pricebook CSV — never guess |

### End of day (5 min)

Run [`prompts/end_of_day.md`](../../prompts/end_of_day.md). Log decisions in [`decision_log.md`](decision_log.md).

### Weekly — Friday (20–30 min)

Run [`prompts/weekly_review.md`](../../prompts/weekly_review.md). Copy results into [`weekly_review_template.md`](weekly_review_template.md) with date.

### Monthly (1 hour)

Run [`prompts/monthly_refresh.md`](../../prompts/monthly_refresh.md):

- Re-export HCP pricebook + QBO reports to `external_docs/exports/`
- Ask AI to diff changes and update `knowledge/`
- Review [`improvement_backlog.md`](improvement_backlog.md) — close done items, add new ones

## Roles — who uses what

| Person | Best uses |
|--------|-----------|
| **Ryan** | Morning briefing, diagnostics help, pricing, growth, DMS planning |
| **Christine** | Customer reply drafts, deposit/payment policy, scheduling language |
| **Taylor / Marlon** | Procedure lookup, parts identification (with cart model) |
| **Roy** | Pickup zone questions, route/day planning |
| **Jill (bookkeeper)** | Month-end checklist, QBO category questions (export fresh P&L first) |

## Data to feed the AI for best results

**High value (share often):**

- Today's job list (no customer PII — use "48V Club Car, lithium conversion, day 2")
- Week's completed jobs count by type (repair vs lithium vs battery)
- Marketing campaigns running
- Decisions you made that day

**Refresh monthly:**

- `external_docs/exports/pricebook/*.csv`
- `external_docs/exports/qbo/*.xlsx`

**Never share in chat:**

- Customer contact info (unless drafting a specific reply you'll send yourself)
- Passwords, bank account numbers

## Proactive AI behavior

The Cursor rule `ngc-daily-operator.mdc` instructs the AI to:

- Offer **1–3 concrete next actions** when you discuss ops or growth
- Flag **conflicts** between pricebook and stated policy
- Remind you of **open backlog items** when relevant
- Suggest **exports to refresh** when financial answers may be stale

## Files in this folder

| File | Purpose |
|------|---------|
| [decision_log.md](decision_log.md) | Record policy/business decisions with dates |
| [improvement_backlog.md](improvement_backlog.md) | Growth & ops projects prioritized |
| [weekly_review_template.md](weekly_review_template.md) | Blank template for weekly reviews |
