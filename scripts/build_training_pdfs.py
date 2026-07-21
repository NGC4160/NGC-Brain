#!/usr/bin/env python3
"""Generate PDF downloads for the Golf Cart Diagnostic Technician training package.

Outputs:
  docs/training/pdfs/*.pdf
  docs/training/pdfs/manifest.json
"""

from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import markdown
from weasyprint import HTML

ROOT = Path(__file__).resolve().parents[1]
TRAINING = ROOT / "docs" / "training" / "golf-cart-diagnostic-technician"
PDF_DIR = ROOT / "docs" / "training" / "pdfs"
HUB_REL = "training/downloads.html"

CSS = """
@page {
  size: Letter;
  margin: 0.7in 0.7in 0.8in 0.7in;
  @bottom-center {
    content: "NGC · Golf Cart Diagnostic Technician Training · " counter(page);
    font-size: 9pt;
    color: #666;
  }
}
body {
  font-family: "DejaVu Sans", "Helvetica Neue", Arial, sans-serif;
  font-size: 10.5pt;
  line-height: 1.4;
  color: #111;
}
h1, h2, h3, h4 { color: #0b3d1f; page-break-after: avoid; }
h1 { font-size: 18pt; border-bottom: 2px solid #6faa2d; padding-bottom: 0.2em; }
h2 { font-size: 14pt; margin-top: 1.2em; }
h3 { font-size: 12pt; }
table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.8em 0;
  font-size: 9.5pt;
  page-break-inside: avoid;
}
th, td {
  border: 1px solid #ccc;
  padding: 4px 6px;
  text-align: left;
  vertical-align: top;
}
th { background: #eef6e4; }
code, pre {
  font-family: "DejaVu Sans Mono", Consolas, monospace;
  font-size: 9pt;
}
pre {
  background: #f6f6f6;
  padding: 8px;
  border: 1px solid #ddd;
  white-space: pre-wrap;
}
blockquote {
  border-left: 3px solid #6faa2d;
  margin-left: 0;
  padding-left: 0.8em;
  color: #333;
}
ul, ol { padding-left: 1.3em; }
.meta {
  color: #555;
  font-size: 9.5pt;
  margin-bottom: 1em;
}
"""

# Stable catalog of printable materials
CATALOG: list[dict] = [
    {
        "id": "program-guide",
        "title": "Program Guide",
        "category": "program",
        "source": "00_program_guide.md",
        "weeks": list(range(1, 11)),
    },
    {
        "id": "instructor-master-checklist",
        "title": "Instructor Master Checklist",
        "category": "program",
        "source": "00_instructor_master_checklist.md",
        "weeks": list(range(1, 11)),
    },
    {
        "id": "package-readme",
        "title": "Training Package README",
        "category": "program",
        "source": "README.md",
        "weeks": [],
    },
]

for week, slug, src_name, title in [
    (1, "week-01-safety-tools-electrical", "week_01_safety_tools_electrical.md", "Week 1 — Safety, Tools & Electrical"),
    (2, "week-02-lead-acid-batteries", "week_02_lead_acid_batteries.md", "Week 2 — Lead-Acid Batteries"),
    (3, "week-03-chargers-lithium", "week_03_chargers_lithium.md", "Week 3 — Chargers & Lithium"),
    (4, "week-04-electric-motors", "week_04_electric_motors.md", "Week 4 — Electric Motors"),
    (5, "week-05-controllers-throttle-solenoids", "week_05_controllers_throttle_solenoids.md", "Week 5 — Controllers, Throttle & Solenoids"),
    (6, "week-06-wiring-diagrams", "week_06_wiring_diagrams.md", "Week 6 — Wiring Diagrams"),
    (7, "week-07-diagnostic-methodology", "week_07_diagnostic_methodology.md", "Week 7 — Diagnostic Methodology"),
    (8, "week-08-mechanical-systems", "week_08_mechanical_systems.md", "Week 8 — Mechanical Systems"),
    (9, "week-09-gas-powered-carts", "week_09_gas_powered_carts.md", "Week 9 — Gas-Powered Carts"),
    (10, "week-10-pm-certification", "week_10_pm_certification.md", "Week 10 — PM & Certification"),
]:
    CATALOG.append(
        {
            "id": slug,
            "title": title,
            "category": "weeks",
            "source": f"weeks/{src_name}",
            "weeks": [week],
        }
    )

