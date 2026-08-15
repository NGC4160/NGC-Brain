# Daily Morning Briefing Email

**Last verified:** 2026-08-15  
**Recipient:** Ryan@NGCgolfcarts.com  
**Schedule:** Daily with Morning Sync — **7:30 AM CST** (`30 13 * * *` UTC; 8:30 AM during CDT)

## What you get

A short, no-PII service-manager briefing:

1. Top 3 priorities
2. Lithium jobs at risk of missing the 2–3 day promise
3. Deposit / parts-order follow-ups for Jesse
4. One P1 from the improvement backlog
5. What is still needed (staff, Roy routes, urgent)

Source files: `shop_throughput.md`, live HCP jobs, `deposit_alerts.md`, `improvement_backlog.md`.

## Cron (already in repo)

GitHub Action [`.github/workflows/morning-sync.yml`](../../.github/workflows/morning-sync.yml):

1. Pull HCP + QBO
2. Rebuild shop board + deposit alerts
3. Generate `knowledge/.generated/morning_briefing.md`
4. Deploy Command Center
5. Email the briefing to Ryan@NGCgolfcarts.com

Manual: **Actions → Morning Sync → Run workflow**  
Local: `./scripts/sync/run_morning_briefing.sh`

## One-time: add SMTP secrets

Email is skipped (with a warning) until these GitHub Actions secrets exist:

| Secret | Example | Notes |
|--------|---------|--------|
| `SMTP_HOST` | `smtp.gmail.com` | Google Workspace |
| `SMTP_USER` | `Ryan@NGCgolfcarts.com` | Full mailbox |
| `SMTP_PASSWORD` | app password | **Not** the login password |
| `SMTP_PORT` | `587` | Optional (default 587) |
| `SMTP_FROM` | `Ryan@NGCgolfcarts.com` | Optional |
| `BRIEFING_EMAIL_TO` | `Ryan@NGCgolfcarts.com` | Optional; this is the default |

### Google Workspace app password

1. Google Account → Security → 2-Step Verification (on)
2. App passwords → Mail / Other → generate
3. Paste into `SMTP_PASSWORD`
4. Repo → **Settings → Secrets and variables → Actions → New repository secret**

Never commit `.env` or the app password.

## Privacy

The generator refuses to write the file if a customer last name, email, phone, or street appears in the output. Staff **first names** only. Open HCP for customer contact.

## Cursor Automation (optional)

If you also want a Cursor Cloud Agent cron (Agents Window → Automations):

| Field | Value |
|-------|-------|
| Trigger | Cron `30 13 * * *` (same as Actions) |
| Prompt | Contents of `prompts/morning_briefing.md` |

Prefer the GitHub Action for email — it uses live HCP data and does not need a Cursor session open.
