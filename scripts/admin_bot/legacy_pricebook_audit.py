#!/usr/bin/env python3
"""Audit legacy/mobile/NGC Conversion pricebook items in HCP + QBO exports."""

from __future__ import annotations

import csv
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = ROOT / "external_docs" / "exports" / "pricebook" / "NeighborhoodGolfCarts_pricebook_export.csv"
QBO_PATH = ROOT / "external_docs" / "exports" / "qbo" / "products_and_services.xlsx"
OUT_PATH = ROOT / "knowledge" / ".generated" / "legacy_pricebook_audit.md"

# Canonical deactivate list — must match knowledge/10_automation/legacy_pricebook_cleanup.md
DEACTIVATE_HCP = [
    ("mobile_trip", "1.0 - Golf Cart Diagnostic & Inspection [Mobile Service Call]"),
    ("mobile_trip", "Mobile On-Site Golf Cart Diagnostics"),
    ("mobile_trip", "On-Site Mobile Diagnostics"),
    ("mobile_trip", "Mobile On-Site Golf Cart General Service and Repairs"),
    ("mobile_trip", "Additional Diagnostic Time Labor Only (On-Site)"),
    ("mobile_trip", "1.0 - Diagnostic Service Call (Bedico Creek Subdivision)"),
    ("mobile_trip", "Diagnostic Service Call (out of service area)"),
    ("mobile_trip", "0.5-Inspection Service Call"),
    ("mobile_trip", "Standard Trip Charge"),
    ("mobile_trip", "Extended Range Trip Charge"),
    ("mobile_trip", "Supplemental Trip Charge"),
    ("mobile_trip", "Extended Distance Trip Charge"),
    ("mobile_trip", "Extended Distance Adder- On-Site Tire Replacement Service (Vendor Convenience Fee)"),
    ("ngc_conversion", "3.0-NGC Lithium Conversion, 36v 105ah"),
    ("ngc_conversion", "3.0-NGC Lithium Conversion, 48v 105ah"),
    ("ngc_conversion", "3.0-NGC MINI Lithium Conversion, 48v 105ah"),
    ("ngc_conversion", "3.0- NGC Lithium Conversion, 72V 105AH"),
    ("ngc_conversion", "3.0-NGC Lithium Conversion, 60v 105ah"),
    ("ngc_conversion", "NGC Lithium Conversion Kit"),
    ("ngc_conversion", "TEST PARTIAL KIT 48V Professional Lithium Battery Conversion Kit Installed"),
    ("future_sales", "Golf Cart Sales Deposit"),
]

REVIEW_HCP = [
    ("Shop - 0.5-Inspection Service Call", "Shop inspection fee — confirm still used in-shop before deactivating"),
    ("3.0- NGC Infotainment System Installation ", "Accessory install — not mobile; confirm with Ryan if still offered"),
]

DEACTIVATE_QBO_ONLY = [
    ("future_sales", "2011 EZGO TXT 48V"),
    ("future_sales", "2022 Club Car Tempo"),
]

QBO_SUBSTRINGS = [name for _, name in DEACTIVATE_HCP] + [name for name, _ in REVIEW_HCP] + [n for _, n in DEACTIVATE_QBO_ONLY]
# QBO uses Category:Item — also match NGC kit part names
QBO_EXTRA = [
    "NGC Lithium Conversion Kit, 36V",
    "NGC Lithium Conversion Kit, 48V",
    "NGC Lithium Conversion Kit, 72V",
    "NGC Lithium Conversion Kit, 60v",
    "Mobile On-Site Golf Cart General Service and Repair",
]


