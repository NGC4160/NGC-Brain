#!/usr/bin/env python3
"""
NGC Documents catalog — single source of truth for Command Center Documents.

Add present and future printable/working docs here, then run:
  python3 scripts/build_command_center.py

That copies files into docs/documents/, writes catalog.json, and wires the Documents zone.
"""

from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT_DIR = DOCS / "documents"
CATALOG_JSON = OUT_DIR / "catalog.json"

# ---------------------------------------------------------------------------
# Categories (order = hub display order). Add new buckets anytime.
# ---------------------------------------------------------------------------
CATEGORIES: list[dict] = [
    {
        "id": "hiring",
        "title": "Hiring",
        "description": "Phone screens, shop evals, and candidate scorecards",
        "color": "#38bdf8",
    },
    {
        "id": "team_hr",
        "title": "Team & HR",
        "description": "Counseling, coaching, and personnel forms",
        "color": "#34d399",
    },
    {
        "id": "operations",
        "title": "Operations",
        "description": "Shop checklists, throughput guides, floor tools",
        "color": "#f59e0b",
    },
    {
        "id": "customer",
        "title": "Customer-facing",
        "description": "Care guides, quote templates, pickup handouts",
        "color": "#a78bfa",
    },
    {
        "id": "finance_admin",
        "title": "Finance & admin",
        "description": "Deposits, billing helpers, bookkeeping checklists",
        "color": "#f472b6",
    },
]

