#!/usr/bin/env python3
"""Import NeighborhoodGolfCartsBusinessBrain from the local desktop."""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = Path.home() / "Desktop" / "NeighborhoodGolfCartsBusinessBrain"
DEFAULT_TARGET = ROOT / "NeighborhoodGolfCartsBusinessBrain"


def copy_tree(source: Path, target: Path, merge: bool) -> None:
    if not source.is_dir():
        print(f"ERROR: source folder not found: {source}", file=sys.stderr)
        print(
            "Copy NeighborhoodGolfCartsBusinessBrain to your Desktop, or pass --source.",
            file=sys.stderr,
        )
        sys.exit(1)

    if target.exists() and not merge:
        shutil.rmtree(target)

    target.mkdir(parents=True, exist_ok=True)

    for item in source.rglob("*"):
        relative = item.relative_to(source)
        destination = target / relative
        if item.is_dir():
            destination.mkdir(parents=True, exist_ok=True)
        else:
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, destination)

    print(f"Imported {source} -> {target}")
    print("Next: python3 scripts/generate.py")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Import desktop NeighborhoodGolfCartsBusinessBrain into the repo."
    )
    parser.add_argument(
        "--source",
        type=Path,
        default=DEFAULT_SOURCE,
        help=f"Desktop folder path (default: {DEFAULT_SOURCE})",
    )
    parser.add_argument(
        "--target",
        type=Path,
        default=DEFAULT_TARGET,
        help=f"Repo destination (default: {DEFAULT_TARGET})",
    )
    parser.add_argument(
        "--merge",
        action="store_true",
        help="Merge into existing folder instead of replacing it",
    )
    args = parser.parse_args()
    copy_tree(args.source.resolve(), args.target.resolve(), args.merge)


if __name__ == "__main__":
    main()
