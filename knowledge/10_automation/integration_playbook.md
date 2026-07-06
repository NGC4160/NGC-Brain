# Integration Playbook

Step-by-step setup for NGC Business Brain connectors.

---

## QuickBooks Online MCP

**Best ROI:** Ask live financial questions without exporting xlsx.

### Prerequisites

- QuickBooks Online admin access (Neighborhood Golf Carts company)
- [Intuit Developer](https://developer.intuit.com/) account (free)

### Steps

1. **Create Intuit app**
   - developer.intuit.com → Create app → QuickBooks Online
   - Scopes: `com.intuit.quickbooks.accounting` (minimum)
   - Redirect URI: `http://localhost:8000/callback` (for local OAuth flow)

2. **Choose MCP server** (pick one)

   | Server | Install | Notes |
   |--------|---------|-------|
   | [quickbooks-mcp](https://github.com/laf-rge/quickbooks-mcp) | `npx -y quickbooks-mcp` | Report tools, bookkeeper-focused |
   | [intuit/quickbooks-online-mcp-server](https://github.com/intuit/quickbooks-online-mcp-server) | Official Intuit | 144 tools, full API |

3. **Configure Cursor MCP**
   - Copy `.cursor/mcp.json.example` → `.cursor/mcp.json`
   - Fill credentials per server README
   - Cursor Settings → MCP → enable server → complete OAuth

4. **Verify**
   - New chat: "Pull QBO P&L last 3 months for NGC — income by category only, no customer names"
   - Should match structure in `knowledge/08_finance/overview.md`

5. **Optional:** Set `QBO_INLINE_OUTPUT=true` if responses reference `/tmp` files

### Security

- Use production app only on your machine
- Do not commit `.cursor/mcp.json` with secrets — add to `.gitignore` if needed
- Tell AI: never output customer names from QBO queries

---

## Housecall Pro API

**NGC has MAX plan** — full API access. Setup: [`hcp_api_setup.md`](hcp_api_setup.md)

### Generate API key

1. HCP Admin → **App Store** → **Generate API Key**
2. Add to `.env`: `HCP_API_KEY=...`
3. Test: `./scripts/sync/run_hcp_sync.sh`

### Sync scripts (built)

| Script | Output |
|--------|--------|
| `./scripts/sync/run_hcp_sync.sh` | Live jobs, company, pricebook → `external_docs/exports/hcp/` |
| `./scripts/connectors/hcp_client.py` | Python API client (Token auth) |

### MCP (live chat)

Clone [Housecall-Pro-MCP](https://github.com/blake7ferrin/Housecall-Pro-MCP) — see `hcp_api_setup.md` §4.

### Webhooks (phase 2)

`job.completed`, `payment.paid` → NGC Admin Bot / Slack. See `hcp_api_setup.md` §5.

### Without API key yet

Keep CSV export to `external_docs/exports/pricebook/` — hooks still sync.

---

## Google Drive

**Full walkthrough:** [`google_drive_setup.md`](google_drive_setup.md)

### Current (no API)

Google Drive for Desktop syncs to `external_docs/My Drive/` (Mac only — symlink breaks in Cloud Agents)

**Limitation:** `.gsheet` / `.gdoc` files are stubs — export to xlsx/pdf for AI reading.

### Google Drive MCP (recommended)

1. Google Cloud Console → enable Drive API (+ Docs/Sheets optional)
2. OAuth Desktop credentials → refresh token via OAuth Playground
3. Add to `.env` → run `./scripts/setup/print_google_drive_mcp.sh` → paste into Cursor MCP settings
4. Verify: `./scripts/setup/run_google_drive_test.sh`

Scope: `drive.readonly` unless you need write access.

**Automate (future):** Nightly export of key sheets (Tech Performance, HOA, Outreach) to `external_docs/exports/drive/`

---

## Cursor Automations

Use the **Agents Window** and the `automate` skill.

### Recommended automations

**1. Friday weekly review**

| Field | Value |
|-------|-------|
| Trigger | Cron: `0 16 * * 5` (4 PM Friday) |
| Repo | This workspace |
| Prompt | Contents of `prompts/weekly_review.md` + read `knowledge/` |

**2. Monday pricebook drift**

| Field | Value |
|-------|-------|
| Trigger | Cron: `0 8 * * 1` |
| Prompt | Run `./scripts/sync/ingest_exports.py`, compare lithium SKUs and diagnostic fees to `knowledge/`, report drift |

**3. Monthly QBO refresh** (until MCP live)

| Field | Value |
|-------|-------|
| Trigger | Cron: `0 9 1 * *` |
| Prompt | Remind Ryan to export QBO + run `prompts/monthly_refresh.md` |

---

## Zapier / Make recipes (no-code)

| Recipe | Apps | Outcome |
|--------|------|---------|
| HCP job completed → Google Sheets | HCP + Sheets | Job log for weekly review |
| Google Form → HCP customer | Forms + HCP | Lead intake |
| QBO new payment → Slack | QBO + Slack | Cash notification |
| Schedule → Email Ryan | Schedule + Email | Export reminder |

---

## Everlogic (when selected)

1. Request API docs during demo
2. Map fields: Customer, Unit, RO, Line items, Inventory
3. Migration: HCP pricebook CSV → Everlogic import template
4. Add Everlogic MCP or nightly CSV export to `external_docs/exports/everlogic/`

---

## Environment variables

Copy `.env.example` → `.env`:

```bash
cp .env.example .env
```

Fill only what you connect. Never commit `.env`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| MCP "needs auth" | Cursor Settings → MCP → Reconnect OAuth |
| ingest_exports fails | Run `.venv/bin/pip install openpyxl` or `python3 scripts/sync/ingest_exports.py` |
| Hook not firing | Check Cursor → Settings → Hooks; restart Cursor |
| HCP API 403 | Confirm MAX/XL plan |
