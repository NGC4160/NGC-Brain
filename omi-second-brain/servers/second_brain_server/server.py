#!/usr/bin/env python3
"""Custom MCP server: semantic vault search + Omi Dev API helpers.

Exposes tools to Cursor / Claude Desktop over stdio (MCP 2025+).
Prefer the official Omi hosted MCP for live transcript search; use this
server for local vault RAG and combined workflows.

Run:
  export PYTHONPATH=src
  python servers/second_brain_server/server.py
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from mcp.server.fastmcp import FastMCP

from omi_brain.config import load_settings
from omi_brain.embeddings import EmbeddingIndex
from omi_brain.omi_client import OmiClient

mcp = FastMCP("second-brain-local")


def _settings():
    return load_settings()


@mcp.tool()
def search_vault(query: str, n_results: int = 8) -> str:
    """Semantic search across the local Obsidian vault (Chroma + Ollama embeddings)."""
    settings = _settings()
    index = EmbeddingIndex(settings)
    hits = index.search(query, n_results=n_results)
    return json.dumps(hits, indent=2)


@mcp.tool()
def read_vault_note(relative_path: str) -> str:
    """Read a Markdown note from the Obsidian vault by relative path."""
    settings = _settings()
    path = (settings.vault_path / relative_path).resolve()
    vault = settings.vault_path.resolve()
    if vault not in path.parents and path != vault:
        return json.dumps({"error": "path escapes vault"})
    if not path.exists():
        return json.dumps({"error": "not found", "path": relative_path})
    return path.read_text(encoding="utf-8")


@mcp.tool()
def write_vault_note(relative_path: str, content: str, overwrite: bool = False) -> str:
    """Write a Markdown note into the vault (Inbox/ recommended). Refuses path escape."""
    settings = _settings()
    path = (settings.vault_path / relative_path).resolve()
    vault = settings.vault_path.resolve()
    if vault not in path.parents and path != vault:
        return json.dumps({"error": "path escapes vault"})
    if path.exists() and not overwrite:
        return json.dumps({"error": "exists; pass overwrite=true"})
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return json.dumps({"ok": True, "path": relative_path})


@mcp.tool()
def list_recent_omi_conversations(hours: int = 36, limit: int = 20) -> str:
    """List recent Omi conversations via Developer API (metadata only)."""
    settings = _settings()
    if not settings.omi_dev_api_key:
        return json.dumps({"error": "OMI_DEV_API_KEY not set"})
    client = OmiClient(settings)
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    items = []
    for meta in client.iter_conversations_since(since):
        structured = meta.get("structured") or {}
        items.append(
            {
                "id": meta.get("id"),
                "title": structured.get("title"),
                "overview": structured.get("overview"),
                "started_at": meta.get("started_at"),
                "finished_at": meta.get("finished_at"),
            }
        )
        if len(items) >= limit:
            break
    return json.dumps(items, indent=2)


@mcp.tool()
def get_omi_conversation(conversation_id: str, include_transcript: bool = True) -> str:
    """Fetch one Omi conversation (optional full transcript) via Developer API."""
    settings = _settings()
    if not settings.omi_dev_api_key:
        return json.dumps({"error": "OMI_DEV_API_KEY not set"})
    client = OmiClient(settings)
    data = client.get_conversation(conversation_id, include_transcript=include_transcript)
    return json.dumps(data, indent=2, default=str)


@mcp.tool()
def brain_status() -> str:
    """Return local config status (no secrets)."""
    settings = _settings()
    return json.dumps(
        {
            "vault_path": str(settings.vault_path),
            "vault_exists": settings.vault_path.exists(),
            "chroma_dir": str(settings.chroma_persist_dir),
            "ollama_base_url": settings.ollama_base_url,
            "embed_model": settings.embed_model,
            "llm_model": settings.llm_model,
            "has_omi_dev_key": bool(settings.omi_dev_api_key),
            "local_only": settings.local_only,
        },
        indent=2,
    )


def main() -> None:
    # Ensure cwd-friendly imports when launched by MCP hosts
    os.chdir(ROOT)
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
