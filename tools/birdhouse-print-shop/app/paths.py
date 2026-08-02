from __future__ import annotations

import os
import sys
from pathlib import Path


def is_frozen() -> bool:
    return bool(getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"))


def resource_root() -> Path:
    """App files shipped with the program (templates, schema, static)."""
    if is_frozen():
        return Path(sys._MEIPASS)  # type: ignore[attr-defined]
    return Path(__file__).resolve().parents[1]


def default_data_dir() -> Path:
    """Writable shop database location (survives app updates)."""
    override = os.getenv("BIRDHOUSE_DATA_DIR")
    if override:
        return Path(override)

    if sys.platform == "win32":
        base = Path(os.environ.get("LOCALAPPDATA") or (Path.home() / "AppData" / "Local"))
        return base / "BirdhousePrintShop"

    if is_frozen():
        return Path.home() / ".birdhouse-print-shop"

    return resource_root() / "data"


def schema_path() -> Path:
    return resource_root() / "schema.sql"


def templates_dir() -> Path:
    return resource_root() / "app" / "templates"


def static_dir() -> Path:
    return resource_root() / "app" / "static"