# ---------------------------------------------------------------------------
# Documents — append new entries; set status "planned" until the file exists.
#
# Fields:
#   id, category, title, description
#   source: path relative to repo root (file to deploy) — omit if planned
#   deploy_name: filename under documents/<category>/ (defaults to source name)
#   type: pdf | html | markdown | link
#   href: optional override (external URL or in-site path)
#   audience: who uses it day-to-day
#   status: active | planned
#   featured: show on Command Center Documents zone cards
# ---------------------------------------------------------------------------
DOCUMENTS: list[dict] = [
    # --- Hiring ---
    {
        "id": "tech-phone-scorecard",
        "category": "hiring",
        "title": "Technician Phone Interview Scorecard",
        "description": "Fillable printable form — Print / Save PDF · 15–20 min phone screen",
        "source": "external_docs/templates/hiring/NGC_Technician_Phone_Interview_Scorecard.html",
        "deploy_name": "phone-interview-scorecard.html",
        "type": "html",
        "audience": "Ryan",
        "status": "active",
        "featured": True,
    },
    {
        "id": "tech-phone-scorecard-pdf",
        "category": "hiring",
        "title": "Phone Interview Scorecard (PDF)",
        "description": "Static PDF copy of the phone screen scorecard",
        "source": "external_docs/templates/hiring/NGC_Technician_Phone_Interview_Scorecard.pdf",
        "type": "pdf",
        "audience": "Ryan",
        "status": "active",
        "featured": False,
    },
    {
        "id": "hiring-phone-readme",
        "category": "hiring",
        "title": "Hiring phone screen — how to use",
        "description": "Indeed logistics already cleared; golf cart experience is bonus only",
        "source": "external_docs/templates/hiring/README.md",
        "type": "markdown",
        "audience": "Ryan",
        "status": "active",
        "featured": False,
    },
    {
        "id": "tech-hands-on-scorecard",
        "category": "hiring",
        "title": "Technician Hands-On Evaluation Scorecard",
        "description": "3–4 hr shop tryout after phone ADVANCE — safety gate, written, stations, troubleshooting",
        "source": "external_docs/templates/hiring/NGC_Technician_Hands_On_Eval_Scorecard.pdf",
        "type": "pdf",
        "audience": "Ryan",
        "status": "active",
        "featured": True,
    },
    {
        "id": "tech-hiring-quiz",
        "category": "hiring",
        "title": "Technician Hiring Quiz (Written)",
        "description": "40 questions · 120 pts · pass 75% · entry-level · critical safety rule",
        "source": "external_docs/templates/hiring/NGC_Technician_Hiring_Quiz.pdf",
        "type": "pdf",
        "audience": "Ryan",
        "status": "active",
        "featured": True,
    },
    {
        "id": "tech-hiring-quiz-key",
        "category": "hiring",
        "title": "Hiring Quiz Answer Key (evaluator only)",
        "description": "Answers + rationales — do not give to candidates",
        "source": "external_docs/templates/hiring/NGC_Technician_Hiring_Quiz_Answer_Key.pdf",
        "type": "pdf",
        "audience": "Ryan",
        "status": "active",
        "featured": False,
    },
    {
        "id": "admin-ryan-time-log",
        "category": "hiring",
        "title": "Ryan Admin Time Log (2 weeks)",
        "description": "Hiring gate — quantify transferable admin hours before / during Admin recruiting",
        "source": "external_docs/templates/hiring/NGC_Admin_Ryan_Time_Log.html",
        "deploy_name": "admin-ryan-time-log.html",
        "type": "html",
        "audience": "Ryan",
        "status": "active",
        "featured": True,
    },
    {
        "id": "admin-job-description",
        "category": "hiring",
        "title": "Admin / Service Coordinator job description",
        "description": "Internal JD + Indeed posting copy · ~$15/hr planning · Gusto for new-hire packet",
        "source": "external_docs/templates/hiring/NGC_Admin_Job_Description.md",
        "type": "markdown",
        "audience": "Ryan / Jesse",
        "status": "active",
        "featured": True,
    },
    {
        "id": "admin-phone-desk-eval",
        "category": "hiring",
        "title": "Admin Phone + Desk Eval Scorecard",
        "description": "Part A phone screen → Part B desk tryout · Print / Save PDF",
        "source": "external_docs/templates/hiring/NGC_Admin_Phone_and_Desk_Eval_Scorecard.html",
        "deploy_name": "admin-phone-desk-eval.html",
        "type": "html",
        "audience": "Ryan / Jesse",
        "status": "active",
        "featured": True,
    },
    {
        "id": "admin-front-office-sops",
        "category": "hiring",
        "title": "Admin front-office SOPs",
        "description": "Wait codes, standard estimates, approval follow-up, triage, marketing URL checks",
        "source": "external_docs/templates/hiring/NGC_Admin_Front_Office_SOPs.md",
        "type": "markdown",
        "audience": "Jesse / Christine (backup)",
        "status": "active",
        "featured": False,
    },
    {
        "id": "admin-kpi-review",
        "category": "hiring",
        "title": "Admin Weekly KPI + 30/60/90 Review",
        "description": "Board KPIs weekly · milestone review so role doesn’t become overhead",
        "source": "external_docs/templates/hiring/NGC_Admin_KPI_and_Review.html",
        "deploy_name": "admin-kpi-review.html",
        "type": "html",
        "audience": "Ryan / Jesse",
        "status": "active",
        "featured": True,
    },
    # --- Team & HR ---
    {
        "id": "personnel-counseling-form",
        "category": "team_hr",
        "title": "Personnel Counseling Form",
        "description": "Fillable branded form — print or save as PDF",
        "source": "external_docs/templates/personnel_counseling/NGC_Personnel_Counseling_Form.html",
        "deploy_name": "personnel-counseling.html",
        "type": "html",
        "audience": "Ryan",
        "status": "active",
        "featured": True,
        # Keep legacy Command Center path working
        "also_copy_to": ["docs/templates/personnel-counseling.html"],
    },
    {
        "id": "personnel-counseling-guide",
        "category": "team_hr",
        "title": "Personnel counseling procedure",
        "description": "When and how to use the counseling form",
        "source": "knowledge/05_team/personnel_counseling.md",
        "type": "markdown",
        "audience": "Ryan",
        "status": "active",
        "featured": True,
        "view_path": "knowledge/05_team/personnel_counseling.md",
    },
    {
        "id": "team-roles",
        "category": "team_hr",
        "title": "Team roles & hiring overview",
        "description": "Roster, RACI — Jesse coordinates shop ops; Jessica (Griffin & Furman) books",
        "source": "knowledge/05_team/roles.md",
        "type": "markdown",
        "audience": "Ryan / Jesse",
        "status": "active",
        "featured": False,
        "view_path": "knowledge/05_team/roles.md",
    },
    # --- Operations (seed with living guides; add printable checklists here) ---
    {
        "id": "shop-throughput",
        "category": "operations",
        "title": "Shop throughput playbook",
        "description": "WIP limits, lithium SLA, daily rhythm",
        "source": "knowledge/04_operations/shop_throughput.md",
        "type": "markdown",
        "audience": "Ryan",
        "status": "active",
        "featured": False,
        "view_path": "knowledge/04_operations/shop_throughput.md",
    },
    {
        "id": "shop-whiteboard",
        "category": "operations",
        "title": "Shop whiteboard layout",
        "description": "Physical board columns, cards, 8:15 huddle",
        "source": "knowledge/04_operations/shop_whiteboard_layout.md",
        "type": "markdown",
        "audience": "Ryan",
        "status": "active",
        "featured": False,
        "view_path": "knowledge/04_operations/shop_whiteboard_layout.md",
    },
    {
        "id": "golf-cart-inspection-report",
        "category": "operations",
        "title": "7-Point Golf Cart Inspection Report",
        "description": "Printable battery test + 7-point safety form · campground / event · CODE INSPECT10",
        "source": "external_docs/templates/operations/NGC_Golf_Cart_Inspection_Report.pdf",
        "type": "pdf",
        "audience": "Techs / Jesse",
        "status": "active",
        "featured": True,
    },
    {
        "id": "ops-templates-readme",
        "category": "operations",
        "title": "Operations templates — how to use",
        "description": "Inspection report usage and INSPECT10 booking note",
        "source": "external_docs/templates/operations/README.md",
        "type": "markdown",
        "audience": "Ryan / Jesse",
        "status": "active",
        "featured": False,
    },
    {
        "id": "shop-floor-checklist",
        "category": "operations",
        "title": "Shop-floor checklist (mobile steps stripped)",
        "description": "Printable bay checklist for Marlon / shop team — planned",
        "type": "pdf",
        "audience": "Techs",
        "status": "planned",
        "featured": False,
    },
    # --- Customer-facing ---
    {
        "id": "lithium-care-guide",
        "category": "customer",
        "title": "Lithium care guide (customer handout)",
        "description": "Give at conversion pickup — planned printable",
        "type": "pdf",
        "audience": "Jesse / techs",
        "status": "planned",
        "featured": False,
    },
    {
        "id": "professional-kit-quote",
        "category": "customer",
        "title": "Professional Kit quote template",
        "description": "Jesse-ready lithium quote script/template — planned",
        "type": "markdown",
        "audience": "Jesse",
        "status": "planned",
        "featured": False,
    },
    # --- Finance & admin ---
    {
        "id": "deposit-checklist",
        "category": "finance_admin",
        "title": "Deposit collection checklist",
        "description": "Batteries / motors / controllers before order — planned",
        "type": "markdown",
        "audience": "Jesse",
        "status": "planned",
        "featured": False,
    },
    {
        "id": "rental-insurance-rating",
        "category": "finance_admin",
        "title": "Golf-cart rental insurance rating",
        "description": "Planning catalog + quote calculator for a future rental fleet (not offered today)",
        "source": "knowledge/11_future_lines/golf_cart_rental_insurance_rating.md",
        "type": "markdown",
        "audience": "Ryan",
        "status": "active",
        "featured": True,
        "view_path": "knowledge/11_future_lines/golf_cart_rental_insurance_rating.md",
    },
    {
        "id": "rental-insurance-calculator",
        "category": "finance_admin",
        "title": "Rental insurance calculator factors (CSV)",
        "description": "Machine-readable multipliers for a planning spreadsheet",
        "source": "knowledge/11_future_lines/rental_insurance_quote_calculator.csv",
        "type": "markdown",
        "audience": "Ryan",
        "status": "active",
        "featured": False,
        "view_path": "knowledge/11_future_lines/rental_insurance_quote_calculator.csv",
    },
]


