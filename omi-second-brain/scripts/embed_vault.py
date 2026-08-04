#!/usr/bin/env python3
"""Index Obsidian vault Markdown into local Chroma via Ollama embeddings.

Usage:
  export PYTHONPATH=src
  python scripts/embed_vault.py
  python scripts/embed_vault.py --query "lithium conversion decisions"
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from rich.console import Console
from rich.table import Table

from omi_brain.config import load_settings, require_vault
from omi_brain.embeddings import EmbeddingIndex

console = Console()


def main() -> int:
    parser = argparse.ArgumentParser(description="Embed / search Obsidian vault")
    parser.add_argument("--query", "-q", help="Semantic search query (skips full reindex if set with --search-only)")
    parser.add_argument("--search-only", action="store_true")
    parser.add_argument("--n", type=int, default=8)
    args = parser.parse_args()

    settings = load_settings()
    require_vault(settings)
    settings.ensure_dirs()

    index = EmbeddingIndex(settings)

    if not args.search_only:
        console.print(f"[bold]Indexing[/bold] {settings.vault_path} → {settings.chroma_persist_dir}")
        try:
            result = index.index_vault(settings.vault_path)
        except Exception as exc:
            console.print(
                f"[red]Index failed:[/red] {exc}\n"
                "Ensure Ollama is running and embed model is pulled:\n"
                f"  ollama pull {settings.embed_model}"
            )
            return 1
        console.print(
            f"Indexed {result['indexed']}/{result['total_candidates']} files "
            f"({len(result['errors'])} errors)"
        )
        for err in result["errors"][:10]:
            console.print(f"  [yellow]{err}[/yellow]")

    if args.query:
        console.print(f"[bold]Search:[/bold] {args.query}")
        hits = index.search(args.query, n_results=args.n)
        table = Table("path", "distance", "snippet")
        for hit in hits:
            table.add_row(
                str(hit.get("path")),
                f"{hit.get('distance'):.4f}" if hit.get("distance") is not None else "",
                (hit.get("snippet") or "").replace("\n", " ")[:80],
            )
        console.print(table)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
