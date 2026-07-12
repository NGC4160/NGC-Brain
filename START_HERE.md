# NGC Business Brain — Start Here

Open this project in **Cursor** and chat with the AI to run and improve Neighborhood Golf Carts daily.

**Browse all deliverables:** [ngc4160.github.io/NGC-Brain](https://ngc4160.github.io/NGC-Brain/) (GitHub Pages hub)

## Quick start (60 seconds)

1. Open **Cursor** → open this folder as your workspace
2. Start a new chat (`Cmd+L` / `Ctrl+L`)
3. Paste a prompt from [`prompts/`](prompts/) or type:

```
Morning briefing — what's on my plate today as service manager?
Use knowledge/ and tell me what you need from me if anything is missing.
```

The AI reads `knowledge/` automatically via `.cursor/rules/`.

---

## Daily rhythm

| When | What to do | Prompt file |
|------|------------|-------------|
| **Morning** | Priorities, shop capacity, open loops | [`prompts/morning_briefing.md`](prompts/morning_briefing.md) |
| **Anytime** | Quotes, customer replies, SOP help | [`prompts/quote_and_customer.md`](prompts/quote_and_customer.md) |
| **End of day** | Recap, blockers, tomorrow | [`prompts/end_of_day.md`](prompts/end_of_day.md) |
| **Weekly (Friday)** | KPIs, marketing, ops review | [`prompts/weekly_review.md`](prompts/weekly_review.md) |
| **Monthly** | Refresh exports, update knowledge | [`prompts/monthly_refresh.md`](prompts/monthly_refresh.md) |

Full guide: [`knowledge/09_daily_ops/README.md`](knowledge/09_daily_ops/README.md)

---

## What to tell the AI each session

Paste or summarize:

- Jobs in the shop today (cart make/model, issue, tech assigned)
- Any numbers you want analyzed (export fresh QBO/HCP first)
- Decisions you made ("we're setting paid pickup at $99 for all Southshore")
- Questions for staff (Christine, Roy, techs)

**Do not paste** customer phone numbers or addresses unless necessary — look those up in HCP.

---

## Keep the brain current

When something changes, either:

1. **Tell the AI in chat** — it can update `knowledge/` files for you, or
2. **Re-export** to `external_docs/exports/` and say **"sync exports"** (runs `scripts/sync/run_ingest.sh`)

Track decisions in [`knowledge/09_daily_ops/decision_log.md`](knowledge/09_daily_ops/decision_log.md).

## Automate further

| Layer | Doc |
|-------|-----|
| Connectors & MCP setup | [`knowledge/10_automation/README.md`](knowledge/10_automation/README.md) |
| Step-by-step integrations | [`knowledge/10_automation/integration_playbook.md`](knowledge/10_automation/integration_playbook.md) |
| Automation ideas catalog | [`knowledge/10_automation/automations_catalog.md`](knowledge/10_automation/automations_catalog.md) |

**Quick wins:** Session hooks auto-sync exports · Skills: `ngc-sync-exports`, `ngc-morning-briefing`, `ngc-hcp-api` · **HCP MAX:** [`hcp_api_setup.md`](knowledge/10_automation/hcp_api_setup.md) · Next: QBO MCP

---

## Growth & improvement menu

See [`knowledge/09_daily_ops/improvement_backlog.md`](knowledge/09_daily_ops/improvement_backlog.md) for active projects.

Ask anytime: **"What should I work on this week to grow NGC?"**