def _resolve_href(doc: dict, deploy_rel: str | None) -> str:
    if doc.get("href"):
        return doc["href"]
    if doc.get("view_path"):
        return f"view.html?path={doc['view_path']}"
    if doc.get("status") == "planned":
        return "documents/index.html"
    dtype = doc.get("type")
    if dtype == "markdown" and deploy_rel:
        # Prefer knowledge view_path when set; else view deployed copy
        return f"view.html?path={deploy_rel}"
    if deploy_rel:
        return deploy_rel
    return "documents/index.html"


def build_catalog() -> dict:
    """Copy deployable files and write docs/documents/catalog.json."""
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Clear previous deployed category folders (keep index.html / README)
    for child in list(OUT_DIR.iterdir()):
        if child.is_dir():
            shutil.rmtree(child)
        elif child.name == "catalog.json":
            child.unlink()

    items: list[dict] = []
    for doc in DOCUMENTS:
        category = doc["category"]
        status = doc.get("status", "active")
        deploy_rel = None
        source = doc.get("source")

        if status == "active" and source:
            src = ROOT / source
            if not src.exists():
                raise FileNotFoundError(f"Document source missing: {source} ({doc['id']})")

            # Markdown with view_path stays in knowledge/ — don't duplicate unless no view_path
            if doc.get("type") == "markdown" and doc.get("view_path"):
                deploy_rel = None
            else:
                cat_dir = OUT_DIR / category
                cat_dir.mkdir(parents=True, exist_ok=True)
                deploy_name = doc.get("deploy_name") or src.name
                dst = cat_dir / deploy_name
                shutil.copy2(src, dst)
                deploy_rel = f"documents/{category}/{deploy_name}"

            for extra in doc.get("also_copy_to") or []:
                extra_path = ROOT / extra
                extra_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, extra_path)

        href = _resolve_href(doc, deploy_rel)
        item = {
            "id": doc["id"],
            "category": category,
            "title": doc["title"],
            "description": doc["description"],
            "type": doc.get("type", "markdown"),
            "audience": doc.get("audience", ""),
            "status": status,
            "featured": bool(doc.get("featured")),
            "href": href,
            "source": source,
            "deploy_path": deploy_rel,
            "external": href.startswith("http"),
            "notes": doc.get("notes", ""),
        }
        items.append(item)

    catalog = {
        "generated_at": datetime.now(tz=timezone.utc).isoformat(),
        "title": "NGC Documents",
        "description": "Structured forms, scorecards, and working documents for Ryan, Jesse, and Christine",
        "how_to_add": (
            "Append an entry to DOCUMENTS in scripts/documents_catalog.py, "
            "place the file under external_docs/templates/<category>/, "
            "then run python3 scripts/build_command_center.py"
        ),
        "categories": CATEGORIES,
        "items": items,
        "counts": {
            "total": len(items),
            "active": sum(1 for i in items if i["status"] == "active"),
            "planned": sum(1 for i in items if i["status"] == "planned"),
        },
    }

    CATALOG_JSON.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")
    print(
        f"Documents catalog: {catalog['counts']['active']} active · "
        f"{catalog['counts']['planned']} planned → {CATALOG_JSON.relative_to(ROOT)}"
    )
    return catalog


