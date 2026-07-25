# Google Drive Setup (Cloud Agents)

**Goal:** Cloud agents reach NGC Google Drive **without any Mac left on**.  
Desktop Google Drive sync (`external_docs/My Drive` symlink) does **not** work in the cloud.

**Connect:**

```bash
./scripts/setup/connect_google_drive.sh
```

Or paste the three values in chat and say “save Drive credentials”.

---

## One-time setup (~10 min on phone or laptop)

Use the Google account that owns NGC Drive (`neighborhoodgolfcarts985@gmail.com`).

### A. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create (or select) project **NGC Business Brain**
3. **APIs & Services → Library** → enable **Google Drive API**
4. **OAuth consent screen**
   - User type: **External**
   - App name: NGC Business Brain
   - Add yourself as **Test user** (your Gmail)
5. **Credentials → Create credentials → OAuth client ID**
   - Application type: **Desktop app**
   - Name: NGC Brain Desktop
6. Copy **Client ID** and **Client Secret**

### B. Refresh token (OAuth Playground)

1. Open [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
2. Gear (top right) → check **Use your own OAuth credentials** → paste Client ID + Secret
3. Left panel → **Drive API v3** → select:
   - `https://www.googleapis.com/auth/drive`  
     (full access — needed so agents can **upload counseling PDFs** and **move audio**)
4. **Authorize APIs** → sign in as the NGC Drive owner → Allow
5. **Exchange authorization code for tokens** → copy **Refresh token**

### C. Give credentials to Cursor

**Option 1 — this chat (fastest):** reply with:

```
GOOGLE_DRIVE_CLIENT_ID=...
GOOGLE_DRIVE_CLIENT_SECRET=...
GOOGLE_DRIVE_REFRESH_TOKEN=...
```

I’ll save them to `.env` (gitignored) and test the connection.

**Option 2 — Cursor Environment secrets (survives every cloud agent):**  
cursor.com → **Environments** → NGC Brain / this repo → add the same three secrets.  
Then every new Cloud Agent can use Drive with no Mac and no re-paste.

**Option 3 — local terminal:**

```bash
./scripts/setup/connect_google_drive.sh --save CLIENT_ID CLIENT_SECRET REFRESH_TOKEN
```

---

## After connect

| What | Where |
|------|-------|
| Credentials | `.env` (gitignored) + Cursor Environment secrets |
| Synced folders | `external_docs/drive/` (gitignored mirror) |
| Logo | `external_docs/assets/` |
| Sync manifest | `external_docs/exports/drive/sync_manifest.json` |
| Search | `python3 scripts/drive/search_drive.py Couvillion` |
| Re-sync | `./scripts/sync/run_google_drive_sync.sh` |

Edit what syncs: `config/google_drive_sync.json`.

### Personnel / counseling files

- File completed forms in Drive: **`Management / Personnel /`**
- Do **not** commit personnel PDFs or counseling audio into git / `knowledge/`
- Agents may download those via API into a gitignored path when you ask

### iCloud vs Google Drive

iCloud and Google Drive are separate. Audio sitting only in **iCloud Drive** is invisible here.  
Copy those files into Google Drive (e.g. `Management / Personnel / Audio/`) once, then cloud agents can find and file them.

---

## Optional: live Drive MCP in Cursor desktop

```bash
./scripts/setup/print_google_drive_mcp.sh
```

Paste into **Cursor → Settings → Tools & MCP**. Repo sync works without MCP.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `access_denied` | Add your Gmail as OAuth **test user** |
| `invalid_grant` | New refresh token from OAuth Playground (use `drive` scope) |
| `insufficientPermissions` | Re-authorize with `https://www.googleapis.com/auth/drive` (not readonly) |
| `not configured` | Paste the three `GOOGLE_DRIVE_*` values |
| Cloud Agent can't see Mac folders | Expected — use this API setup, not Desktop sync |

---

## Security

- Never commit OAuth secrets
- Prefer Cursor Environment secrets for cloud agents
- Don’t sync confidential personnel records into tracked `knowledge/` files
