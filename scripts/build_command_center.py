#!/usr/bin/env python3
"""Build NGC Command Center data for GitHub Pages deploy."""

from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
LIVE = DOCS / "live"
ASSETS = DOCS / "assets"

REPO = "NGC4160/NGC-Brain"
BRANCH = "main"
JOBS_PATH = ROOT / "external_docs" / "exports" / "hcp" / "jobs.json"
SYNC_MANIFEST = ROOT / "knowledge" / ".generated" / "sync_manifest.json"


def gh_raw(path: str) -> str:
    return f"https://raw.githubusercontent.com/{REPO}/{BRANCH}/{path}"


def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def build_auth_config() -> None:
    password = os.environ.get("NGC_COMMAND_CENTER_PASSWORD", "").strip()
    if not password:
        # Placeholder hash — site prompts owners to set GitHub Actions secret.
        password = "__UNCONFIGURED__"
    config = {
        "passwordHash": sha256_hex(password),
        "sessionHours": 24,
        "allowedUsers": ["Ryan", "Christine"],
        "configured": password != "__UNCONFIGURED__",
    }
    (ASSETS / "auth-config.js").write_text(
        f"window.NGC_AUTH = {json.dumps(config, indent=2)};\n",
        encoding="utf-8",
    )


def load_jobs() -> tuple[list[dict], str | None]:
    if not JOBS_PATH.exists():
        return [], None
    payload = json.loads(JOBS_PATH.read_text())
    if isinstance(payload, dict):
        return payload.get("jobs", []), payload.get("synced_at")
    if isinstance(payload, list):
        return payload, None
    return [], None


def build_ops_snapshot() -> dict:
    now = datetime.now(tz=timezone.utc)
    jobs, synced_at = load_jobs()

    # Reuse shop board + deposit logic via scripts when possible
    shop_md = ROOT / "knowledge" / ".generated" / "shop_board.md"
    deposit_md = ROOT / "knowledge" / ".generated" / "deposit_alerts.md"

    if jobs and not shop_md.exists():
        subprocess.run([sys.executable, str(ROOT / "scripts/sync/generate_shop_board.py")], check=False)
    if jobs and not deposit_md.exists():
        subprocess.run([sys.executable, str(ROOT / "scripts/admin_bot/deposit_gate_alerts.py")], check=False)

    active_statuses = {"in progress", "scheduled", "needs scheduling"}
    active = [j for j in jobs if str(j.get("work_status", "")).lower() in active_statuses]
    in_progress = [j for j in active if str(j.get("work_status", "")).lower() == "in progress"]

    lithium_keywords = ("lithium", "lfp", "lifepo4", "conversion", "professional")
    stale = []
    lithium_at_risk = []
    for j in in_progress:
        desc = str(j.get("description") or "").lower()
        created = j.get("created_at") or j.get("updated_at")
        days = 0
        if created:
            try:
                dt = datetime.fromisoformat(str(created).replace("Z", "+00:00"))
                days = max(0, (now - dt).days)
            except ValueError:
                pass
        is_li = any(k in desc for k in lithium_keywords)
        row = {
            "invoice": j.get("invoice_number") or str(j.get("id", ""))[:8],
            "description": (j.get("description") or "")[:80],
            "days": days,
            "lithium": is_li,
            "status": j.get("work_status"),
        }
        if days > 14:
            stale.append(row)
        if is_li and days > 3:
            lithium_at_risk.append(row)

    sync_data: dict = {"exists": False}
    if SYNC_MANIFEST.exists():
        sync_data = json.loads(SYNC_MANIFEST.read_text())
        sync_data["exists"] = True

    deposit_count = 0
    if deposit_md.exists():
        deposit_count = deposit_md.read_text().count("| DEP-")

    return {
        "generated_at": now.isoformat(),
        "jobs_synced_at": synced_at,
        "has_live_data": bool(jobs),
        "metrics": {
            "in_progress": len(in_progress),
            "scheduled": len([j for j in active if str(j.get("work_status", "")).lower() == "scheduled"]),
            "needs_scheduling": len([j for j in active if str(j.get("work_status", "")).lower() == "needs scheduling"]),
            "active_pipeline": len(active),
            "wip_target": 6,
            "wip_over": max(0, len(in_progress) - 6),
            "stale_15_plus": len(stale),
            "lithium_at_risk": len(lithium_at_risk),
            "deposit_alerts": deposit_count,
        },
        "alerts": {
            "lithium_at_risk": sorted(lithium_at_risk, key=lambda x: x["days"], reverse=True)[:8],
            "stale_wip": sorted(stale, key=lambda x: x["days"], reverse=True)[:8],
        },
        "sync": sync_data,
        "live_files": {
            "shop_board": "live/shop_board.md" if shop_md.exists() else None,
            "deposit_alerts": "live/deposit_alerts.md" if deposit_md.exists() else None,
            "sync_manifest": "live/sync_manifest.json" if SYNC_MANIFEST.exists() else None,
        },
    }


