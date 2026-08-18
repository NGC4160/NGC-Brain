#!/usr/bin/env python3
"""Distill today's (or a given day's) Omi conversation notes into a reflection.

Usage:
  PYTHONPATH=src python scripts/daily_reflect.py
  PYTHONPATH=src python scripts/daily_reflect.py --date 2026-07-29
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import httpx
from rich.console import Console

from omi_brain.config import load_settings, require_vault
from omi_brain.vault_writer import VaultWriter

console = Console()

REFLECT_PROMPT = """You are a thoughtful second-brain coach. Given the day's Omi-captured notes,
write a daily reflection in Markdown with sections:
## Wins
## Decisions
## Open loops
## Ideas to revisit
## One focus for tomorrow

Be specific; quote concrete details from the notes. Keep under 400 words.

Notes:
{notes}
"""


def _gather_day_notes(vault: Path, conversations_dir: str, day: str) -> str:
    folder = vault / conversations_dir
    if not folder.exists():
        return ""
    chunks: list[str] = []
    for path in sorted(folder.glob(f"{day}-*.md")):
        chunks.append(f"### {path.name}\n\n{path.read_text(encoding='utf-8')[:4000]}")
    daily = vault / "Daily" / f"{day}.md"
    if daily.exists():
        chunks.insert(0, daily.read_text(encoding="utf-8")[:2000])
    return "\n\n---\n\n".join(chunks)


def _ollama_reflect(settings, notes: str) -> str:
    prompt = REFLECT_PROMPT.format(notes=notes[:14000])
    with httpx.Client(base_url=settings.ollama_base_url, timeout=180.0) as client:
        r = client.post(
            "/api/chat",
            json={
                "model": settings.llm_model,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
            },
        )
        r.raise_for_status()
        return (r.json().get("message") or {}).get("content") or ""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", help="YYYY-MM-DD (default: today UTC)")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    settings = load_settings()
    require_vault(settings)
    day = args.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    notes = _gather_day_notes(settings.vault_path, settings.conversations_dir, day)
    if not notes.strip():
        console.print(f"[yellow]No notes found for {day}. Run ingest first.[/yellow]")
        return 0

    console.print(f"Reflecting on {day} ({len(notes)} chars of source)...")
    try:
        content = _ollama_reflect(settings, notes)
    except Exception as exc:
        console.print(f"[red]Ollama failed:[/red] {exc}")
        content = (
            f"_Ollama unavailable — stub reflection for {day}_\n\n"
            f"Source notes found. Re-run with Ollama (`ollama serve` + "
            f"`ollama pull {settings.llm_model}`).\n"
        )

    if args.dry_run:
        console.print(content)
        return 0

    path = VaultWriter(settings).write_daily_reflection(day, content)
    console.print(f"[green]Wrote[/green] {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
