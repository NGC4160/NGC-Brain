#!/usr/bin/env python3
"""Validate generated AI-friendly business assets."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SCHEMA = ROOT / "schema"

REQUIRED_PUBLIC = [
    "llms.txt",
    "llms-full.txt",
    "robots.txt",
    "sitemap.xml",
    ".well-known/llms.txt",
    ".well-known/llms-full.txt",
]

BRAIN_DIR = ROOT / "NeighborhoodGolfCartsBusinessBrain"

REQUIRED_SCHEMA = [
    "organization.jsonld",
    "faq.jsonld",
]

LINK_PATTERN = re.compile(r"\[[^\]]+\]\((https?://[^)]+)\)")


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    sys.exit(1)


def warn(message: str) -> None:
    print(f"WARN: {message}")


def main() -> None:
    errors = 0

    for relative in REQUIRED_PUBLIC:
        path = PUBLIC / relative
        if not path.is_file():
            print(f"ERROR: missing {path.relative_to(ROOT)}", file=sys.stderr)
            errors += 1

    for relative in REQUIRED_SCHEMA:
        path = SCHEMA / relative
        if not path.is_file():
            print(f"ERROR: missing {path.relative_to(ROOT)}", file=sys.stderr)
            errors += 1

    llms_path = PUBLIC / "llms.txt"
    well_known_path = PUBLIC / ".well-known" / "llms.txt"
    if llms_path.is_file() and well_known_path.is_file():
        if llms_path.read_text(encoding="utf-8") != well_known_path.read_text(encoding="utf-8"):
            print("ERROR: llms.txt and .well-known/llms.txt differ", file=sys.stderr)
            errors += 1

    if llms_path.is_file():
        content = llms_path.read_text(encoding="utf-8")
        if not content.startswith("# "):
            print("ERROR: llms.txt must start with an H1 (# Title)", file=sys.stderr)
            errors += 1
        if "> **" not in content:
            print("ERROR: llms.txt missing blockquote summary", file=sys.stderr)
            errors += 1
        if "## Core pages" not in content:
            print("ERROR: llms.txt missing Core pages section", file=sys.stderr)
            errors += 1

        for url in LINK_PATTERN.findall(content):
            if "example.com" in url:
                warn(f"placeholder URL still present: {url}")
            parsed = urlparse(url)
            if not parsed.scheme or not parsed.netloc:
                print(f"ERROR: invalid URL in llms.txt: {url}", file=sys.stderr)
                errors += 1

    robots_path = PUBLIC / "robots.txt"
    if robots_path.is_file():
        robots = robots_path.read_text(encoding="utf-8")
        if "LLMs:" not in robots:
            print("ERROR: robots.txt should declare LLMs: location", file=sys.stderr)
            errors += 1

    if not BRAIN_DIR.is_dir():
        print(f"ERROR: missing business brain folder: {BRAIN_DIR.relative_to(ROOT)}", file=sys.stderr)
        errors += 1
    elif not list(BRAIN_DIR.rglob("*.md")):
        print("ERROR: business brain folder has no markdown files", file=sys.stderr)
        errors += 1

    if errors:
        sys.exit(1)

    print("Validation passed.")


if __name__ == "__main__":
    main()
