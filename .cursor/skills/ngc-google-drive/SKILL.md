---
name: ngc-google-drive
description: Access NGC Google Drive through this repo — sync files, read logos and SOPs, list Drive content. Use when user says connect Drive, sync Drive, pull logo, or access Google Drive files.
---

# NGC Google Drive

## Connect (first time)

```bash
./scripts/setup/connect_google_drive.sh
```

Prompts for missing `GOOGLE_DRIVE_*` credentials → saves to `.env` → syncs into repo.

Guide if stuck: `knowledge/10_automation/google_drive_setup.md`

## Sync Drive into repo

```bash
./scripts/sync/run_google_drive_sync.sh
```

Writes to:

- `external_docs/drive/` — folders from `config/google_drive_sync.json`
- `external_docs/assets/` — logo and small brand files
- `external_docs/exports/drive/sync_manifest.json` — index

## Read synced files

After sync, read directly from `external_docs/drive/` and `external_docs/assets/` — works in Cloud Agents without MCP.

## MCP (optional)

For live search / Google Docs in chat: `./scripts/setup/print_google_drive_mcp.sh` → Cursor MCP settings.

## Credentials

Stored in `.env` (gitignored):

- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET`
- `GOOGLE_DRIVE_REFRESH_TOKEN`

Ask the user to supply any missing values — do not invent credentials.

## Never

- Commit OAuth secrets
- Store customer PII from personnel folders in `knowledge/`
