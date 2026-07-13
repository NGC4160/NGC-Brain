# QuickBooks Online API Setup (Morning Sync)

**Last verified:** 2026-07-13  
**Purpose:** Automated daily pull of P&L, balance sheet, COA, and products/services for the NGC Command Center.

## Prerequisites

- QuickBooks Online **Admin** access (Neighborhood Golf Carts)
- [Intuit Developer](https://developer.intuit.com/) account (free)
- GitHub repo access to add Actions secrets

## 1. Create Intuit app (one time)

1. [developer.intuit.com](https://developer.intuit.com/) → **Create an app** → **QuickBooks Online**
2. Scopes: `com.intuit.quickbooks.accounting`
3. Redirect URI: `http://localhost:8000/callback` (for local OAuth only)
4. Copy **Client ID** and **Client Secret**

## 2. Get OAuth refresh token (one time)

Run locally from repo root after filling `.env`:

```bash
cp .env.example .env
# Add QBO_CLIENT_ID, QBO_CLIENT_SECRET, QBO_REALM_ID (company ID from QBO URL)
python3 scripts/connectors/qbo_oauth_setup.py
```

Follow the browser link, authorize NGC, paste the redirect URL. The script prints `QBO_REFRESH_TOKEN=...` — add to `.env`.

**Find realm ID:** In QBO, open any page — URL contains `.../app/homepage?companyId=1234567890` — that number is `QBO_REALM_ID`.

## 3. Test sync locally

```bash
pip install -r requirements.txt
./scripts/sync/sync_qbo_api.py
```

Expected output in `external_docs/exports/qbo/`:

- `profit_and_loss_last_12_months.json` + `.xlsx`
- `balance_sheet.json`
- `chart_of_accounts.json`
- `products_services.json`
- `api_sync_manifest.json`

## 4. Add GitHub Actions secrets

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Value |
|--------|-------|
| `HCP_API_KEY` | From HCP Admin → App Store → Generate API Key |
| `QBO_CLIENT_ID` | Intuit app Client ID |
| `QBO_CLIENT_SECRET` | Intuit app Client Secret |
| `QBO_REALM_ID` | QBO company ID |
| `QBO_REFRESH_TOKEN` | From OAuth setup script |
| `QBO_ENVIRONMENT` | `production` (or `sandbox` for testing) |
| `NGC_COMMAND_CENTER_PASSWORD` | Command Center access code |

## 5. Schedule

GitHub Actions workflow `.github/workflows/morning-sync.yml` runs daily at **7:30 AM CST** (`30 13 * * *` UTC).

During daylight saving (CDT), the job runs at **8:30 AM** local — adjust cron in March/November if you want exactly 7:30 year-round.

Manual run: **Actions** → **Morning Sync** → **Run workflow**.

## What gets updated

```
HCP API  → external_docs/exports/hcp/
QBO API  → external_docs/exports/qbo/
         → knowledge/.generated/sync_manifest.json
         → shop_board.md, deposit_alerts.md
         → docs/live/ (Command Center)
         → gh-pages deploy
```

Sync status: `docs/live/sync_status.json` (shown on Operations Dashboard).

## Token rotation

Intuit may return a new refresh token on each use. If morning sync logs `refresh_token_rotated`, update the `QBO_REFRESH_TOKEN` GitHub secret with the new value from `external_docs/exports/qbo/api_sync_manifest.json` or local `.env`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `QBO_REFRESH_TOKEN not set` | Complete OAuth setup; add secret |
| HTTP 401 on token refresh | Re-run OAuth — refresh token expired or revoked |
| P&L xlsx missing | `pip install openpyxl` (included in `requirements.txt`) |
| Workflow succeeds but dashboard stale | Check Actions log for "No changes to commit" — verify API keys |
| Customer names in exports | Scripts pull reports/accounts only — no customer PII by design |

## Related

- [hcp_api_setup.md](hcp_api_setup.md) — Housecall Pro API
- [integration_playbook.md](integration_playbook.md) — QBO MCP for live chat queries
- [../docs/COMMAND_CENTER.md](../../docs/COMMAND_CENTER.md) — Command Center setup
