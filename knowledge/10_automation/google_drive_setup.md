# Google Drive Setup (MCP + API)

**Last verified:** 2026-07-06  
**Goal:** Let Cursor read NGC logos, SOPs, Visual Content, and Google Docs/Sheets without relying on Desktop sync.

**Time:** ~15 minutes (one-time)

---

## Why MCP instead of Desktop sync?

| Method | Works in Cloud Agent? | Reads `.gdoc` / `.gsheet`? |
|--------|----------------------|----------------------------|
| Google Drive Desktop → `external_docs/My Drive/` | Only on your Mac when sync is running | No (stub files only) |
| **Google Drive MCP** | Yes | Yes |

Desktop sync symlink in this repo points to your Mac path. Cloud Agents cannot see it. MCP fixes that.

---

## Part 1 — Google Cloud (you do this once)

### 1.1 Open Google Cloud Console

Go to: https://console.cloud.google.com/

Sign in as the account that owns NGC Drive (`neighborhoodgolfcarts985@gmail.com` or your Workspace admin).

### 1.2 Create or select a project

- Click the project dropdown (top bar) → **New Project**
- Name: `NGC Business Brain`
- Click **Create**, then select that project

### 1.3 Enable APIs

Go to **APIs & Services → Library** and enable:

1. **Google Drive API**
2. **Google Docs API** (optional — for reading `.gdoc`)
3. **Google Sheets API** (optional — for reading `.gsheet`)

### 1.4 Configure OAuth consent screen

**APIs & Services → OAuth consent screen**

| Field | Value |
|-------|-------|
| User type | **External** (unless you have Google Workspace org-only) |
| App name | `NGC Business Brain` |
| User support email | Your email |
| Developer contact | Your email |

**Scopes → Add or remove scopes:**

- `https://www.googleapis.com/auth/drive.readonly` — **recommended** (read-only)
- Or `https://www.googleapis.com/auth/drive` if you want the AI to create/edit files later

**Test users → Add users:**

- Add the Google account that owns your Drive files

Click **Save**.

### 1.5 Create OAuth credentials

**APIs & Services → Credentials → Create Credentials → OAuth client ID**

| Field | Value |
|-------|-------|
| Application type | **Desktop app** |
| Name | `NGC Cursor MCP` |

Click **Create**. Copy:

- **Client ID** (ends in `.apps.googleusercontent.com`)
- **Client secret**

Keep this tab open — you need both in Part 2.

---

## Part 2 — Get a refresh token (5 minutes)

### Option A — OAuth Playground (easiest)

1. Open https://developers.google.com/oauthplayground
2. Click the **gear icon** (top right)
3. Check **Use your own OAuth credentials**
4. Paste your **Client ID** and **Client secret**
5. In the left panel, find **Drive API v3**
6. Select: `https://www.googleapis.com/auth/drive.readonly`
7. Click **Authorize APIs** → sign in → **Allow**
8. Click **Exchange authorization code for tokens**
9. Copy the **Refresh token** (long string starting with `1//...`)

### Option B — Script on your Mac

From repo root (after Part 3 `.env` has Client ID + Secret only):

```bash
./scripts/setup/google_drive_auth.py --authorize
```

Opens a browser locally, saves refresh token to `.env`.

---

## Part 3 — Save credentials locally

```bash
cp .env.example .env
```

Edit `.env` and add:

```bash
GOOGLE_DRIVE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=your-client-secret
GOOGLE_DRIVE_REFRESH_TOKEN=1//your-refresh-token
```

**Never commit `.env`.** It is already in `.gitignore`.

---

## Part 4 — Add MCP to Cursor

### 4.1 Generate config from `.env`

```bash
./scripts/setup/print_google_drive_mcp.sh
```

Copy the JSON output.

### 4.2 Paste into Cursor

**Cursor → Settings → Tools & MCP → New MCP Server**

Or edit user-level `~/.cursor/mcp.json` (recommended for secrets — not committed to git).

Paste the `google-drive` block from the script output.

### 4.3 Restart MCP / new agent session

- Toggle the `google-drive` server off and on, or restart Cursor
- Start a **new Cloud Agent** chat (MCP loads at session start)

---

## Part 5 — Verify connection

```bash
./scripts/setup/run_google_drive_test.sh
```

Expected:

```
OK — Google Drive API reachable
Found N files (sample):
  PNG Transparent 3.png
  ...
```

In Cursor, ask:

> List files in my Google Drive matching "logo" or "PNG Transparent"

---

## What Ryan should see in Drive (quick reference)

| Path | Contents |
|------|----------|
| `PNG Transparent 3.png` | Master logo (transparent) |
| `Visual Content/` | Marketing photos, lithium before/after, video |
| `NGC Document Repository/` | SOPs, manuals, procedures |
| `Management/` | Personnel forms, internal docs |

Local copy of logo (fallback): `external_docs/templates/personnel_counseling/assets/ngc-logo.png`

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `access_denied` | Add yourself as **Test user** on OAuth consent screen |
| `invalid_grant` / refresh token expired | Re-run OAuth Playground (Part 2) |
| `redirect_uri_mismatch` | Use OAuth Playground with gear → own credentials |
| MCP shows no tools | Node 18+ required; restart Cursor |
| Cloud Agent can't see Drive | MCP must be in **user** Cursor settings, not only project |
| `.gdoc` won't open via sync | Use MCP — Desktop sync only gives stub files |

---

## Security

- Use `drive.readonly` unless you need write access
- Keep Client Secret and Refresh Token in `.env` or Cursor MCP env — never in git
- Do not ask the AI to output customer PII from Drive personnel folders

---

## Next steps after connect

1. Ask agent to pull logo variants into `external_docs/assets/`
2. Export key sheets nightly to `external_docs/exports/drive/` (future automation)
3. Log completion in `knowledge/09_daily_ops/decision_log.md` if you want it tracked
