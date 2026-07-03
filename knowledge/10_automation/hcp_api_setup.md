# Housecall Pro API Setup (MAX Plan)

**Last verified:** 2026-06-28  
**Status:** NGC has MAX plan — API access enabled

## 1. Generate your API key (5 minutes)

1. Sign in to [Housecall Pro Pro Portal](https://pro.housecallpro.com/pro/login) as **Admin**
2. Go to **App Store** (or **Settings → Integrations → API**)
3. **Generate API Key** — copy immediately (shown once)
4. Store in `.env` (never commit):

```bash
cp .env.example .env
# Edit .env:
HCP_API_KEY=your_key_here
```

Optional if multi-location:

```bash
HCP_COMPANY_ID=location-uuid-from-company-endpoint
```

## 2. Test the connection

From repo root:

```bash
./scripts/sync/run_hcp_sync.sh
```

Expected output:

```
Testing HCP connection...
  OK — company endpoint reachable
  Saved company.json
  Saved jobs.json (N jobs)
  Saved pricebook_services.json (N services)
```

Files land in `external_docs/exports/hcp/`.

If auth fails:

- Confirm you're **Admin** (only Admins generate keys)
- Header format is `Authorization: Token YOUR_KEY` (not Bearer for API keys)
- Email apideveloper@housecallpro.com with your cURL if stuck

## 3. Automate sync

### Manual (anytime)

```bash
./scripts/sync/run_hcp_sync.sh
```

Say **"sync HCP"** in Cursor — uses skill `ngc-hcp-api`.

### Session hook (optional)

Add to cron on your Mac or run daily:

```bash
# crontab -e — 6 AM weekdays
0 6 * * 1-5 cd /path/to/NeighborhoodGolfCartsBusinessBrain && ./scripts/sync/run_hcp_sync.sh
```

### Cursor Automation

Schedule: `0 6 * * 1-5` (6 AM weekdays)

Prompt:

```
Run ./scripts/sync/run_hcp_sync.sh in the NGC Business Brain repo.
Read external_docs/exports/hcp/jobs.json and summarize open shop jobs
(no customer names). Compare pricebook_services count to knowledge/.
Alert if legacy mobile items appear in live pricebook.
```

## 4. MCP — live HCP in chat (recommended)

Two options:

### Option A — Community MCP (fastest)

[Housecall-Pro-MCP](https://github.com/blake7ferrin/Housecall-Pro-MCP) — full MCP with jobs, customers, pricebook, morning dispatch prompt.

```bash
git clone https://github.com/blake7ferrin/Housecall-Pro-MCP.git ~/Housecall-Pro-MCP
cd ~/Housecall-Pro-MCP && npm install && npm run build
```

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "housecall-pro": {
      "command": "node",
      "args": ["/Users/YOUR_USER/Housecall-Pro-MCP/dist/index.js"],
      "env": {
        "HOUSECALL_PRO_API_KEY": "YOUR_KEY",
        "HOUSECALL_PRO_AUTH_SCHEME": "auto",
        "HOUSECALL_PRO_BASE_URL": "https://api.housecallpro.com"
      }
    }
  }
}
```

**Security:** Prefer referencing `HCP_API_KEY` from env if your MCP server supports it; do not commit `.cursor/mcp.json` with keys.

### Option B — Scripts only (no MCP)

Use `run_hcp_sync.sh` + ask Cursor to read `external_docs/exports/hcp/*.json`.

## 5. Webhooks (next phase)

Register in HCP for real-time updates:

| Event | Use |
|-------|-----|
| `job.created` | Log to sheet / notify Ryan |
| `job.completed` | Weekly review data |
| `payment.paid` | Cash flow alert |

**Pricebook API paths (live):**

| Resource | Path |
|----------|------|
| Services | `GET /api/price_book/services` |
| Material categories | `GET /api/price_book/material_categories` |
| Materials | `GET /api/price_book/materials` |
| Price forms | `GET /api/price_book/price_forms` |

Do not use `/pricebook/v1/*` — those return 404.

API: `POST /webhook_subscriptions` — see [HCP webhooks docs](https://docs.housecallpro.com/docs/housecall-public-api/46e9e1be07621-webhooks).

Store webhook URL in NGC Admin Bot when built.

## 6. What the AI can do with live HCP

| Question | Source |
|----------|--------|
| "How many jobs in shop today?" | `jobs.json` or MCP |
| "Any lithium jobs waiting on parts?" | Jobs + tags/notes |
| "Is pricebook in sync with knowledge?" | `pricebook_services.json` vs manifest |
| "Morning dispatch briefing" | MCP prompt or `ngc-morning-briefing` skill |

## Privacy

- AI reads job **structure** (status, line items, dates) — **not** customer names/phones in saved knowledge files
- When drafting customer messages, Ryan/Christine pull contact info from HCP directly

## Troubleshooting

| Error | Fix |
|-------|-----|
| HTTP 401 | Regenerate key; confirm Admin role |
| HTTP 403 | Endpoint not on your key scope — use read-only paths |
| Empty jobs | Try `HCP_COMPANY_ID` for multi-location |
| pricebook 404 | API path varies — CSV export still works as fallback |
