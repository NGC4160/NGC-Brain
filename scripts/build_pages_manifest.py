#!/usr/bin/env python3
"""Generate docs/deliverables.json for the GitHub Pages hub."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "deliverables.json"

REPO = "NGC4160/NGC-Brain"
BRANCH = "main"


def gh_blob(path: str) -> str:
    return f"https://github.com/{REPO}/blob/{BRANCH}/{path}"


def gh_raw(path: str) -> str:
    return f"https://raw.githubusercontent.com/{REPO}/{BRANCH}/{path}"


def md_item(path: Path, title: str, description: str, *, tags: list[str] | None = None) -> dict:
    rel = path.relative_to(ROOT).as_posix()
    return {
        "title": title,
        "description": description,
        "path": rel,
        "type": "markdown",
        "view": f"view.html?path={rel}",
        "github": gh_blob(rel),
        "raw": gh_raw(rel),
        "tags": tags or [],
    }


def file_item(path: Path, title: str, description: str, item_type: str, *, href: str | None = None, tags: list[str] | None = None) -> dict:
    rel = path.relative_to(ROOT).as_posix()
    return {
        "title": title,
        "description": description,
        "path": rel,
        "type": item_type,
        "view": href or rel,
        "github": gh_blob(rel),
        "tags": tags or [],
    }


def build_sections() -> list[dict]:
    sections: list[dict] = []

    sections.append(
        {
            "id": "start",
            "title": "Start Here",
            "icon": "🚀",
            "description": "How to use the NGC Business Brain in Cursor.",
            "items": [
                md_item(ROOT / "START_HERE.md", "Start Here", "Daily rhythm, quick prompts, and how to feed the AI.", tags=["cursor", "guide"]),
                md_item(ROOT / "README.md", "Repository README", "Project overview on GitHub.", tags=["meta"]),
            ],
        }
    )

    knowledge = [
        ("00_index.md", "Knowledge Index", "Map of all business brain files."),
        ("01_company/profile.md", "Company Profile", "Identity, contact, hours, positioning."),
        ("02_products/lithium_conversions.md", "Lithium Conversions", "Professional Kits, warranty, deposits, turnaround."),
        ("03_services/shop_services.md", "Shop Services", "Diagnostics, fees, pickup/delivery, deposits."),
        ("03_services/pricebook_reference.md", "Pricebook Reference", "Key HCP line items and categories."),
        ("04_operations/shop_workflow.md", "Shop Workflow", "How work flows through the shop."),
        ("04_operations/shop_throughput.md", "Shop Throughput", "WIP limits, daily rhythm, lithium SLA."),
        ("04_operations/shop_whiteboard_layout.md", "Shop Whiteboard", "Physical board columns, cards, colors."),
        ("05_team/roles.md", "Team Roles", "Roster and responsibilities."),
        ("05_team/personnel_counseling.md", "Personnel Counseling", "Procedure and form usage guide."),
        ("06_systems/tools.md", "Systems & Tools", "Housecall Pro, QuickBooks, future DMS."),
        ("07_customers_marketing/market.md", "Market & Marketing", "Service area, customer types, channels."),
        ("08_finance/overview.md", "Finance Overview", "Income categories, COA, sales tax."),
        ("09_daily_ops/README.md", "Daily Ops Guide", "Operating rhythms and data to feed AI."),
        ("09_daily_ops/improvement_backlog.md", "Improvement Backlog", "Prioritized growth and ops projects."),
        ("09_daily_ops/decision_log.md", "Decision Log", "Policy decisions with dates."),
        ("09_daily_ops/weekly_review_template.md", "Weekly Review Template", "Friday review checklist."),
        ("10_automation/README.md", "Automation Architecture", "Connectors, MCP, hooks, roadmap."),
        ("10_automation/integration_playbook.md", "Integration Playbook", "Step-by-step MCP and connector setup."),
        ("10_automation/automations_catalog.md", "Automations Catalog", "Ideas and automation inventory."),
        ("10_automation/hcp_api_setup.md", "HCP API Setup", "Housecall Pro MAX API sync guide."),
        ("10_automation/ngc_admin_bot_spec.md", "Admin Bot Spec", "Deposit alerts, review requests, webhooks."),
        ("10_automation/legacy_pricebook_cleanup.md", "Legacy Pricebook Cleanup", "Deactivate mobile and NGC Conversion items."),
        ("archive/legacy_mobile.md", "Legacy Mobile (Archive)", "Discontinued mobile items — do not quote."),
    ]
    sections.append(
        {
            "id": "knowledge",
            "title": "Knowledge Base",
            "icon": "📚",
            "description": "Single source of truth for NGC operations, pricing, and policies.",
            "items": [md_item(ROOT / "knowledge" / rel, title, desc, tags=["knowledge"]) for rel, title, desc in knowledge],
        }
    )

    prompts = [
        ("morning_briefing.md", "Morning Briefing", "Start-of-day priorities and shop capacity."),
        ("end_of_day.md", "End of Day", "Recap, blockers, tomorrow prep."),
        ("weekly_review.md", "Weekly Review", "KPIs, marketing, ops review (Fridays)."),
        ("monthly_refresh.md", "Monthly Refresh", "Export refresh and knowledge updates."),
        ("quote_and_customer.md", "Quotes & Customers", "Customer replies and quote assistance."),
        ("growth_and_strategy.md", "Growth & Strategy", "Revenue and strategic planning prompts."),
    ]
    sections.append(
        {
            "id": "prompts",
            "title": "Cursor Prompts",
            "icon": "💬",
            "description": "Copy-paste prompts for daily rhythms and common tasks.",
            "items": [md_item(ROOT / "prompts" / rel, title, desc, tags=["prompt", "cursor"]) for rel, title, desc in prompts],
        }
    )

    sections.append(
        {
            "id": "templates",
            "title": "Templates & Forms",
            "icon": "📋",
            "description": "Interactive and printable deliverables.",
            "items": [
                {
                    "title": "Personnel Counseling Form",
                    "description": "Branded fillable form — print or save as PDF.",
                    "path": "docs/templates/personnel-counseling.html",
                    "type": "html",
                    "view": "templates/personnel-counseling.html",
                    "github": gh_blob("external_docs/templates/personnel_counseling/NGC_Personnel_Counseling_Form.html"),
                    "tags": ["form", "hr", "interactive"],
                },
                md_item(
                    ROOT / "external_docs/templates/personnel_counseling/README.md",
                    "Personnel Form README",
                    "How to use and update the counseling template.",
                    tags=["form", "hr"],
                ),
            ],
        }
    )

    scripts = [
        ("sync/run_ingest.sh", "Run Ingest", "Sync HCP/QBO exports into knowledge manifest.", "shell"),
        ("sync/ingest_exports.py", "Ingest Exports", "Parse pricebook and QBO exports.", "python"),
        ("sync/sync_hcp_api.py", "HCP API Sync", "Pull live jobs and pricebook from HCP MAX.", "python"),
        ("sync/run_hcp_sync.sh", "Run HCP Sync", "Shell wrapper for HCP API sync.", "shell"),
        ("sync/generate_shop_board.py", "Shop Board Generator", "Auto-generate shop board from HCP jobs.", "python"),
        ("sync/run_shop_board.sh", "Run Shop Board", "Shell wrapper for shop board generation.", "shell"),
        ("connectors/hcp_client.py", "HCP Client", "Housecall Pro API connector module.", "python"),
        ("admin_bot/deposit_gate_alerts.py", "Deposit Gate Alerts", "Admin Bot Phase 1 — deposit notifications.", "python"),
        ("admin_bot/legacy_pricebook_audit.py", "Legacy Pricebook Audit", "Find active mobile/NGC Conversion items.", "python"),
        ("admin_bot/run_deposit_alerts.sh", "Run Deposit Alerts", "Shell wrapper for deposit alerts.", "shell"),
        ("admin_bot/run_legacy_audit.sh", "Run Legacy Audit", "Shell wrapper for pricebook audit.", "shell"),
        ("generate_personnel_counseling_docx.py", "Generate Counseling DOCX", "Build Word version of HR form.", "python"),
        ("build_pages_manifest.py", "Pages Manifest Builder", "Regenerate GitHub Pages deliverables index.", "python"),
    ]
    sections.append(
        {
            "id": "scripts",
            "title": "Scripts & Automation",
            "icon": "⚙️",
            "description": "Sync, connectors, and admin bot tooling built in Cursor.",
            "items": [
                file_item(ROOT / "scripts" / rel, title, desc, item_type, tags=["script", item_type])
                for rel, title, desc, item_type in scripts
            ],
        }
    )

    skills = [
        ("ngc-hcp-api/SKILL.md", "HCP API Skill", "Sync live HCP data, jobs summary, pricebook compare."),
        ("ngc-morning-briefing/SKILL.md", "Morning Briefing Skill", "Run the service manager morning briefing."),
        ("ngc-sync-exports/SKILL.md", "Sync Exports Skill", "Refresh exports and detect pricebook drift."),
    ]
    sections.append(
        {
            "id": "skills",
            "title": "Cursor Skills",
            "icon": "🎯",
            "description": "Specialized AI skills for recurring NGC workflows.",
            "items": [
                md_item(ROOT / ".cursor/skills" / rel, title, desc, tags=["skill", "cursor"])
                for rel, title, desc in skills
            ],
        }
    )

    sections.append(
        {
            "id": "cursor-config",
            "title": "Cursor Configuration",
            "icon": "🔧",
            "description": "Rules, hooks, and MCP templates that power the brain.",
            "items": [
                file_item(
                    ROOT / ".cursor/rules/ngc-business-brain.mdc",
                    "Business Brain Rules",
                    "Core AI rules — shop-only, lithium, pricing authority.",
                    "config",
                    tags=["cursor", "rules"],
                ),
                file_item(
                    ROOT / ".cursor/rules/ngc-daily-operator.mdc",
                    "Daily Operator Rules",
                    "Chief-of-staff behavior, backlog ties, proactive offers.",
                    "config",
                    tags=["cursor", "rules"],
                ),
                file_item(
                    ROOT / ".cursor/mcp.json.example",
                    "MCP Config Example",
                    "Template for QuickBooks and other MCP connectors.",
                    "config",
                    tags=["cursor", "mcp"],
                ),
                file_item(
                    ROOT / ".cursor/hooks.json",
                    "Session Hooks",
                    "Auto-sync exports on session start and file changes.",
                    "config",
                    tags=["cursor", "hooks"],
                ),
                file_item(
                    ROOT / ".env.example",
                    "Environment Example",
                    "Required API keys and env vars (no secrets).",
                    "config",
                    tags=["config"],
                ),
            ],
        }
    )

    exports = [
        ("external_docs/exports/pricebook/NeighborhoodGolfCarts_pricebook_export.csv", "HCP Pricebook Export", "282-item Housecall Pro pricebook CSV.", "data"),
        ("external_docs/exports/qbo/chart_of_accounts.xlsx", "Chart of Accounts", "QuickBooks COA export.", "data"),
        ("external_docs/exports/qbo/profit_and_loss_last_12_months.xlsx", "P&L (12 months)", "QuickBooks profit and loss.", "data"),
        ("external_docs/exports/qbo/balance_sheet_current.xlsx", "Balance Sheet", "Current QuickBooks balance sheet.", "data"),
        ("external_docs/exports/qbo/products_and_services.xlsx", "QBO Products & Services", "QuickBooks product/service list.", "data"),
    ]
    sections.append(
        {
            "id": "exports",
            "title": "Data Exports",
            "icon": "📊",
            "description": "HCP pricebook and QuickBooks exports (refresh monthly).",
            "items": [
                file_item(ROOT / rel, title, desc, item_type, tags=["export", "data"])
                for rel, title, desc, item_type in exports
            ],
        }
    )

    return sections


def main() -> None:
    sections = build_sections()
    total = sum(len(s["items"]) for s in sections)
    payload = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "repo": REPO,
        "branch": BRANCH,
        "site_url": f"https://{REPO.split('/')[0]}.github.io/{REPO.split('/')[1]}/",
        "total_items": total,
        "sections": sections,
    }
    DOCS.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({total} items across {len(sections)} sections)")


if __name__ == "__main__":
    main()