def featured_zone_cards(catalog: dict | None = None) -> list[dict]:
    """Cards for the Command Center Documents zone."""
    cat = catalog or (
        json.loads(CATALOG_JSON.read_text(encoding="utf-8")) if CATALOG_JSON.exists() else build_catalog()
    )
    cards = [
        {
            "title": "Documents Hub",
            "desc": f"{cat['counts']['active']} active · {cat['counts']['planned']} planned — all categories",
            "href": "documents/index.html",
            "primary": True,
            "badge": f"{cat['counts']['active']} docs",
        }
    ]
    for item in cat["items"]:
        if not item.get("featured") or item.get("status") != "active":
            continue
        cards.append(
            {
                "title": item["title"],
                "desc": item["description"],
                "href": item["href"],
                "external": item.get("external", False),
            }
        )
    return cards


def manifest_items(catalog: dict | None = None) -> list[dict]:
    """Items for deliverables.json Documents / Templates section."""
    cat = catalog or (
        json.loads(CATALOG_JSON.read_text(encoding="utf-8")) if CATALOG_JSON.exists() else build_catalog()
    )
    out = []
    for item in cat["items"]:
        if item["status"] != "active":
            continue
        entry = {
            "title": item["title"],
            "description": item["description"],
            "path": item.get("source") or item.get("deploy_path") or "docs/documents/catalog.json",
            "type": item["type"],
            "view": item["href"],
            "tags": ["document", item["category"], item["type"]],
        }
        out.append(entry)
    return out


if __name__ == "__main__":
    build_catalog()
