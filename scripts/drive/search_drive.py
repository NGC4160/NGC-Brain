#!/usr/bin/env python3
"""Search / download Google Drive files for cloud agents (no Mac sync required)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

from connectors.google_drive_client import (  # noqa: E402
    download_file,
    get_client,
    search_by_name,
)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("name", help="Substring to find in the file name")
    parser.add_argument("--download-dir", type=Path, help="If set, download matches here")
    parser.add_argument("--limit", type=int, default=25)
    args = parser.parse_args()

    _, _, _, token = get_client()
    matches = search_by_name(token, args.name, page_size=args.limit)
    if not matches:
        print(f"No Drive files matching name contains '{args.name}'")
        return 1

    print(f"Found {len(matches)} match(es):")
    for item in matches:
        print(f"  {item['id']}\t{item.get('name')}\t{item.get('mimeType')}")
        if args.download_dir:
            dest = args.download_dir / item["name"]
            download_file(token, item["id"], item.get("mimeType", ""), dest)
            print(f"    → {dest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
