"""Load settings from .env + optional config/settings.yaml."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[2]


@dataclass
class Settings:
    omi_dev_api_key: str = ""
    omi_mcp_api_key: str = ""
    omi_api_base: str = "https://api.omi.me/v1/dev"
    vault_path: Path = Path(".")
    lookback_hours: int = 36
    page_limit: int = 50
    include_transcript: bool = True
    include_memories: bool = True
    include_action_items: bool = True
    local_only: bool = True
    ollama_base_url: str = "http://localhost:11434"
    llm_model: str = "llama3.2"
    embed_model: str = "nomic-embed-text"
    chroma_persist_dir: Path = PROJECT_ROOT / "data" / "chroma"
    chroma_collection: str = "omi_second_brain"
    save_transcripts: bool = True
    extract_tasks: bool = True
    min_transcript_segments: int = 2
    default_tags: list[str] = field(default_factory=lambda: ["omi", "auto-ingest"])
    omit_geolocation: bool = True
    consent_banner: bool = True
    redact_patterns: list[str] = field(default_factory=list)
    state_dir: Path = PROJECT_ROOT / "data" / "state"
    # PARA relative dirs
    daily_dir: str = "Daily"
    conversations_dir: str = "Daily/Conversations"
    memories_dir: str = "Resources/Omi Memories"
    inbox_dir: str = "Inbox"
    tasks_dir: str = "Inbox/Tasks"
    reflections_dir: str = "Daily/Reflections"

    def ensure_dirs(self) -> None:
        self.state_dir.mkdir(parents=True, exist_ok=True)
        self.chroma_persist_dir.mkdir(parents=True, exist_ok=True)
        if self.vault_path and self.vault_path != Path("."):
            for rel in (
                self.daily_dir,
                self.conversations_dir,
                self.memories_dir,
                self.inbox_dir,
                self.tasks_dir,
                self.reflections_dir,
                "Projects",
                "Areas",
                "Resources",
                "Archive",
            ):
                (self.vault_path / rel).mkdir(parents=True, exist_ok=True)


def _deep_get(data: dict[str, Any], *keys: str, default: Any = None) -> Any:
    cur: Any = data
    for k in keys:
        if not isinstance(cur, dict) or k not in cur:
            return default
        cur = cur[k]
    return cur


def load_settings(
    env_file: Path | None = None,
    yaml_file: Path | None = None,
) -> Settings:
    """Merge .env, settings.yaml, and process env into Settings."""
    load_dotenv(env_file or PROJECT_ROOT / ".env")

    yaml_path = yaml_file or PROJECT_ROOT / "config" / "settings.yaml"
    yml: dict[str, Any] = {}
    if yaml_path.exists():
        with yaml_path.open("r", encoding="utf-8") as f:
            yml = yaml.safe_load(f) or {}

    vault = os.getenv("OBSIDIAN_VAULT_PATH") or _deep_get(yml, "vault", "path", default="")
    chroma = os.getenv("CHROMA_PERSIST_DIR") or _deep_get(
        yml, "embeddings", "persist_dir", default=str(PROJECT_ROOT / "data" / "chroma")
    )

    settings = Settings(
        omi_dev_api_key=os.getenv("OMI_DEV_API_KEY", ""),
        omi_mcp_api_key=os.getenv("OMI_MCP_API_KEY", ""),
        omi_api_base=os.getenv("OMI_API_BASE")
        or _deep_get(yml, "omi", "api_base", default="https://api.omi.me/v1/dev"),
        vault_path=Path(vault).expanduser() if vault else Path("."),
        lookback_hours=int(
            os.getenv("INGEST_LOOKBACK_HOURS")
            or _deep_get(yml, "omi", "lookback_hours", default=36)
        ),
        page_limit=int(_deep_get(yml, "omi", "page_limit", default=50)),
        include_transcript=_deep_get(yml, "omi", "include_transcript", default=True),
        include_memories=_deep_get(yml, "omi", "include_memories", default=True),
        include_action_items=_deep_get(yml, "omi", "include_action_items", default=True),
        local_only=_env_bool("LOCAL_ONLY", _deep_get(yml, "processing", "local_only", default=True)),
        ollama_base_url=os.getenv("OLLAMA_BASE_URL")
        or _deep_get(yml, "processing", "ollama_base_url", default="http://localhost:11434"),
        llm_model=os.getenv("OLLAMA_LLM_MODEL")
        or _deep_get(yml, "processing", "llm_model", default="llama3.2"),
        embed_model=os.getenv("OLLAMA_EMBED_MODEL")
        or _deep_get(yml, "processing", "embed_model", default="nomic-embed-text"),
        chroma_persist_dir=Path(chroma).expanduser(),
        chroma_collection=os.getenv("CHROMA_COLLECTION")
        or _deep_get(yml, "embeddings", "collection", default="omi_second_brain"),
        save_transcripts=_env_bool("INGEST_SAVE_TRANSCRIPTS", True),
        extract_tasks=_env_bool("INGEST_EXTRACT_TASKS", True),
        min_transcript_segments=int(
            _deep_get(yml, "processing", "min_transcript_segments", default=2)
        ),
        default_tags=list(_deep_get(yml, "processing", "default_tags", default=["omi", "auto-ingest"])),
        omit_geolocation=_deep_get(yml, "privacy", "omit_geolocation", default=True),
        consent_banner=_deep_get(yml, "privacy", "consent_banner", default=True),
        redact_patterns=list(_deep_get(yml, "privacy", "redact_patterns", default=[]) or []),
        daily_dir=_deep_get(yml, "vault", "daily_dir", default="Daily"),
        conversations_dir=_deep_get(yml, "vault", "conversations_dir", default="Daily/Conversations"),
        memories_dir=_deep_get(yml, "vault", "memories_dir", default="Resources/Omi Memories"),
        inbox_dir=_deep_get(yml, "vault", "inbox_dir", default="Inbox"),
        tasks_dir=_deep_get(yml, "vault", "tasks_dir", default="Inbox/Tasks"),
        reflections_dir=_deep_get(yml, "vault", "reflections_dir", default="Daily/Reflections"),
    )
    return settings


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def require_dev_key(settings: Settings) -> None:
    if not settings.omi_dev_api_key or settings.omi_dev_api_key.startswith("omi_dev_REPLACE"):
        raise SystemExit(
            "Missing OMI_DEV_API_KEY (must start with omi_dev_...). "
            "Create one in Omi → Settings → Developer → Create Key. "
            "Do not use an omi_mcp_ key for REST ingest."
        )


def require_vault(settings: Settings) -> None:
    if not settings.vault_path or settings.vault_path == Path(".") or not settings.vault_path.exists():
        raise SystemExit(
            "Set OBSIDIAN_VAULT_PATH to an existing Obsidian vault directory. "
            f"Got: {settings.vault_path}"
        )
