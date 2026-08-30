#!/usr/bin/env python3
"""NGC Drive catalog — list staff files, never download binaries.

Writes knowledge/.generated/drive_catalog.md + drive_catalog.json.

Live file content stays in Drive. Shop bots read via the Google Drive connector.
GitHub Actions cannot use MCP; it uses GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON if set.

If that secret is missing, exit 0 (do not fail HCP/QBO morning-sync).
Never git-adds PDFs/zips. Skips File_000 and files larger than 10MB.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "knowledge" / ".generated"
SEED_PATH = Path(__file__).resolve().parent / "drive_catalog_seed.json"

ROOT_FOLDER_ID = "1koI6xu03NfGzr7AMKaAnCHiguZOU7L6r"
RECURSE_FOLDERS = {
    "1-NjzSQxTsbXqlOhbK7ptZzg1H5G2ntdh": "Procedures",
    "1aNp0s5gGqq6B_SjxpAyCU3O-IkzUFPkp": "Checklists",
    "1-1QqJQh4UojQEERawwpfEjKYOor2VMuR": "Manuals",
}
SKIP_IDS = {"1JABSf3vzt4W0PLjTSEPsZdX06dKJLP-j"}
SKIP_NAMES = {"File_000"}
MAX_BYTES = 10 * 1024 * 1024
DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly"


def _now() -> str:
    return datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _short_mime(mime: str) -> str:
    mapping = {
        "application/pdf": "pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "application/vnd.google-apps.document": "gdoc",
        "application/vnd.google-apps.spreadsheet": "gsheet",
        "application/vnd.google-apps.folder": "folder",
        "application/vnd.google-apps.shortcut": "shortcut",
        "application/x-zip": "zip",
        "application/zip": "zip",
    }
    return mapping.get(mime, mime.split("/")[-1] if mime else "")


def _view_url(file_id: str, mime: str) -> str:
    if mime == "application/vnd.google-apps.folder":
        return f"https://drive.google.com/drive/folders/{file_id}"
    if mime == "application/vnd.google-apps.document":
        return f"https://docs.google.com/document/d/{file_id}/edit"
    if mime == "application/vnd.google-apps.spreadsheet":
        return f"https://docs.google.com/spreadsheets/d/{file_id}/edit"
    return f"https://drive.google.com/file/d/{file_id}/view"


def _skip_reason(item: dict) -> str | None:
    name = str(item.get("name") or "")
    file_id = str(item.get("id") or "")
    size = item.get("size_bytes")
    if file_id in SKIP_IDS or name in SKIP_NAMES:
        return "File_000 zip (~319MB) — do not download or git-add"
    if isinstance(size, int) and size > MAX_BYTES:
        return f"larger than 10MB ({size} bytes) — catalog only, not downloaded"
    return None


def load_service_account() -> object | None:
    raw = os.environ.get("GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON", "").strip()
    if not raw:
        return None
    try:
        info = json.loads(raw) if raw.startswith("{") else json.loads(Path(raw).read_text())
    except (OSError, json.JSONDecodeError) as exc:
        print(f"DRIVE: bad GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON ({exc})", file=sys.stderr)
        return None
    try:
        from google.auth.transport.requests import Request
        from google.oauth2 import service_account
    except ImportError:
        print("DRIVE: google-auth not installed — skip live list", file=sys.stderr)
        return None
    creds = service_account.Credentials.from_service_account_info(info, scopes=[DRIVE_SCOPE])
    creds.refresh(Request())
    return creds


def drive_list_children(creds: object, folder_id: str) -> list[dict]:
    token = creds.token  # type: ignore[attr-defined]
    fields = "nextPageToken,files(id,name,mimeType,modifiedTime,size,parents,webViewLink)"
    items: list[dict] = []
    page = None
    while True:
        q = f"'{folder_id}' in parents and trashed = false"
        params = {
            "q": q,
            "fields": fields,
            "pageSize": "200",
            "supportsAllDrives": "true",
            "includeItemsFromAllDrives": "true",
        }
        if page:
            params["pageToken"] = page
        url = "https://www.googleapis.com/drive/v3/files?" + urllib.parse.urlencode(params)
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                payload = json.loads(resp.read().decode())
        except urllib.error.HTTPError as exc:
            print(f"DRIVE: list failed for {folder_id}: HTTP {exc.code}", file=sys.stderr)
            break
        for f in payload.get("files") or []:
            mime = f.get("mimeType") or ""
            size = f.get("size")
            items.append(
                {
                    "name": f.get("name"),
                    "id": f.get("id"),
                    "mime": mime,
                    "modifiedTime": (f.get("modifiedTime") or "")[:10],
                    "parent_id": folder_id,
                    "view_url": f.get("webViewLink") or _view_url(f.get("id", ""), mime),
                    "size_bytes": int(size) if size not in (None, "") else None,
                }
            )
        page = payload.get("nextPageToken")
        if not page:
            break
    return items


def list_live(creds: object) -> list[dict]:
    names = {
        ROOT_FOLDER_ID: "NGC Document Repository",
        **RECURSE_FOLDERS,
    }
    out: list[dict] = []

    def walk(folder_id: str, folder_name: str, recurse: bool) -> None:
        for item in drive_list_children(creds, folder_id):
            item["parent_name"] = folder_name
            reason = _skip_reason(item)
            if reason:
                item["skipped"] = True
                item["skip_reason"] = reason
            out.append(item)
            if recurse and item.get("mime") == "application/vnd.google-apps.folder" and item.get("id"):
                child_id = item["id"]
                names[child_id] = item["name"]
                walk(child_id, item["name"], True)

    walk(ROOT_FOLDER_ID, "NGC Document Repository", False)
    for fid, fname in RECURSE_FOLDERS.items():
        walk(fid, fname, True)
    return out


def items_from_seed() -> tuple[list[dict], dict]:
    seed = json.loads(SEED_PATH.read_text())
    items: list[dict] = []
    for folder in seed.get("folders") or []:
        row = dict(folder)
        row.setdefault("parent_name", row.get("parent_name") or "")
        items.append(row)
    for item in seed.get("items") or []:
        row = dict(item)
        reason = _skip_reason(row) or row.get("skip_reason")
        if reason:
            row["skipped"] = True
            row["skip_reason"] = reason
        items.append(row)
    return items, seed


def write_catalog(items: list[dict], *, listed_at: str, source: str, notes: list[str]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "generated": True,
        "not_policy": True,
        "listed_at": listed_at,
        "source": source,
        "root_folder_id": ROOT_FOLDER_ID,
        "notes": notes,
        "items": items,
    }
    json_path = OUT_DIR / "drive_catalog.json"
    json_path.write_text(json.dumps(payload, indent=2) + "\n")

    lines = [
        "# Drive catalog (GENERATED — not policy)",
        "",
        f"**Listed:** {listed_at}  ",
        f"**Source:** {source}  ",
        "**Staff files stay in Drive.** Bots read content via the Google Drive connector (NGC985).  ",
        "This file tracks names, ids, mime, modifiedTime, parent folder, and view URL only.  ",
        "`external_docs/My Drive/` is **not** a live sync.",
        "",
        "## Missing official forms",
        "",
        "- **NGC-QC-1** and **NGC-IR-1** were **not** found in Drive Procedures by those titles (2026-08-30 NGC985 listing).",
        "- Keep the short rules in `knowledge/04_operations/shop_workflow.md`. Not yet in Drive Procedures.",
        "",
        "## Notes",
        "",
    ]
    for note in notes:
        lines.append(f"- {note}")
    lines += [
        "",
        "| Name | Id | Mime | Modified | Parent | View | Skip |",
        "|------|----|------|----------|--------|------|------|",
    ]
    for item in items:
        skip = item.get("skip_reason") or ""
        mime = _short_mime(str(item.get("mime") or ""))
        lines.append(
            "| {name} | `{id}` | {mime} | {mod} | {parent} | [open]({url}) | {skip} |".format(
                name=(item.get("name") or "").replace("|", "/"),
                id=item.get("id") or "",
                mime=mime,
                mod=item.get("modifiedTime") or "",
                parent=item.get("parent_name") or "",
                url=item.get("view_url") or "",
                skip=skip.replace("|", "/"),
            )
        )
    lines += [
        "",
        "Regenerate: `python3 scripts/sync/run_drive_sync.py` (live if `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON` is set).",
        "",
    ]
    (OUT_DIR / "drive_catalog.md").write_text("\n".join(lines))
    print(f"DRIVE: wrote {json_path.relative_to(ROOT)} and drive_catalog.md ({len(items)} rows)")


def main() -> int:
    parser = argparse.ArgumentParser(description="NGC Drive catalog sync")
    parser.add_argument(
        "--seed",
        action="store_true",
        help="Write the 2026-08-30 NGC985 seed listing (no API call)",
    )
    args = parser.parse_args()

    if args.seed:
        items, seed = items_from_seed()
        write_catalog(
            items,
            listed_at=str(seed.get("listed_at") or "2026-08-30"),
            source=str(seed.get("source") or "NGC985 seed"),
            notes=list(seed.get("notes") or []),
        )
        return 0

    creds = load_service_account()
    if creds is None:
        print("DRIVE: skip — GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON not set (MCP is for shop bots; Actions needs this secret)")
        return 0

    print("DRIVE: listing NGC Document Repository (catalog only, no binaries)")
    items = list_live(creds)
    notes = [
        "Live Drive list via service account. Staff SOPs stay in Drive.",
        "File_000 and files >10MB are skipped (not downloaded).",
        "NGC-QC-1 / NGC-IR-1: confirm in Procedures — not present on 2026-08-30 seed.",
    ]
    write_catalog(items, listed_at=_now()[:10], source="Google Drive API (service account)", notes=notes)
    return 0


if __name__ == "__main__":
    sys.exit(main())
