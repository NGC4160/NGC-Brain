# NGC Command Center — Setup

**URL:** https://ngc4160.github.io/NGC-Brain/command-center/  
**Access:** Ryan White & Christine White only

## First-time setup (Ryan — 5 minutes)

### 1. Set the access code

1. Open GitHub → **NGC-Brain** repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `NGC_COMMAND_CENTER_PASSWORD`
4. Value: choose a strong access code you and Christine will share
5. Save

### 2. Enable GitHub Pages

1. **Settings** → **Pages**
2. **Source:** GitHub Actions
3. Merge the Command Center PR to `main` — deploy runs automatically

### 3. Share with Christine

Send her:
- URL: https://ngc4160.github.io/NGC-Brain/
- Access code (via text or in person — not in email if avoidable)
- She selects **Christine White** on login

## What's on the Command Center

| Zone | What it does |
|------|----------------|
| **Live Ops** | Operations dashboard, shop board, deposit alerts |
| **Systems** | One-click to HCP, QBO, website, Google Business, Drive, **NGC Enterprise** demo |
| **Daily Rhythm** | Morning briefing, EOD, weekly review, throughput SOPs |
| **Build Pipeline** | Visual P1/P2/P3 backlog — everything being built |
| **Knowledge Base** | Full business brain docs |
| **Tools & Forms** | HR form, Cursor setup, automation playbooks |

**NGC Enterprise demo:** https://ngc4160.github.io/NGC-Brain/enterprise/ (static shop ops UI — `owner@ngc.demo` / `demo1234`)

## Refresh live data

**Automatic:** GitHub Actions runs **Morning Sync** every day at **7:30 AM CST** — pulls HCP + QBO, updates Command Center, deploys to gh-pages.

**Manual** from your machine:

```bash
./scripts/sync/run_morning_sync.sh
git add external_docs/exports/ knowledge/.generated/ docs/
git commit -m "Refresh Command Center live ops data"
git push
```

Or say **"sync HCP"** in Cursor — then commit and push the generated files.

### Required GitHub Actions secrets

| Secret | Purpose |
|--------|---------|
| `HCP_API_KEY` | Housecall Pro API |
| `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET`, `QBO_REALM_ID`, `QBO_REFRESH_TOKEN` | QuickBooks Online API |
| `NGC_COMMAND_CENTER_PASSWORD` | Login gate |

Setup: [`knowledge/10_automation/qbo_api_setup.md`](../knowledge/10_automation/qbo_api_setup.md) and [`hcp_api_setup.md`](../knowledge/10_automation/hcp_api_setup.md)

## Security notes

- Login uses a password hash injected at deploy time (not stored in the repo)
- Session lasts 24 hours per browser tab
- Site is `noindex` — not listed in search engines
- **Stronger privacy:** Make the repo private + GitHub Team plan enables private Pages (true GitHub auth)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Password not configured" | Add `NGC_COMMAND_CENTER_PASSWORD` secret and re-run deploy |
| Dashboard shows zeros | Run HCP sync and push generated files |
| Access denied | Check access code; redeploy after changing secret |

