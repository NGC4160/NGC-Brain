# Automations Catalog

Concrete automations to build — ordered by impact vs effort.

## Tier 1 — Do first (this week)

| # | Automation | Type | Trigger | Outcome |
|---|------------|------|---------|---------|
| 1 | **Export ingest** | Script + Hook | Session start / file save | `sync_manifest.json` always fresh |
| 2 | **QBO MCP** | MCP | On demand in chat | Live P&L, no xlsx export |
| 3 | **Friday weekly review** | Cursor Automation | Cron Fri 4 PM | Agent runs weekly review prompt |
| 4 | **Legacy pricebook audit** | One-shot agent task | Manual | Deactivation checklist — `legacy_pricebook_cleanup.md` |

## Tier 2 — This month

| # | Automation | Type | Trigger | Outcome |
|---|------------|------|---------|---------|
| 5 | **HCP → Sheet job log** | Zapier | Job completed | Weekly review data without manual entry |
| 6 | **Monday drift check** | Cursor Automation | Cron Mon 8 AM | Flags price/policy vs knowledge |
| 7 | **Drive sheet auto-export** | Zapier/Google Apps Script | Nightly | Tech tracker, HOA xlsx in exports/ |
| 8 | **Deposit reminder** | Zapier | HCP tag "awaiting deposit" | Email Christine |

## Tier 3 — Quarter

| # | Automation | Type | Trigger | Outcome |
|---|------------|------|---------|---------|
| 9 | **HCP API MCP** | Custom MCP | Real-time | Open jobs in morning briefing |
| 10 | **GBP review request** | Zapier | HCP job paid | Review link SMS template |
| 11 | **Lithium pipeline dashboard** | Sheet + Automation | Daily | Conversions in progress |
| 12 | **Everlogic sync** | API/CSV | Post-migration | Single system of record |
| 13 | **NGC Admin Bot** | Custom app | HCP sync + webhooks | Phase 1: deposit gate alerts — see [ngc_admin_bot_spec.md](ngc_admin_bot_spec.md) |

## Cursor Automations — copy prompts

### Friday weekly review

```
Read knowledge/ and knowledge/09_daily_ops/improvement_backlog.md.
Run the weekly review from prompts/weekly_review.md.
Ask Ryan to paste this week's shop numbers if not in sync_manifest.json.
Output: scorecard, bottlenecks, top 3 next-week priorities, one growth experiment.
Save summary to knowledge/09_daily_ops/reviews/YYYY-MM-DD-weekly.md (create folder if needed).
```

### Monday pricebook drift

```
Run scripts/sync/ingest_exports.py.
Compare knowledge/.generated/sync_manifest.json lithium SKUs and diagnostic fees
against knowledge/02_products/ and knowledge/03_services/.
List any drift. Check for legacy mobile items still in CSV.
Propose knowledge/ updates if needed.
```

### Monthly refresh reminder

```
Remind Ryan to export HCP pricebook and QBO reports to external_docs/exports/.
Then run prompts/monthly_refresh.md workflow.
Update Last verified dates in knowledge/00_index.md.
```

## Zapier starter zaps (if no HCP API)

1. **Schedule every Friday 3 PM** → Email Ryan "Run weekly review in Cursor"
2. **Google Drive new file in exports/qbo/** → Slack "QBO export uploaded — run /sync"
3. **HCP (if available) New Job** → Google Sheets append

## Hooks (already installed)

| Hook | Event | Action |
|------|-------|--------|
| `session-ingest.sh` | sessionStart | Run ingest_exports.py |
| `exports-changed.sh` | afterFileEdit | Re-ingest if exports/ changed |

## Skills (invoke explicitly)

| Skill | Say |
|-------|-----|
| `ngc-sync-exports` | "sync exports" or "/sync" |
| `ngc-morning-briefing` | "morning briefing" with shop status |
