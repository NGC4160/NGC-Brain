# Google Drive Setup

**Connect in one command:**

```bash
./scripts/setup/connect_google_drive.sh
```

The script asks only for credentials you haven't saved yet, tests the connection, and syncs files into this repo.

---

## What you need (one-time, ~10 min)

Google Cloud OAuth credentials for the account that owns NGC Drive.

| Credential | Where to get it |
|------------|-----------------|
| **Client ID** | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth client (Desktop) |
| **Client Secret** | Same screen |
| **Refresh token** | [OAuth Playground](https://developers.google.com/oauthplayground) with your own credentials → Drive API v3 → `drive.readonly` |

### Quick Cloud Console checklist

1. Create project **NGC Business Brain**
2. Enable **Google Drive API** (+ Docs/Sheets optional)
3. OAuth consent screen → External → add yourself as **test user**
4. Scope: `https://www.googleapis.com/auth/drive.readonly`
5. Credentials → OAuth client ID → **Desktop app**

### Quick OAuth Playground

1. Gear icon → **Use your own OAuth credentials**
2. Drive API v3 → `https://www.googleapis.com/auth/drive.readonly`
3. Authorize → Exchange → copy **refresh token**

---

## After connect

| What | Where |
|------|-------|
| Credentials (gitignored) | `.env` |
| Synced Drive files | `external_docs/drive/` |
| Logo copy | `external_docs/assets/` |
| Sync manifest | `external_docs/exports/drive/sync_manifest.json` |
| Re-sync anytime | `./scripts/sync/run_google_drive_sync.sh` |

Edit `config/google_drive_sync.json` to add folders or files.

---

## Optional: live Drive in Cursor chat

```bash
./scripts/setup/print_google_drive_mcp.sh
```

Paste into **Cursor → Settings → Tools & MCP** (user-level). Restart MCP / new agent session.

Repo sync works without MCP — MCP adds live search and Google Docs reading in chat.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `access_denied` | Add yourself as OAuth **test user** |
| `invalid_grant` | Re-run OAuth Playground for a new refresh token |
| `not configured` | Run `./scripts/setup/connect_google_drive.sh` |
| Cloud Agent can't see Mac sync | Use repo sync (`run_google_drive_sync.sh`) — Desktop symlink doesn't work in cloud |

---

## Security

- Credentials stay in `.env` (never commit)
- Use `drive.readonly` unless you need write access
- Don't sync confidential personnel records into shared knowledge files
