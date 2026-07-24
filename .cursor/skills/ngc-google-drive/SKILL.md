---
name: ngc-google-drive
description: Access NGC Google Drive via API (cloud-safe, no Mac required). Use when user says connect Drive, sync Drive, pull logo, search Drive, file to Personnel, or access Google Drive files.
---

# NGC Google Drive

## Connect (first time)

Guide: `knowledge/10_automation/google_drive_setup.md`

If the user pastes the three credentials, save non-interactively:

```bash
./scripts/setup/connect_google_drive.sh --save "$CLIENT_ID" "$CLIENT_SECRET" "$REFRESH_TOKEN"
```

Or:

```bash
./scripts/setup/connect_google_drive.sh
```

Remind them to also store the same three values as **Cursor Environment secrets** so future cloud agents work with no Mac on.

## Sync Drive into repo

```bash
./scripts/sync/run_google_drive_sync.sh
```

Writes to:

- `external_docs/drive/` — folders from `config/google_drive_sync.json` (gitignored)
- `external_docs/assets/` — logo and small brand files
- `external_docs/exports/drive/sync_manifest.json` — index

## Search / download (ad-hoc)

```bash
python3 scripts/drive/search_drive.py Couvillion
python3 scripts/drive/search_drive.py Couvillioncounseling --download-dir /tmp/ngc-drive
```

## Read synced files

After sync, read `external_docs/drive/` and `external_docs/assets/` — works in Cloud Agents without MCP.

## File counseling / move audio

Use `scripts/connectors/google_drive_client.py` helpers (`ensure_path`, `upload_file`, `move_file`) into Drive folder **`Management / Personnel /`**. Never commit those files to git.

## MCP (optional, desktop)

`./scripts/setup/print_google_drive_mcp.sh` → Cursor MCP settings.

## Credentials

`.env` (gitignored) and/or Cursor Environment secrets:

- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET`
- `GOOGLE_DRIVE_REFRESH_TOKEN`

Ask the user to supply any missing values — do not invent credentials.

## Never

- Commit OAuth secrets
- Store customer PII or completed personnel counseling files in `knowledge/`
- Assume Mac `external_docs/My Drive` symlink works in cloud (it does not)
