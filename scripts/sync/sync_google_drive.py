#!/usr/bin/env python3
"""Sync configured Google Drive files/folders into external_docs/ for repo access."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

from connectors.google_drive_client import (  # noqa: E402
    download_file,
    find_first,
    get_client,
    list_folder_children,
)

CONFIG_PATH = ROOT / "config" / "google_drive_sync.json"
DRIVE_ROOT = ROOT / "external_docs" / "drive"
MANIFEST_PATH = ROOT / "external_docs" / "exports" / "drive" / "sync_manifest.json"
FOLDER_MIME = "application/vnd.google-apps.folder"


def safe_name(name: str) -> str:
    return name.replace("/", "-").replace("\0", "")


def sync_folder_tree(
    access_token: str,
    folder_id: str,
    dest_dir: Path,
    max_files: int,
    depth: int = 0,
    max_depth: int = 2,
) -> list[dict]:
    synced: list[dict] = []
    if len(synced) >= max_files or depth > max_depth:
        return synced

    children = list_folder_children(access_token, folder_id, page_size=max_files)
    for item in children:
        if len(synced) >= max_files:
            break
        name = safe_name(item["name"])
        mime = item.get("mimeType", "")
        file_id = item["id"]
        if mime == FOLDER_MIME:
            sub_synced = sync_folder_tree(
                access_token,
                file_id,
                dest_dir / name,
                max_files - len(synced),
                depth + 1,
                max_depth,
            )
            synced.extend(sub_synced)
            continue

        dest = dest_dir / name
        if mime in {
            "application/vnd.google-apps.document",
            "application/vnd.google-apps.spreadsheet",
            "application/vnd.google-apps.presentation",
        }:
            dest = dest.with_suffix(".pdf" if "spreadsheet" not in mime else ".xlsx")
        try:
            download_file(access_token, file_id, mime, dest)
            synced.append(
                {
                    "name": item["name"],
                    "dest": str(dest.relative_to(ROOT)),
                    "mimeType": mime,
                    "modifiedTime": item.get("modifiedTime"),
                }
            )
        except Exception as exc:  # noqa: BLE001
            synced.append({"name": item["name"], "error": str(exc)})
    return synced


def main() -> int:
    if not CONFIG_PATH.exists():
        print(f"Missing config: {CONFIG_PATH}", file=sys.stderr)
        return 1

    config = json.loads(CONFIG_PATH.read_text())
    _, _, _, access_token = get_client()
    synced_files: list[dict] = []

    for spec in config.get("files", []):
        match = find_first(access_token, spec["query"])
        if not match:
            synced_files.append({"query": spec["query"], "error": "not found"})
            continue
        dest = ROOT / spec["dest"]
        download_file(access_token, match["id"], match.get("mimeType", ""), dest)
        synced_files.append(
            {
                "name": match["name"],
                "dest": spec["dest"],
                "modifiedTime": match.get("modifiedTime"),
            }
        )

    for spec in config.get("folders", []):
        match = find_first(access_token, spec["query"])
        if not match:
            synced_files.append({"query": spec["query"], "error": "folder not found"})
            continue
        dest_dir = ROOT / spec["dest"]
        dest_dir.mkdir(parents=True, exist_ok=True)
        folder_synced = sync_folder_tree(
            access_token,
            match["id"],
            dest_dir,
            max_files=spec.get("max_files", 100),
        )
        synced_files.append(
            {
                "folder": match["name"],
                "dest": spec["dest"],
                "file_count": len(folder_synced),
                "files": folder_synced[:20],
            }
        )

    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    manifest = {
        "synced_at": datetime.now(tz=timezone.utc).isoformat(),
        "config": str(CONFIG_PATH.relative_to(ROOT)),
        "items": synced_files,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n")

    print(f"Wrote {MANIFEST_PATH}")
    print(f"Synced {len(synced_files)} top-level item(s) from Google Drive")
    for item in synced_files:
        if "error" in item:
            print(f"  WARN: {item.get('query') or item.get('name')} — {item['error']}")
        elif "folder" in item:
            print(f"  {item['folder']} → {item['dest']} ({item['file_count']} files)")
        else:
            print(f"  {item['name']} → {item['dest']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
