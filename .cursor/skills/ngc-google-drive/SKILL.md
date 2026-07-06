---
name: ngc-google-drive
description: Read NGC files from Google Drive via MCP or API test scripts — logos, Visual Content, SOPs, Docs/Sheets. Use when user says connect Drive, pull logo from Drive, list Drive files, or sync brand assets.
---

# NGC Google Drive

## Prerequisites

- Google Drive MCP configured in Cursor **user** MCP settings
- Or `.env` with `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN`

Setup guide: `knowledge/10_automation/google_drive_setup.md`

## Test API connection (no MCP)

```bash
./scripts/setup/run_google_drive_test.sh
```

## MCP (preferred in chat)

If `google-drive` MCP tools are available, use them to:

- Search/list files (logos, Visual Content, Document Repository)
- Read Google Docs and Sheets content
- Download brand assets to `external_docs/assets/`

## Key Drive paths

| Path | Contents |
|------|----------|
| `PNG Transparent 3.png` | Master logo |
| `Visual Content/` | Marketing media |
| `NGC Document Repository/` | SOPs, manuals |
| `Management/` | Internal forms (confidential — no PII in knowledge/) |

## Local fallbacks

- Logo copy: `external_docs/templates/personnel_counseling/assets/ngc-logo.png`
- Brand cache folder: `external_docs/assets/`

## Never

- Commit OAuth secrets to git
- Store customer PII from personnel folders in `knowledge/`
