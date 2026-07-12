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
| **Systems** | One-click to HCP, QBO, website, Google Business, Drive |
| **Daily Rhythm** | Morning briefing, EOD, weekly review, throughput SOPs |
| **Build Pipeline** | Visual P1/P2/P3 backlog — everything being built |
| **Knowledge Base** | Full business brain docs |
| **Tools & Forms** | HR form, Cursor setup, automation playbooks |

## Refresh live data

The dashboard reads HCP job exports. Refresh from your machine:

```bash
./scripts/sync/run_hcp_sync.sh
git add knowledge/.generated/ external_docs/exports/hcp/
git commit -m "Refresh Command Center live ops data"
git push
```

Or say **"sync HCP"** in Cursor — then commit and push the generated files.

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

