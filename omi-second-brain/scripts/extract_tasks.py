#!/usr/bin/env python3
"""Export open Omi action items to Markdown (+ optional ICS calendar file).

Usage:
  PYTHONPATH=src python scripts/extract_tasks.py
  PYTHONPATH=src python scripts/extract_tasks.py --ics ./data/omi_tasks.ics
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from rich.console import Console

from omi_brain.config import load_settings, require_dev_key, require_vault
from omi_brain.omi_client import OmiClient
from omi_brain.vault_writer import VaultWriter

console = Console()


def _ics_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def write_ics(items: list[dict], path: Path) -> None:
    """Minimal VTODO ICS for import into Apple Calendar / Fantastical / etc."""
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//omi-second-brain//EN",
        "CALSCALE:GREGORIAN",
    ]
    now = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    for item in items:
        uid = str(item.get("id") or hash(str(item))) + "@omi-second-brain"
        desc = item.get("description") or item.get("task") or "Omi task"
        due = item.get("due_at")
        lines += [
            "BEGIN:VTODO",
            f"UID:{uid}",
            f"DTSTAMP:{now}",
            f"SUMMARY:{_ics_escape(str(desc)[:120])}",
        ]
        if due:
            # Accept date or datetime
            due_s = str(due).replace("-", "").replace(":", "")
            if "T" in str(due):
                lines.append(f"DUE:{due_s.replace('+00:00', 'Z')[:16]}Z" if due_s.endswith("Z") is False else f"DUE:{due_s}")
            else:
                lines.append(f"DUE;VALUE=DATE:{due_s[:8]}")
        lines.append("END:VTODO")
    lines.append("END:VCALENDAR")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ics", type=Path, help="Write VTODO .ics to this path")
    args = parser.parse_args()

    settings = load_settings()
    require_dev_key(settings)
    require_vault(settings)
    client = OmiClient(settings)
    items = list(client.iter_open_action_items())
    console.print(f"Open action items: {len(items)}")
    path = VaultWriter(settings).write_task_note(items)
    if path:
        console.print(f"[green]Markdown[/green] {path}")
    if args.ics:
        write_ics(items, args.ics)
        console.print(f"[green]ICS[/green] {args.ics}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