LABS = [
    ("W01_preassessment.md", "W01 Pre-Assessment", [1]),
    ("W01_multimeter_scavenger.md", "W01 Multimeter Scavenger", [1]),
    ("W01_loto_competency.md", "W01 LOTO Competency", [1]),
    ("W02_battery_diagnostic_log.md", "W02 Battery Diagnostic Log", [2]),
    ("W03_charger_troubleshoot.md", "W03 Charger Troubleshooting", [3]),
    ("W03_lithium_comparison.md", "W03 Lithium Comparison", [3]),
    ("W04_motor_inspection_report.md", "W04 Motor Inspection Report", [4]),
    ("W05_fault_code_throttle_solenoid.md", "W05 Fault Code / Throttle / Solenoid", [5]),
    ("W06_harness_fault_isolation.md", "W06 Harness Fault Isolation", [6]),
    ("W07_seven_step_checklist.md", "W07 Seven-Step Checklist", [7, 10]),
    ("W07_diagnostic_report.md", "W07 Diagnostic Report", [7, 10]),
    ("W08_mechanical_inspection.md", "W08 Mechanical Inspection", [8]),
    ("W09_gas_diagnostic_checklist.md", "W09 Gas Diagnostic Checklist", [9]),
    ("W10_pm_plan_worksheet.md", "W10 PM Plan Worksheet", [10]),
]
for fname, title, weeks in LABS:
    CATALOG.append(
        {
            "id": fname.replace(".md", "").lower().replace("_", "-"),
            "title": title,
            "category": "labs",
            "source": f"labs/{fname}",
            "weeks": weeks,
        }
    )

HANDOUTS = [
    ("wiring_symbol_glossary.md", "Wiring Symbol Glossary", [1, 6]),
    ("ohm_law_quick_reference.md", "Ohm’s Law Quick Reference", [1]),
    ("safety_shop_poster.md", "Safety Shop Poster", [1]),
    ("common_fault_flowcharts.md", "Common Fault Flowcharts", [7]),
    ("curtis_fault_codes_reference.md", "Curtis Fault Codes Reference", [5]),
    ("pm_checklists.md", "PM Checklists", [10]),
    ("recommended_tool_list.md", "Recommended Tool List", [1]),
    ("resources_further_learning.md", "Resources & Further Learning", [10]),
    ("diagram_placeholder_catalog.md", "Diagram Placeholder Catalog", []),
]
for fname, title, weeks in HANDOUTS:
    CATALOG.append(
        {
            "id": fname.replace(".md", "").replace("_", "-"),
            "title": title,
            "category": "handouts",
            "source": f"handouts/{fname}",
            "weeks": weeks,
        }
    )

FINALS = [
    ("practical_skills_rubric.md", "Final Practical Skills Rubric", [10]),
    ("written_final_exam.md", "Written Final Exam (50 Q)", [10]),
    ("written_final_exam_answer_key.md", "Written Final Exam Answer Key (Instructor)", [10]),
    ("certificate_template.md", "Certificate Template", [10]),
    ("cohort_grade_tracker.md", "Cohort Grade Tracker", [10]),
]
for fname, title, weeks in FINALS:
    CATALOG.append(
        {
            "id": fname.replace(".md", "").replace("_", "-"),
            "title": title,
            "category": "final_assessment",
            "source": f"final_assessment/{fname}",
            "weeks": weeks,
        }
    )


