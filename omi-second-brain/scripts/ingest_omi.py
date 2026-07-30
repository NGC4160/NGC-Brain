#!/usr/bin/env python3
"""Pull latest Omi conversations/memories/action items → Obsidian Markdown.

Usage (from project root):
  export PYTHONPATH=src
  python scripts/ingest_omi.py
  python scripts/ingest_omi.py --lookback-hours 72 --skip-llm
  python scripts/ingest_omi.py --dry-run

Requires: OMI_DEV_API_KEY (omi_dev_...), OBSIDIAN_VAULT_PATH
Optional: Ollama running for local enrichment (falls back to Omi structured summary).
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Allow running without install
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from rich.console import Console

from omi_brain.config import load_settings, require_dev_key, require_vault
from omi_brain.omi_client import OmiAPIError, OmiClient
from omi_brain.processor import Processor
from omi_brain.vault_writer import VaultWriter

console = Console()


def _state_path(settings) -> Path:
    return settings.state_dir / "ingest_state.json"


def _load_state(settings) -> dict:
    path = _state_path(settings)
    if not path.exists():
        return {"processed_conversation_ids": [], "processed_memory_ids": []}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"processed_conversation_ids": [], "processed_memory_ids": []}


def _save_state(settings, state: dict) -> None:
    settings.state_dir.mkdir(parents=True, exist_ok=True)
    # Cap ID lists so state stays small
    state["processed_conversation_ids"] = state.get("processed_conversation_ids", [])[-2000:]
    state["processed_memory_ids"] = state.get("processed_memory_ids", [])[-2000:]
    state["last_run"] = datetime.now(timezone.utc).isoformat()
    _state_path(settings).write_text(json.dumps(state, indent=2), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Ingest Omi data into Obsidian")
    parser.add_argument("--lookback-hours", type=int, default=None)
    parser.add_argument("--skip-llm", action="store_true", help="Use Omi structured fields only")
    parser.add_argument("--skip-memories", action="store_true")
    parser.add_argument("--skip-tasks", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--reprocess", action="store_true", help="Ignore processed ID cache")
    args = parser.parse_args()

    settings = load_settings()
    require_dev_key(settings)
    require_vault(settings)
    settings.ensure_dirs()

    lookback = args.lookback_hours or settings.lookback_hours
    since = datetime.now(timezone.utc) - timedelta(hours=lookback)
    console.print(f"[bold]Omi ingest[/bold] since {since.isoformat()} → {settings.vault_path}")

    client = OmiClient(settings)
    processor = Processor(settings)
    writer = VaultWriter(settings)
    state = _load_state(settings)
    seen_conv = set(state.get("processed_conversation_ids") or [])
    seen_mem = set(state.get("processed_memory_ids") or [])

    written: list[Path] = []
    daily_map: dict[str, list[Path]] = {}

    # --- Conversations ---
    try:
        metas = list(client.iter_conversations_since(since))
    except OmiAPIError as exc:
        console.print(f"[red]Failed listing conversations:[/red] {exc}")
        return 1

    console.print(f"Found {len(metas)} conversation(s) in window")

    for meta in metas:
        cid = str(meta.get("id") or "")
        if not cid:
            continue
        if not args.reprocess and cid in seen_conv:
            console.print(f"  skip (cached) {cid}")
            continue
        try:
            conv = client.get_conversation(cid, include_transcript=settings.include_transcript)
        except OmiAPIError as exc:
            console.print(f"  [yellow]skip {cid}:[/yellow] {exc}")
            continue

        if processor.segment_count(conv) < settings.min_transcript_segments:
            # Still allow if Omi provided a structured overview
            structured = conv.get("structured") or {}
            if not structured.get("overview") and not structured.get("title"):
                console.print(f"  skip (too short) {cid}")
                seen_conv.add(cid)
                continue

        transcript = processor.redact(processor.transcript_text(conv))
        if args.skip_llm:
            enriched = processor.structured_from_omi(conv)
        else:
            enriched = processor.enrich_with_llm(conv, transcript)

        if args.dry_run:
            console.print(f"  [cyan]dry-run[/cyan] would write: {enriched.get('title')} ({cid})")
            seen_conv.add(cid)
            continue

        path = writer.write_conversation(conv, enriched, transcript)
        written.append(path)
        seen_conv.add(cid)
        day = path.name[:10]
        daily_map.setdefault(day, []).append(path)
        console.print(f"  [green]wrote[/green] {path.relative_to(settings.vault_path)}")

    for day, paths in daily_map.items():
        if not args.dry_run:
            writer.append_daily_index(day, paths)

    # --- Memories ---
    if settings.include_memories and not args.skip_memories:
        try:
            memories = list(client.iter_memories_since(since))
            console.print(f"Found {len(memories)} memory update(s)")
            for mem in memories:
                mid = str(mem.get("id") or "")
                if not mid:
                    continue
                if not args.reprocess and mid in seen_mem:
                    continue
                if args.dry_run:
                    console.print(f"  [cyan]dry-run[/cyan] memory {mid}")
                    seen_mem.add(mid)
                    continue
                path = writer.write_memory(mem)
                written.append(path)
                seen_mem.add(mid)
                console.print(f"  [green]wrote[/green] {path.relative_to(settings.vault_path)}")
        except OmiAPIError as exc:
            console.print(
                f"[yellow]Memories skipped[/yellow] ({exc}). "
                "If code is developer_memory_access_not_ready, wait for account readiness "
                "or continue with conversations only."
            )

    # --- Action items ---
    if settings.include_action_items and settings.extract_tasks and not args.skip_tasks:
        try:
            items = list(client.iter_open_action_items())
            console.print(f"Found {len(items)} open action item(s)")
            if items and not args.dry_run:
                path = writer.write_task_note(items)
                if path:
                    console.print(f"  [green]wrote[/green] {path.relative_to(settings.vault_path)}")
        except OmiAPIError as exc:
            console.print(f"[yellow]Action items skipped:[/yellow] {exc}")

    if not args.dry_run:
        state["processed_conversation_ids"] = list(seen_conv)
        state["processed_memory_ids"] = list(seen_mem)
        _save_state(settings, state)

    console.print(f"[bold green]Done.[/bold green] Notes written: {len(written)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
