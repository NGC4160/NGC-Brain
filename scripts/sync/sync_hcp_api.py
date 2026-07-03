#!/usr/bin/env python3
"""Pull live data from Housecall Pro API → external_docs/exports/hcp/"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "connectors"))

from hcp_client import HCPClient  # noqa: E402

OUT = ROOT / "external_docs" / "exports" / "hcp"


def write_json(name: str, data: object) -> Path:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    path.write_text(json.dumps(data, indent=2, default=str) + "\n")
    return path


def main() -> int:
    try:
        client = HCPClient()
    except ValueError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1

    print("Testing HCP connection...")
    try:
        test = client.test_connection()
        write_json("company_test.json", test)
        print("  OK — company endpoint reachable")
    except Exception as e:
        print(f"  FAIL: {e}", file=sys.stderr)
        write_json("company_test.json", {"ok": False, "error": str(e)})
        return 1

    try:
        company = client.get_company()
        write_json("company.json", company)
        print("  Saved company.json")
    except Exception as e:
        print(f"  company.json skipped: {e}")

    try:
        jobs = client.list_all_jobs(max_pages=10)
        write_json("jobs.json", {"synced_at": _now(), "count": len(jobs), "jobs": jobs})
        print(f"  Saved jobs.json ({len(jobs)} jobs)")
    except Exception as e:
        print(f"  jobs.json skipped: {e}")

    try:
        services = client.list_all_pricebook_services()
        write_json(
            "pricebook_services.json",
            {"synced_at": _now(), "count": len(services), "services": services},
        )
        print(f"  Saved pricebook_services.json ({len(services)} services)")

        categories_data = client.list_pricebook_material_categories()
        write_json("pricebook_material_categories.json", categories_data)
        cat_list = categories_data.get("data", []) if isinstance(categories_data, dict) else []
        print(f"  Saved pricebook_material_categories.json ({len(cat_list)} categories)")
    except Exception as e:
        print(f"  pricebook sync skipped: {e}")

    manifest = {
        "synced_at": _now(),
        "source": "housecall_pro_api",
        "paths": [str(p.name) for p in sorted(OUT.glob("*.json"))],
    }
    write_json("api_sync_manifest.json", manifest)
    print(f"\nDone → {OUT}/")

    # Chain to CSV ingest if present
    import subprocess

    ingest = ROOT / "scripts" / "sync" / "run_ingest.sh"
    if ingest.exists():
        subprocess.run([str(ingest)], check=False)

    board = ROOT / "scripts" / "sync" / "generate_shop_board.py"
    if board.exists():
        subprocess.run([sys.executable, str(board)], check=False)

    deposits = ROOT / "scripts" / "admin_bot" / "deposit_gate_alerts.py"
    if deposits.exists():
        subprocess.run([sys.executable, str(deposits)], check=False)

    return 0


def _now() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


if __name__ == "__main__":
    sys.exit(main())
