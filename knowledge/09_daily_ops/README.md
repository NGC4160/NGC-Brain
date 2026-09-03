# Daily Operations Guide

**Last verified:** 2026-09-03  
**Primary user:** Ryan (service manager) — Jesse (shop coordinator) and leads can use the same prompts

## How this workspace helps you run NGC

This is not just documentation — it's an **operating system**. Cursor + `knowledge/` acts as the source of truth for **Chief** (Ryan's Grok Bot COS) and shop bots as well: they must operate from this brain and write durable facts back here the **same day** Ryan corrects them.

- **Service advisor** — quotes, policies, warranty answers
- **Ops coach** — workflow gaps, SOP reminders, delegation
- **Finance spotter** — flags from QBO exports (when refreshed)
- **Growth partner** — marketing, lithium funnel, DMS migration, future sales prep

## Daily workflow

### Morning (5–10 min)

1. Open Cursor → new chat
2. Run [`prompts/morning_briefing.md`](../../prompts/morning_briefing.md)
3. Tell the AI: carts in shop, tech availability, any fires

**Output you want:** Top 3 priorities, deposit follow-ups, pickup/delivery schedule for Hayden, lithium jobs at risk of missing 2–3 day promise.

Auto shop board (after HCP sync): `knowledge/.generated/shop_board.md` — **generated snapshot, not policy**. See [shop throughput playbook](../04_operations/shop_throughput.md).

### Weekdays 11:00 AM America/Chicago

**Chief** collects website / Google Ads lead forms, then **asks Ryan and waits for a yes** before any Slack to Jesse. See [Bot Slack to Jesse](#bot-slack-to-jesse) below.

### During the day (as needed)

| Need | Prompt / action |
|------|-----------------|
| Customer quote (lithium or repair) | [`prompts/quote_and_customer.md`](../../prompts/quote_and_customer.md) — office quoting: [`lithium_sales_guide.md`](../02_products/lithium_sales_guide.md) (internal); kit/warranty SMS: [`customer_reply_standard.md`](../07_customers_marketing/customer_reply_standard.md); surcharge on every estimate: [`shop_services.md`](../03_services/shop_services.md) |
| Draft text/email for Jesse | Draft for Ryan. Do **not** Slack Jesse without Ryan’s yes. |
| "How do we diagnose X on Club Car?" | Point at Drive Procedures (not auto-synced). Do not invent SOP text from stub paths. |
| Staff instruction for Marlon / Ryan Gorgoglione | Ask for shop-floor checklist from SOPs |
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
| **Jesse** | Customer replies, deposits, estimates, HCP deposit pipeline (Awaiting Deposit → Need to Order → Waiting for Materials), pricebook, inventory/parts, workflow, Hayden routing, reporting |
| **Christine** | Part-time backup; owner exceptions |
| **Marlon / Ryan Gorgoglione** | Procedure lookup, parts identification (with cart model) |
| **Hayden Silva** | Pickup/delivery (primary). Shop/tech assist only when transport allows. Not independent diagnostic. |
| **Jessica (Griffin & Furman)** | Month-end checklist, QBO category questions (export fresh P&L first) |

## Chief routing (standing)

**Confirmed 2026-09-01 by Ryan White.** Standing rule — not a one-off.

Ryan talks **ONLY** to Chief. He should never have to message another shop bot or hunt another chat.

On **EVERY** task Ryan asks: Chief immediately decides which bot is appropriate and **PASSES** the work to that bot. Then Chief brings the result back to Ryan in **Chief’s thread**.

Do **not** start specialist work first and hand off later. If no bot owns the job, tell Ryan a new bot is worth creating and why. Do **not** quietly become Shop / Parts / Books.

**Chief’s own work only:** talking to Ryan; yes/no approvals (Slack Jesse, money, payroll, sign-in); writing facts back to Brain the **same day** Ryan corrects a shop fact; routing.

**Lanes:** Shop owns Housecall Pro — jobs, estimates, price book, line items, taxable flags, pricing/margin checks, dispatch/WIP. Parts, Books, Betty, Inbox, Front Desk, CFO, IT, Marketing, and the rest keep their lanes.

Ask Ryan before any Slack to Jesse. Results come back in Chief’s thread.

Roster and ownership: [roles.md](../05_team/roles.md).

## Bot Slack to Jesse

**Confirmed 2026-08-26 by Ryan White.** Applies to **every** NGC bot.

Ask Ryan and **wait for a yes** before sending any Slack to **Jesse Killian**. No DMs, channel posts, or messages-as-Ryan without that approval. Approvals go through **Chief**, who asks Ryan.

**Not exceptions:** lithium jobs, BMS recordings, website leads, estimates, HCP updates.

**Leads:** Chief still collects website / Google Ads lead forms weekdays at **11:00 AM America/Chicago**, then asks Ryan before any Slack to Jesse. Lead forms only from **NGC985 / ryan@ / contact@**.

**Inbox:** must not auto-Slack Jesse because lithium “stays with Jesse.”

**No HCP customer-message watching.**

Live roster (do not invent extras): Chief (COS), Inbox, Shop, Front Desk, Parts, Books, Betty (HR), CFO, Marketing, IT, Call Coach, Print (Blake), Bot Manager — [roles.md](../05_team/roles.md).

## Bot updates

**Confirmed 2026-08-28 by Ryan White.** Applies to **every** shop bot, including Chief.

Send updates as a **clean bullet list**. No dense paragraph dumps.

This applies when reporting to Ryan or to Chief.

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