def parse_backlog_pipeline() -> list[dict]:
    backlog = ROOT / "knowledge" / "09_daily_ops" / "improvement_backlog.md"
    if not backlog.exists():
        return []

    text = backlog.read_text()
    items: list[dict] = []
    current_category = "General"

    for line in text.splitlines():
        if line.startswith("## "):
            current_category = line[3:].strip()
            continue
        if not line.startswith("| P"):
            continue
        cols = [c.strip() for c in line.split("|")[1:-1]]
        if len(cols) < 5 or cols[0] in ("P", "---"):
            continue
        priority, name, why, owner, status = cols[:5]
        if priority.startswith("---"):
            continue
        items.append(
            {
                "priority": priority,
                "name": name,
                "why": why,
                "owner": owner,
                "status": status,
                "category": current_category,
            }
        )
    return items


def build_systems() -> list[dict]:
    return [
        {
            "id": "hcp",
            "name": "Housecall Pro",
            "role": "Jobs · Pricebook · Invoicing",
            "url": "https://pro.housecallpro.com/pro/login",
            "status": "online",
            "icon": "📋",
        },
        {
            "id": "qbo",
            "name": "QuickBooks Online",
            "role": "Accounting · P&L · Inventory",
            "url": "https://qbo.intuit.com/",
            "status": "online",
            "icon": "💰",
        },
        {
            "id": "website",
            "name": "NGCGolfCarts.com",
            "role": "Public website",
            "url": "https://www.NGCGolfCarts.com",
            "status": "online",
            "icon": "🌐",
        },
        {
            "id": "gbp",
            "name": "Google Business",
            "role": "Reviews · Local SEO",
            "url": "https://www.google.com/maps/place/Neighborhood+Golf+Carts/@30.4693929,-90.0870885,17z",
            "status": "online",
            "icon": "📍",
        },
        {
            "id": "drive",
            "name": "Google Drive",
            "role": "SOPs · Document repository",
            "url": "https://drive.google.com/",
            "status": "online",
            "icon": "📁",
        },
        {
            "id": "cursor",
            "name": "NGC Business Brain",
            "role": "Cursor AI workspace",
            "url": "https://github.com/NGC4160/NGC-Brain",
            "status": "online",
            "icon": "🧠",
        },
    ]


