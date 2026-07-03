#!/usr/bin/env python3
"""Ingest HCP pricebook + QBO exports into knowledge/.generated/sync_manifest.json"""

from __future__ import annotations

import csv
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GENERATED = ROOT / "knowledge" / ".generated"
PRICEBOOK = ROOT / "external_docs" / "exports" / "pricebook" / "NeighborhoodGolfCarts_pricebook_export.csv"
QBO_DIR = ROOT / "external_docs" / "exports" / "qbo"
HCP_API_DIR = ROOT / "external_docs" / "exports" / "hcp"


def parse_price(s: str) -> float:
    if not s:
        return 0.0
    return float(s.replace("$", "").replace(",", ""))


def ingest_pricebook() -> dict:
    if not PRICEBOOK.exists():
        return {"exists": False, "path": str(PRICEBOOK)}

    with PRICEBOOK.open(newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    lithium_professional = []
    legacy_flags = []
    diagnostics = []

    for r in rows:
        name = r.get("name", "")
        cat = r.get("category", "")
        price = r.get("price", "")
        lower = name.lower()

        if "professional lithium" in lower or (
            "lithium battery conversions [full kit]" in cat.lower()
        ):
            lithium_professional.append({"name": name, "price": price, "category": cat})

        if any(k in lower for k in ["mobile", "trip charge", "on-site", "ngc conversion"]) and "professional" not in lower:
            if parse_price(price) > 0 or "mobile" in lower:
                legacy_flags.append(name)

        if "diagnostic" in lower or "minimum service" in lower:
            diagnostics.append({"name": name, "price": price})

    return {
        "exists": True,
        "path": str(PRICEBOOK),
        "modified": datetime.fromtimestamp(PRICEBOOK.stat().st_mtime, tz=timezone.utc).isoformat(),
        "total_items": len(rows),
        "lithium_professional_skus": sorted(lithium_professional, key=lambda x: parse_price(x["price"])),
        "diagnostic_lines": diagnostics[:15],
        "legacy_item_count": len(legacy_flags),
        "legacy_sample": legacy_flags[:10],
    }


def ingest_qbo_pl() -> dict:
    pl_path = QBO_DIR / "profit_and_loss_last_12_months.xlsx"
    if not pl_path.exists():
        return {"exists": False}

    try:
        import openpyxl
    except ImportError:
        venv_python = ROOT / ".venv" / "bin" / "python3"
        return {"exists": True, "error": "openpyxl not installed; run from .venv"}

    wb = openpyxl.load_workbook(pl_path, read_only=True, data_only=True)
    ws = wb.active
    income = {}
    net_income = None
    for row in ws.iter_rows(values_only=True):
        if not row or not row[0]:
            continue
        label = str(row[0]).strip()
        val = row[1] if len(row) > 1 else None
        if label == "Total for Income" and isinstance(val, (int, float)):
            income["_total"] = val
        elif label == "Net Income" and isinstance(val, (int, float)):
            net_income = val
        elif isinstance(val, (int, float)) and label not in (
            "Income",
            "Cost of Goods Sold",
            "Expenses",
            "Gross Profit",
            "Net Operating Income",
        ):
            if "Total for" not in label and "Neighborhood" not in label and "Profit" not in label:
                if any(
                    k in label
                    for k in (
                        "Sales",
                        "LFP",
                        "Services",
                        "Mobile",
                        "Lithium",
                        "Conversion",
                    )
                ):
                    income[label] = val
    wb.close()

    return {
        "exists": True,
        "path": str(pl_path),
        "modified": datetime.fromtimestamp(pl_path.stat().st_mtime, tz=timezone.utc).isoformat(),
        "period_note": "See file header for date range",
        "income_highlights": income,
        "net_income": net_income,
    }


def ingest_hcp_api() -> dict:
    manifest_path = HCP_API_DIR / "api_sync_manifest.json"
    jobs_path = HCP_API_DIR / "jobs.json"
    if not manifest_path.exists() and not jobs_path.exists():
        return {"exists": False, "note": "Run ./scripts/sync/run_hcp_sync.sh after setting HCP_API_KEY"}

    out: dict = {"exists": True}
    if manifest_path.exists():
        out["manifest"] = json.loads(manifest_path.read_text())
        out["modified"] = datetime.fromtimestamp(
            manifest_path.stat().st_mtime, tz=timezone.utc
        ).isoformat()
    if jobs_path.exists():
        jobs_data = json.loads(jobs_path.read_text())
        jobs = jobs_data.get("jobs", jobs_data if isinstance(jobs_data, list) else [])
        out["job_count"] = len(jobs) if isinstance(jobs, list) else 0
        # Status summary without PII
        statuses: dict[str, int] = {}
        if isinstance(jobs, list):
            for j in jobs:
                if isinstance(j, dict):
                    st = str(j.get("work_status") or j.get("status") or "unknown")
                    statuses[st] = statuses.get(st, 0) + 1
        out["jobs_by_status"] = statuses
    pb_path = HCP_API_DIR / "pricebook_services.json"
    if pb_path.exists():
        pb = json.loads(pb_path.read_text())
        out["pricebook_service_count"] = pb.get("count", len(pb.get("services", [])))
        # Spot-check Professional lithium SKUs
        svcs = pb.get("services", [])
        if isinstance(svcs, list):
            pro = [
                s.get("name")
                for s in svcs
                if isinstance(s, dict) and "professional lithium" in str(s.get("name", "")).lower()
            ]
            out["professional_lithium_skus"] = pro[:10]
    return out


def main() -> int:
    GENERATED.mkdir(parents=True, exist_ok=True)

    manifest = {
        "synced_at": datetime.now(tz=timezone.utc).isoformat(),
        "pricebook": ingest_pricebook(),
        "qbo_pl": ingest_qbo_pl(),
        "hcp_api": ingest_hcp_api(),
        "qbo_files": [
            {
                "name": p.name,
                "modified": datetime.fromtimestamp(p.stat().st_mtime, tz=timezone.utc).isoformat(),
            }
            for p in sorted(QBO_DIR.glob("*"))
            if p.is_file()
        ]
        if QBO_DIR.exists()
        else [],
        "alerts": [],
    }

    pb = manifest["pricebook"]
    if pb.get("exists") and pb.get("legacy_item_count", 0) > 0:
        manifest["alerts"].append(
            f"{pb['legacy_item_count']} legacy/mobile/NGC Conversion items still in pricebook — see knowledge/archive/legacy_mobile.md"
        )

    out = GENERATED / "sync_manifest.json"
    out.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Wrote {out}")
    for a in manifest["alerts"]:
        print(f"ALERT: {a}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
