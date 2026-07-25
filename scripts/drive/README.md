# Google Drive CLI helpers

```bash
# Search by name substring
python3 scripts/drive/search_drive.py Couvillioncounseling

# Download matches
python3 scripts/drive/search_drive.py Couvillioncounseling --download-dir /tmp/ngc-drive
```

Requires `GOOGLE_DRIVE_*` in `.env` — see `knowledge/10_automation/google_drive_setup.md`.