def build_zones(manifest: dict, ops: dict, pipeline: list[dict]) -> list[dict]:
    return [
        {
            "id": "live-ops",
            "title": "Live Ops",
            "icon": "◉",
            "color": "#00f0ff",
            "description": "Real-time shop floor intelligence",
            "cards": [
                {
                    "title": "Operations Dashboard",
                    "desc": "WIP, lithium lane, deposit alerts, sync status",
                    "href": "dashboard.html",
                    "badge": f"{ops['metrics']['in_progress']} in shop" if ops["has_live_data"] else "Sync needed",
                    "primary": True,
                },
                {
                    "title": "Shop Board",
                    "desc": "Auto-generated WIP board from HCP",
                    "href": "view.html?path=live/shop_board.md",
                },
                {
                    "title": "Deposit Alerts",
                    "desc": "Christine's deposit gate queue",
                    "href": "view.html?path=live/deposit_alerts.md",
                },
            ],
        },
        {
            "id": "systems",
            "title": "Systems",
            "icon": "⬡",
            "color": "#6faa2d",
            "description": "External platforms NGC runs on",
            "cards": [{"title": s["name"], "desc": s["role"], "href": s["url"], "external": True} for s in build_systems()],
        },
        {
            "id": "daily",
            "title": "Daily Rhythm",
            "icon": "◷",
            "color": "#a78bfa",
            "description": "Owner and service manager rituals",
            "cards": [
                {"title": "Morning Briefing", "desc": "8:00 AM — priorities & capacity", "href": "view.html?path=prompts/morning_briefing.md"},
                {"title": "End of Day", "desc": "5:00 PM recap & tomorrow prep", "href": "view.html?path=prompts/end_of_day.md"},
                {"title": "Weekly Review", "desc": "Friday scorecard & KPIs", "href": "view.html?path=prompts/weekly_review.md"},
                {"title": "Shop Throughput", "desc": "WIP limits & lithium SLA", "href": "view.html?path=knowledge/04_operations/shop_throughput.md"},
                {"title": "Whiteboard Layout", "desc": "Physical board for 8:15 huddle", "href": "view.html?path=knowledge/04_operations/shop_whiteboard_layout.md"},
            ],
        },
        {
            "id": "pipeline",
            "title": "Build Pipeline",
            "icon": "▲",
            "color": "#f59e0b",
            "description": "Everything being built — ops, automation, growth",
            "cards": [
                {
                    "title": "Improvement Backlog",
                    "desc": f"{len(pipeline)} tracked projects · P1–P3",
                    "href": "view.html?path=knowledge/09_daily_ops/improvement_backlog.md",
                    "primary": True,
                },
                {
                    "title": "Admin Bot Spec",
                    "desc": "Deposit alerts · review requests · webhooks",
                    "href": "view.html?path=knowledge/10_automation/ngc_admin_bot_spec.md",
                },
                {
                    "title": "Automation Catalog",
                    "desc": "Tier 1–3 automation roadmap",
                    "href": "view.html?path=knowledge/10_automation/automations_catalog.md",
                },
                {
                    "title": "Decision Log",
                    "desc": "Policy changes with dates",
                    "href": "view.html?path=knowledge/09_daily_ops/decision_log.md",
                },
            ],
        },
        {
            "id": "knowledge",
            "title": "Knowledge Base",
            "icon": "◫",
            "color": "#38bdf8",
            "description": "Business brain — policies, pricing, team",
            "cards": [
                {"title": "Browse All Docs", "desc": f"{manifest.get('total_items', 0)} indexed deliverables", "href": "explore.html", "primary": True},
                {"title": "Lithium Conversions", "desc": "Professional Kits, warranty, deposits", "href": "view.html?path=knowledge/02_products/lithium_conversions.md"},
                {"title": "Shop Services", "desc": "Diagnostics, pickup, fees", "href": "view.html?path=knowledge/03_services/shop_services.md"},
                {"title": "Pricebook Reference", "desc": "Key HCP line items", "href": "view.html?path=knowledge/03_services/pricebook_reference.md"},
            ],
        },
        {
            "id": "tools",
            "title": "Tools & Forms",
            "icon": "⚙",
            "color": "#34d399",
            "description": "Templates, scripts, Cursor skills",
            "cards": [
                {"title": "Personnel Counseling", "desc": "Fillable HR form — print/PDF", "href": "templates/personnel-counseling.html"},
                {"title": "Start Here (Cursor)", "desc": "How to run the business brain", "href": "view.html?path=START_HERE.md"},
                {"title": "HCP API Setup", "desc": "Live sync & MCP configuration", "href": "view.html?path=knowledge/10_automation/hcp_api_setup.md"},
                {"title": "Integration Playbook", "desc": "QBO MCP, Zapier, Everlogic", "href": "view.html?path=knowledge/10_automation/integration_playbook.md"},
            ],
        },
    ]


def copy_live_files() -> None:
    LIVE.mkdir(parents=True, exist_ok=True)
    mappings = [
        (ROOT / "knowledge" / ".generated" / "shop_board.md", LIVE / "shop_board.md"),
        (ROOT / "knowledge" / ".generated" / "deposit_alerts.md", LIVE / "deposit_alerts.md"),
        (ROOT / "knowledge" / ".generated" / "sync_manifest.json", LIVE / "sync_manifest.json"),
        (ROOT / "knowledge" / ".generated" / "legacy_pricebook_audit.md", LIVE / "legacy_pricebook_audit.md"),
    ]
    for src, dst in mappings:
        if src.exists():
            dst.write_text(src.read_text(encoding="utf-8"), encoding="utf-8")


def run_manifest_builder() -> dict:
    script = ROOT / "scripts" / "build_pages_manifest.py"
    subprocess.run([sys.executable, str(script)], check=True)
    return json.loads((DOCS / "deliverables.json").read_text())


def main() -> None:
    LIVE.mkdir(parents=True, exist_ok=True)
    ASSETS.mkdir(parents=True, exist_ok=True)

    build_auth_config()
    manifest = run_manifest_builder()
    ops = build_ops_snapshot()
    copy_live_files()
    pipeline = parse_backlog_pipeline()

    command_center = {
        "generated_at": datetime.now(tz=timezone.utc).isoformat(),
        "site_name": "NGC Command Center",
        "site_url": f"https://{REPO.split('/')[0].lower()}.github.io/{REPO.split('/')[1]}/",
        "repo": REPO,
        "branch": BRANCH,
        "owners": ["Ryan White", "Christine White"],
        "ops": ops,
        "systems": build_systems(),
        "pipeline": pipeline,
        "zones": build_zones(manifest, ops, pipeline),
        "manifest_total": manifest.get("total_items", 0),
    }

    (DOCS / "command-center.json").write_text(json.dumps(command_center, indent=2) + "\n", encoding="utf-8")
    (LIVE / "ops.json").write_text(json.dumps(ops, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote command-center.json · {len(pipeline)} pipeline items · live data: {ops['has_live_data']}")


if __name__ == "__main__":
    main()
