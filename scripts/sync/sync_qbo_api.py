#!/usr/bin/env python3
"""Pull live data from QuickBooks Online API → external_docs/exports/qbo/"""

from __future__ import annotations

import json
import os
import sys
from datetime import date, datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "connectors"))

from qbo_client import QBOClient  # noqa: E402

OUT = ROOT / "external_docs" / "exports" / "qbo"


def write_json(name: str, data: object) -> Path:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    path.write_text(json.dumps(data, indent=2, default=str) + "\n")
    return path


def flatten_report_rows(rows: list | dict | None, depth: int = 0) -> list[tuple[str, float | None]]:
    """Flatten QBO report Rows into (label, amount) pairs for xlsx ingest."""
    out: list[tuple[str, float | None]] = []
    if not rows:
        return out

    if isinstance(rows, dict):
        rows = [rows]

    for row in rows:
        if not isinstance(row, dict):
            continue
        header = row.get("Header", {})
        if header.get("ColData"):
            label = str(header["ColData"][0].get("value", "")).strip()
            amount = None
            if len(header["ColData"]) > 1:
                val = header["ColData"][1].get("value")
                if val not in (None, ""):
                    try:
                        amount = float(str(val).replace(",", ""))
                    except ValueError:
                        amount = None
            if label:
                out.append((("  " * depth) + label, amount))

        for col in row.get("ColData") or []:
            label = str(col.get("value", "")).strip()
            if not label:
                continue
            amount = None
            # ColData rows sometimes carry value in sibling Summary
            pass

        summary = row.get("Summary", {})
        if summary.get("ColData"):
            label = str(summary["ColData"][0].get("value", "")).strip()
            amount = None
            if len(summary["ColData"]) > 1:
                val = summary["ColData"][1].get("value")
                if val not in (None, ""):
                    try:
                        amount = float(str(val).replace(",", ""))
                    except ValueError:
                        amount = None
            if label:
                out.append((("  " * depth) + label, amount))

        nested = row.get("Rows", {})
        if nested:
            child_rows = nested.get("Row", nested if isinstance(nested, list) else [])
            out.extend(flatten_report_rows(child_rows, depth + 1))

        # Leaf rows with ColData only
        if row.get("ColData") and not row.get("Rows"):
            cols = row["ColData"]
            label = str(cols[0].get("value", "")).strip()
            amount = None
            if len(cols) > 1:
                val = cols[1].get("value")
                if val not in (None, ""):
                    try:
                        amount = float(str(val).replace(",", ""))
                    except ValueError:
                        amount = None
            if label:
                out.append((("  " * depth) + label, amount))

    return out


def write_pl_xlsx(report: dict, path: Path) -> None:
    try:
        import openpyxl
    except ImportError as e:
        raise RuntimeError("openpyxl required for QBO xlsx export — pip install openpyxl") from e

    rows = flatten_report_rows(report.get("Rows", {}).get("Row", []))
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Profit and Loss"
    header = report.get("Header", {})
    start = header.get("StartPeriod", "")
    end = header.get("EndPeriod", "")
    ws.append([f"Profit and Loss — {start} to {end}", None])
    ws.append(["Account", "Total"])
    for label, amount in rows:
        ws.append([label, amount])
    wb.save(path)
    wb.close()


def main() -> int:
    try:
        client = QBOClient()
    except ValueError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1

        print("Testing QBO connection...")
    try:
        test = client.test_connection()
        write_json("company_test.json", test)
        name = test.get("company_name") or "(unknown)"
        print(f"  OK — connected to {name} (realm {client.realm_id}, {client.environment})")
        if client.environment == "production" and str(client.realm_id).startswith("9130"):
            print(
                "  NOTE: Realm looks like a sandbox company. "
                "Re-authorize against live Neighborhood Golf Carts for real P&L.",
                file=sys.stderr,
            )
    except Exception as e:
        print(f"  FAIL: {e}", file=sys.stderr)
        write_json("company_test.json", {"ok": False, "error": str(e)})
        return 1

    start_date, end_date = QBOClient.last_12_months_range()
    saved: list[str] = []

    try:
        pl = client.get_report(
            "ProfitAndLoss",
            start_date=start_date,
            end_date=end_date,
            accounting_method="Accrual",
        )
        write_json("profit_and_loss_last_12_months.json", pl)
        xlsx_path = OUT / "profit_and_loss_last_12_months.xlsx"
        write_pl_xlsx(pl, xlsx_path)
        saved.extend(["profit_and_loss_last_12_months.json", "profit_and_loss_last_12_months.xlsx"])
        print(f"  Saved P&L ({start_date} → {end_date})")
    except Exception as e:
        print(f"  P&L skipped: {e}")

    try:
        bs_end = date.today().isoformat()
        bs = client.get_report(
            "BalanceSheet",
            start_date=bs_end,
            end_date=bs_end,
            accounting_method="Accrual",
        )
        write_json("balance_sheet.json", bs)
        saved.append("balance_sheet.json")
        print("  Saved balance_sheet.json")
    except Exception as e:
        print(f"  Balance sheet skipped: {e}")

    try:
        coa = client.query("select * from Account maxresults 1000")
        write_json("chart_of_accounts.json", coa)
        saved.append("chart_of_accounts.json")
        count = len(coa.get("QueryResponse", {}).get("Account", []))
        print(f"  Saved chart_of_accounts.json ({count} accounts)")
    except Exception as e:
        print(f"  Chart of accounts skipped: {e}")

    try:
        items = client.query("select Id, Name, Type, Active, UnitPrice, Description from Item maxresults 1000")
        write_json("products_services.json", items)
        saved.append("products_services.json")
        count = len(items.get("QueryResponse", {}).get("Item", []))
        print(f"  Saved products_services.json ({count} items)")
    except Exception as e:
        print(f"  Products/services skipped: {e}")

    manifest = {
        "synced_at": _now(),
        "source": "quickbooks_online_api",
        "environment": client.environment,
        "realm_id": client.realm_id,
        "paths": saved,
        "refresh_token_rotated": bool(client.refresh_token != os.environ.get("QBO_REFRESH_TOKEN")),
    }
    write_json("api_sync_manifest.json", manifest)
    print(f"\nDone → {OUT}/")

    if manifest.get("refresh_token_rotated"):
        print(
            "NOTE: Intuit rotated QBO_REFRESH_TOKEN — update GitHub secret / .env with new token.",
            file=sys.stderr,
        )
    return 0


def _now() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


if __name__ == "__main__":
    sys.exit(main())
