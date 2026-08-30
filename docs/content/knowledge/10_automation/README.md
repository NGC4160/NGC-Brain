# NGC Automation Architecture

**Last verified:** 2026-08-30  
**Goal:** Replace manual exports and copy-paste prompts with connectors, scheduled jobs, and live data where APIs allow.  
**COS:** **Chief** (Grok Bot) is Ryan’s only point of contact. This folder is connectors + scripts — not a second COS. Live roster: [`05_team/roles.md`](../05_team/roles.md).

## Automation stack (target state)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Cursor Business Brain                        │
│  Rules · Skills · Hooks · knowledge/ · prompts/                  │
│  Chief (COS) + shop bots operate from here and write facts back  │
└────────────┬───────────────────────────────┬────────────────────┘
             │                               │
    ┌────────▼────────┐              ┌───────▼────────┐
    │  Local sync     │              │  Live MCP/API  │
    │  (today)        │              │  (connect)     │
    ├─────────────────┤              ├────────────────┤
    │ HCP CSV / API   │              │ QuickBooks MCP │
    │ QBO xlsx / API  │              │ HCP API (MAX)  │
    │ (Drive not      │              │ Zapier/Make    │
    │  auto-synced)   │              │ Everlogic API  │
    └─────────────────┘              └────────────────┘
```

## Phase map

| Phase | What | Effort | Status |
|-------|------|--------|--------|
| **0** | Manual exports + `scripts/sync/ingest_exports.py` | Done | ✅ Built |
| **1** | Session hooks + project skills | Low | ✅ Built |
| **2** | QuickBooks MCP (live P&L, COA, no export) | Medium | 🔲 Template ready |
| **3** | **HCP API sync** (MAX plan) | Medium | ✅ Scripts + daily GitHub Action |
| **3b** | **QBO API sync** (morning pull) | Medium | ✅ Live — daily GitHub Action |
| **4** | Cursor Automations (scheduled weekly review) | Low | 🔲 Agents Window |
| **5** | Deposit-alert **batch script** + future webhooks | High | 🟡 Phase 1 live — **not** a Grok Bot / not COS |

## What runs automatically today

| Trigger | Action |
|---------|--------|
| **Daily 7:30 AM CST** | GitHub Action `morning-sync.yml` — HCP + QBO API → Command Center |
| **Cursor session start** | Hook runs `ingest_exports.py` → updates `knowledge/.generated/sync_manifest.json` |
| **After export file edit** | Hook re-runs ingest |
| **You say `/sync`** or "sync exports" | Skill runs ingest + offers knowledge diff |

Run manually anytime:

```bash
./scripts/sync/run_morning_sync.sh   # full HCP + QBO + Command Center
./scripts/sync/run_ingest.sh         # exports only
```

## Connectors to set up (priority order)

### 1. QuickBooks Online MCP — **do this first**

**Why:** Eliminates monthly xlsx exports; live P&L, balance sheet, COA, aged AR.

**Steps:** See [integration_playbook.md](integration_playbook.md#quickbooks-online-mcp)

**Template:** [`../../.cursor/mcp.json.example`](../../.cursor/mcp.json.example)

### 2. Google Drive — **not live-synced (do not invent a Drive API in this brain)**

Staff SOPs live in Drive Procedures. This brain **points at** folder IDs — it does **not** auto-pull Drive. Morning sync is HCP + QBO only. `.gitmodules` is only GarageBuddy.

- Repository: [1koI6xu03NfGzr7AMKaAnCHiguZOU7L6r](https://drive.google.com/drive/folders/1koI6xu03NfGzr7AMKaAnCHiguZOU7L6r)
- Procedures: [1-NjzSQxTsbXqlOhbK7ptZzg1H5G2ntdh](https://drive.google.com/drive/folders/1-NjzSQxTsbXqlOhbK7ptZzg1H5G2ntdh)

A future Drive MCP is backlog only. Do not treat `external_docs/My Drive/` as a working connector.

### 3. Housecall Pro

| Option | Pros | Cons |
|--------|------|------|
| **Keep CSV export** (current) | Free, works now | Manual, not real-time |
| **HCP Public API** (MAX/XL plan) | Jobs, customers, webhooks | Plan cost; build custom MCP |
| **Zapier / Make** | HCP → Drive/Sheets/QBO triggers | Per-zap cost; less control |

**Webhooks (if API):** job.created, job.completed, payment.received → update knowledge or Slack

### 4. Cursor Automations (scheduled agent)

| Automation | Schedule | Prompt |
|------------|----------|--------|
| Weekly business review | Fri 4 PM | `prompts/weekly_review.md` |
| Monthly knowledge refresh | 1st of month | `prompts/monthly_refresh.md` |
| Pricebook drift check | Mon 8 AM | Compare HCP export vs `knowledge/` |

Create via **Cursor Automations** (Agents Window) — see skill `automate`.

### 5. Everlogic (future DMS)

When selected: API or export sync for inventory, ROs, customers. Plan migration in `knowledge/06_systems/tools.md`.

## Secrets & config

| File | Purpose |
|------|---------|
| `.env` | API keys (gitignored) — copy from `.env.example` |
| `.cursor/mcp.json` | MCP server config (gitignore if contains secrets) |
| `.cursor/mcp.json.example` | Safe template committed to repo |

**Never commit:** HCP API key, QBO client secret, OAuth tokens.

## Files in this folder

| File | Purpose |
|------|---------|
| [integration_playbook.md](integration_playbook.md) | Step-by-step setup for each connector |
| [hcp_api_setup.md](hcp_api_setup.md) | HCP API key + sync scripts |
| [qbo_api_setup.md](qbo_api_setup.md) | QBO OAuth + morning sync secrets |
| [automations_catalog.md](automations_catalog.md) | Recommended Cursor Automations + Zapier recipes |
| [ngc_admin_bot_spec.md](ngc_admin_bot_spec.md) | Planned **batch** deposit alerts — not a Grok Bot / not COS |

## Success metrics

- **Zero manual QBO export** for routine questions (after MCP live)
- **Pricebook sync** ≤ 24h stale (API or weekly export + hook)
- **Morning briefing** in one prompt with live job count (after HCP connector)
- **Knowledge diff** auto-suggested when exports change
