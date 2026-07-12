---
name: ngc-hcp-api
description: Sync live data from Housecall Pro API (MAX plan), test connection, summarize open jobs without customer PII, and compare live pricebook to knowledge/. Use when user says sync HCP, pull jobs from Housecall Pro, HCP API, or morning briefing with live job data.
---

# NGC Housecall Pro API

## Prerequisites

- MAX plan (confirmed)
- `HCP_API_KEY` in `.env` — see `knowledge/10_automation/hcp_api_setup.md`

## Sync command

```bash
./scripts/sync/run_hcp_sync.sh
```

Writes to `external_docs/exports/hcp/`:

- `company.json`
- `jobs.json`
- `pricebook_services.json`
- `api_sync_manifest.json`

Then runs `run_ingest.sh` to update `knowledge/.generated/sync_manifest.json`.

## Morning briefing with live jobs

1. Run sync if `api_sync_manifest.json` is older than 4 hours
2. Read `external_docs/exports/hcp/jobs.json`
3. Summarize by **status** (scheduled, in_progress, completed) — **no customer names**
4. Flag lithium jobs, deposit-pending, overdue turnaround
5. Combine with user's shop status and `knowledge/09_daily_ops/improvement_backlog.md`

## MCP alternative

If `housecall-pro` MCP is configured in `.cursor/mcp.json`, prefer MCP tools for live queries instead of JSON files.

## Never

- Store customer PII in `knowledge/` files
- Commit API keys to git