def load_hcp_csv() -> dict[str, dict]:
    by_name: dict[str, dict] = {}
    if not CSV_PATH.exists():
        return by_name
    with CSV_PATH.open(newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            name = (row.get("name") or "").strip()
            if name:
                by_name[name] = row
    return by_name


def load_qbo_items() -> list[dict]:
    if not QBO_PATH.exists():
        return []
    try:
        import openpyxl
    except ImportError:
        return []
    wb = openpyxl.load_workbook(QBO_PATH, read_only=True, data_only=True)
    ws = wb.active
    items = []
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i < 4:
            continue
        name = str(row[0] or "").strip()
        if not name:
            continue
        items.append(
            {
                "full_name": name,
                "type": row[1],
                "price": row[3],
            }
        )
    return items


def match_qbo(full_name: str) -> tuple[str | None, str]:
    lower = full_name.lower()
    for name in QBO_SUBSTRINGS:
        if name.strip().lower() in lower:
            if "shop - 0.5-inspection" in lower:
                return "review", "shop_inspection"
            if "infotainment" in lower:
                return "review", "infotainment"
            if any(k in lower for k in ("mobile", "trip charge", "on-site", "bedico", "service area")):
                return "deactivate", "mobile_trip"
            if "test partial" in lower or "ngc lithium conversion" in lower or "ngc conversion" in lower:
                return "deactivate", "ngc_conversion"
            if "sales deposit" in lower or "club car tempo" in lower or "ezgo txt" in lower:
                return "deactivate", "future_sales"
    for frag in QBO_EXTRA:
        if frag.lower() in lower and "professional" not in lower:
            return "deactivate", "ngc_conversion"
    return None, ""


def build_report() -> str:
    now = datetime.now(tz=timezone.utc)
    hcp = load_hcp_csv()
    qbo = load_qbo_items()

    lines = [
        "# Legacy Pricebook Audit (checklist)",
        "",
        f"**Generated:** {now.strftime('%Y-%m-%d %H:%M UTC')}  ",
        f"**Source:** HCP CSV + QBO products export  ",
        "**Guide:** [legacy_pricebook_cleanup.md](../10_automation/legacy_pricebook_cleanup.md)",
        "",
        "Check off each row in HCP/QBO as you deactivate. Re-run this script after cleanup to confirm zero active legacy items.",
        "",
        f"## HCP — deactivate ({len(DEACTIVATE_HCP)} items)",
        "",
        "| ☐ | Group | Service name | UUID | Online booking |",
        "|---|-------|--------------|------|----------------|",
    ]

    missing_hcp = []
    for group, name in DEACTIVATE_HCP:
        row = hcp.get(name)
        if row:
            ob = row.get("online_booking_enabled", "?")
            lines.append(f"| ☐ | {group} | {name} | `{row.get('uuid', '')}` | {ob} |")
        else:
            missing_hcp.append(name)
            lines.append(f"| ☐ | {group} | {name} | *not in CSV* | — |")

    lines += ["", "## HCP — review before deactivating", "", "| ☐ | Service name | UUID | Note |", "|---|--------------|------|------|"]
    for name, note in REVIEW_HCP:
        row = hcp.get(name.strip()) or hcp.get(name)
        uuid = row.get("uuid", "") if row else ""
        lines.append(f"| ☐ | {name.strip()} | `{uuid}` | {note} |")

    qbo_deact: list[dict] = []
    qbo_review: list[dict] = []
    for item in qbo:
        action, group = match_qbo(item["full_name"])
        item["group"] = group
        if action == "deactivate":
            qbo_deact.append(item)
        elif action == "review":
            qbo_review.append(item)

    lines += [
        "",
        f"## QBO — make inactive ({len(qbo_deact)} matches)",
        "",
        "| ☐ | Group | Product/Service full name | Type |",
        "|---|-------|---------------------------|------|",
    ]
    for item in sorted(qbo_deact, key=lambda x: x["full_name"]):
        lines.append(f"| ☐ | {item.get('group', '')} | {item['full_name']} | {item.get('type', '')} |")

    if qbo_review:
        lines += ["", "## QBO — review", "", "| ☐ | Product/Service full name |", "|---|---------------------------|"]
        for item in qbo_review:
            lines.append(f"| ☐ | {item['full_name']} |")

    lines += [
        "",
        "## Replace-with reference (when quoting instead)",
        "",
        "| Don't use | Use instead |",
        "|-----------|-------------|",
        "| Any mobile / on-site diagnostic | `1.0 - Golf Cart Diagnostic & Inspection` ($179, in-shop) |",
        "| Trip charges | None — pickup/delivery per zone policy |",
        "| NGC Conversion 3.0-* kits | Professional Kit SKU for voltage (36V–72V) — see lithium_conversions.md |",
        "| TEST PARTIAL KIT | `6.0- 48V Professional Lithium Battery Conversion Kit Installed` (or correct voltage) |",
        "",
        "## Verification",
        "",
        "After cleanup:",
        "",
        "1. Re-export HCP pricebook to `external_docs/exports/pricebook/`",
        "2. Run `./scripts/sync/run_ingest.sh` — `legacy_item_count` should be **0**",
        "3. Search HCP pricebook for `mobile`, `trip`, `NGC Conversion` — no active hits",
        "",
    ]
    if missing_hcp:
        lines.append(f"*CSV missing {len(missing_hcp)} expected HCP names (may already be deleted):* " + ", ".join(missing_hcp))
        lines.append("")

    return "\n".join(lines)


def main() -> int:
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(build_report() + "\n")
    print(f"Wrote {OUT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