def md_to_html(text: str, title: str) -> str:
    body = markdown.markdown(
        text,
        extensions=["tables", "fenced_code", "sane_lists", "toc"],
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>{title}</title>
  <style>{CSS}</style>
</head>
<body>
  <p class="meta">Neighborhood Golf Carts · Confidential Training Material · Generated {datetime.now(tz=timezone.utc).strftime("%Y-%m-%d")}</p>
  {body}
</body>
</html>
"""


def build_pdf(entry: dict) -> dict:
    src = TRAINING / entry["source"]
    if not src.exists():
        raise FileNotFoundError(src)
    pdf_name = f"{entry['id']}.pdf"
    out = PDF_DIR / pdf_name
    text = src.read_text(encoding="utf-8")
    # Strip existing PDF download callouts to avoid nesting in regenerated PDFs
    text = re.sub(
        r"\n## PDF downloads \(central library\).*?(?=\n## |\n# |\Z)",
        "\n",
        text,
        flags=re.S,
    )
    html = md_to_html(text, entry["title"])
    HTML(string=html, base_url=str(src.parent)).write_pdf(out)
    data = out.read_bytes()
    return {
        **entry,
        "file": pdf_name,
        "path": f"docs/training/pdfs/{pdf_name}",
        "href": f"pdfs/{pdf_name}",
        "bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest()[:16],
    }


def write_manifest(items: list[dict]) -> None:
    payload = {
        "generated_at": datetime.now(tz=timezone.utc).isoformat(),
        "hub": HUB_REL,
        "count": len(items),
        "items": [
            {
                "id": i["id"],
                "title": i["title"],
                "category": i["category"],
                "file": i["file"],
                "href": i["href"],
                "path": i["path"],
                "weeks": i["weeks"],
                "bytes": i["bytes"],
                "sha256": i["sha256"],
            }
            for i in items
        ],
    }
    (PDF_DIR / "manifest.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


WEEK_FILE = {
    1: "week_01_safety_tools_electrical.md",
    2: "week_02_lead_acid_batteries.md",
    3: "week_03_chargers_lithium.md",
    4: "week_04_electric_motors.md",
    5: "week_05_controllers_throttle_solenoids.md",
    6: "week_06_wiring_diagrams.md",
    7: "week_07_diagnostic_methodology.md",
    8: "week_08_mechanical_systems.md",
    9: "week_09_gas_powered_carts.md",
    10: "week_10_pm_certification.md",
}


def pdf_section_for_week(week: int, items: list[dict]) -> str:
    related = [i for i in items if week in i.get("weeks", [])]
    # Always include this week's curriculum PDF first
    week_pdf = next((i for i in related if i["category"] == "weeks"), None)
    lines = [
        "## PDF downloads (central library)",
        "",
        f"Printable PDFs live in the **[central downloads library](../../downloads.html#week-{week})** "
        f"(Command Center → Technician Training → PDF Downloads).",
        "",
        "| Document | Download |",
        "|---|---|",
    ]
    if week_pdf:
        lines.append(
            f"| {week_pdf['title']} (this week) | "
            f"[PDF](../../pdfs/{week_pdf['file']}) · [Library](../../downloads.html#{week_pdf['id']}) |"
        )
    for item in related:
        if week_pdf and item["id"] == week_pdf["id"]:
            continue
        lines.append(
            f"| {item['title']} | [PDF](../../pdfs/{item['file']}) · [Library](../../downloads.html#{item['id']}) |"
        )
    lines.append("")
    lines.append(f"Full catalog: [training/downloads.html](../../downloads.html)")
    lines.append("")
    lines.append("")
    return "\n".join(lines)


def inject_week_links(items: list[dict]) -> None:
    for week, fname in WEEK_FILE.items():
        path = TRAINING / "weeks" / fname
        text = path.read_text(encoding="utf-8")
        section = pdf_section_for_week(week, items)
        # Remove prior injected block if present
        text = re.sub(
            r"\n## PDF downloads \(central library\).*?(?=\n## Instructor Preparation|\n## Week |\n# Session |\Z)",
            "\n",
            text,
            flags=re.S,
        )
        # Insert after the opening metadata block (first ---)
        if "\n---\n" in text:
            head, rest = text.split("\n---\n", 1)
            text = head + "\n---\n\n" + section + rest.lstrip("\n")
        else:
            text = section + "\n" + text
        path.write_text(text, encoding="utf-8")


def inject_readme_link() -> None:
    readme = TRAINING / "README.md"
    text = readme.read_text(encoding="utf-8")
    block = (
        "### PDF downloads\n\n"
        "- **Central library (all PDFs):** [`../downloads.html`](../downloads.html) "
        "on GitHub Pages — https://ngc4160.github.io/NGC-Brain/command-center/training/downloads.html\n"
        "- Files also live in-repo at `docs/training/pdfs/`\n"
        "- Regenerate with: `python3 scripts/build_training_pdfs.py`\n"
    )
    text = re.sub(r"\n### PDF downloads\n.*?(?=\n### |\n## |\Z)", "\n", text, flags=re.S)
    if "### GitHub Pages" in text:
        text = text.replace("### GitHub Pages", block + "\n### GitHub Pages")
    else:
        text += "\n" + block
    readme.write_text(text, encoding="utf-8")


def main() -> None:
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    # Clear old pdfs except keep directory
    for old in PDF_DIR.glob("*.pdf"):
        old.unlink()

    built: list[dict] = []
    for entry in CATALOG:
        info = build_pdf(entry)
        built.append(info)
        print(f"PDF {info['file']} ({info['bytes']} bytes)")

    write_manifest(built)
    inject_week_links(built)
    inject_readme_link()
    print(f"Wrote {len(built)} PDFs + manifest → {PDF_DIR}")


if __name__ == "__main__":
    main()
