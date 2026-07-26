#!/usr/bin/env python3
"""Generate printable PDFs for the NGC technician hiring quiz + answer key."""

from __future__ import annotations

import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

DIR = Path(__file__).resolve().parent
QUIZ_MD = DIR / "NGC_Technician_Hiring_Quiz.md"
KEY_MD = DIR / "NGC_Technician_Hiring_Quiz_Answer_Key.md"
QUIZ_PDF = DIR / "NGC_Technician_Hiring_Quiz.pdf"
KEY_PDF = DIR / "NGC_Technician_Hiring_Quiz_Answer_Key.pdf"

NGC_BLUE = colors.HexColor("#1a4d7a")
BORDER = colors.HexColor("#c5d4e3")
MUTED = colors.HexColor("#555555")
LIGHT = colors.HexColor("#f4f7fb")
GATE = colors.HexColor("#fff6e8")


def styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "title", parent=base["Heading1"], fontName="Helvetica-Bold",
            fontSize=13, textColor=NGC_BLUE, leading=16, spaceAfter=2,
        ),
        "sub": ParagraphStyle(
            "sub", parent=base["Normal"], fontName="Helvetica",
            fontSize=8, textColor=MUTED, leading=10, spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body", parent=base["Normal"], fontName="Helvetica",
            fontSize=9, textColor=colors.HexColor("#1a1a1a"), leading=12, spaceAfter=2,
        ),
        "q": ParagraphStyle(
            "q", parent=base["Normal"], fontName="Helvetica-Bold",
            fontSize=9, textColor=colors.HexColor("#1a1a1a"), leading=11.5, spaceBefore=6, spaceAfter=2,
        ),
        "opt": ParagraphStyle(
            "opt", parent=base["Normal"], fontName="Helvetica",
            fontSize=8.5, textColor=colors.HexColor("#1a1a1a"), leading=11, leftIndent=12,
        ),
        "h2": ParagraphStyle(
            "h2", parent=base["Heading2"], fontName="Helvetica-Bold",
            fontSize=10, textColor=NGC_BLUE, spaceBefore=8, spaceAfter=4, leading=12,
        ),
        "small": ParagraphStyle(
            "small", parent=base["Normal"], fontName="Helvetica",
            fontSize=7.5, textColor=MUTED, leading=9.5,
        ),
        "footer": ParagraphStyle(
            "footer", parent=base["Normal"], fontName="Helvetica",
            fontSize=7.5, textColor=MUTED, alignment=TA_CENTER,
        ),
    }


def parse_quiz(md: str) -> list[dict]:
    chunks = re.split(r"\n(?=\*\*\d+\.)", md)
    questions = []
    for chunk in chunks:
        m = re.match(r"\*\*(\d+)\.(?: ★)?\*\*\s*(.*)", chunk, re.S)
        if not m:
            continue
        num = int(m.group(1))
        rest = m.group(2).strip()
        critical = "★" in chunk.split("\n", 1)[0] or bool(re.match(r"\*\*\d+\. ★\*\*", chunk))
        # stem until first option
        opt_split = re.split(r"\n(?=[A-D]\))", rest, maxsplit=1)
        stem = opt_split[0].strip().replace("\n", " ")
        options = []
        if len(opt_split) > 1:
            for om in re.finditer(r"^([A-D])\)\s*(.+?)(?=\n[A-D]\)|\Z)", opt_split[1], re.M | re.S):
                options.append((om.group(1), re.sub(r"\s+", " ", om.group(2).strip())))
        questions.append({"num": num, "critical": critical, "stem": stem, "options": options})
    return questions


def build_quiz_pdf():
    s = styles()
    md = QUIZ_MD.read_text(encoding="utf-8")
    questions = parse_quiz(md)
    if len(questions) != 40:
        raise SystemExit(f"Expected 40 questions, parsed {len(questions)}")

    story = []
    story.append(Paragraph("NEIGHBORHOOD GOLF CARTS", s["title"]))
    story.append(Paragraph("Technician Hiring Quiz (Written) · Version 1.0", s["sub"]))
    story.append(HRFlowable(width="100%", thickness=2, color=NGC_BLUE, spaceAfter=6))
    story.append(
        Paragraph(
            "40 questions · 120 points (3 each) · 45–60 minutes · Pass <b>90/120 (75%)</b> · "
            "Miss <b>2+</b> critical ★ safety questions = automatic fail. "
            "Golf cart brand experience not required. Circle one best answer.",
            s["body"],
        )
    )
    story.append(Spacer(1, 4))
    info = Table(
        [[Paragraph(
            "Candidate: ________________________  Date: __________  Evaluator: ________________  "
            "Score: ____ / 120   ★ missed: ____ / 6   ☐ Pass  ☐ Fail",
            s["body"],
        )]],
        colWidths=[7.25 * inch],
    )
    info.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(info)
    story.append(Spacer(1, 4))

    part = None
    part_map = {
        range(1, 9): "Part A — Safety",
        range(9, 17): "Part B — Meter & basic electrical",
        range(17, 25): "Part C — Batteries & charging",
        range(25, 33): "Part D — Figuring out problems",
        range(33, 38): "Part E — Mechanical & shop sense",
        range(38, 41): "Part F — Light lithium & shop reality",
    }

    for q in questions:
        for r, title in part_map.items():
            if q["num"] in r and part != title:
                part = title
                story.append(Paragraph(title, s["h2"]))
                break
        star = " ★" if q["critical"] else ""
        stem = q["stem"].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        story.append(Paragraph(f"{q['num']}.{star} {stem}", s["q"]))
        for opt_letter, text in q["options"]:
            safe = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            story.append(Paragraph(f"{opt_letter}) {safe}", s["opt"]))

    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "Neighborhood Golf Carts · Covington, LA · Confidential hiring material",
        s["footer"],
    ))

    doc = SimpleDocTemplate(
        str(QUIZ_PDF), pagesize=letter,
        leftMargin=0.6 * inch, rightMargin=0.6 * inch,
        topMargin=0.45 * inch, bottomMargin=0.4 * inch,
        title="NGC Technician Hiring Quiz",
        author="Neighborhood Golf Carts",
    )
    doc.build(story)
    print(f"Wrote {QUIZ_PDF} ({len(questions)} questions)")


def build_key_pdf():
    s = styles()
    key_md = KEY_MD.read_text(encoding="utf-8")
    rows = re.findall(
        r"^\|\s*(\d+)\s*\|\s*([A-D])\s*\|\s*(★)?\s*\|\s*(.*?)\s*\|$",
        key_md,
        re.M,
    )
    story = []
    story.append(Paragraph("NEIGHBORHOOD GOLF CARTS", s["title"]))
    story.append(Paragraph("Hiring Quiz Answer Key · EVALUATOR ONLY · Version 1.0", s["sub"]))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#8a5a00"), spaceAfter=6))
    story.append(Paragraph(
        "<b>Do not give to candidates.</b> Pass = 90/120 (75%). "
        "Critical ★ = Q1–Q6; miss 2+ ★ = automatic fail.",
        s["body"],
    ))
    story.append(Spacer(1, 6))

    data = [[
        Paragraph("<b>Q</b>", s["small"]),
        Paragraph("<b>Ans</b>", s["small"]),
        Paragraph("<b>★</b>", s["small"]),
        Paragraph("<b>Rationale</b>", s["small"]),
    ]]
    for num, ans, star, why in rows:
        data.append([
            Paragraph(num, s["small"]),
            Paragraph(f"<b>{ans}</b>", s["small"]),
            Paragraph(star or "", s["small"]),
            Paragraph(why, s["small"]),
        ])

    t = Table(data, colWidths=[0.4 * inch, 0.45 * inch, 0.35 * inch, 6.05 * inch])
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), GATE),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]
    for i, (num, ans, star, why) in enumerate(rows, start=1):
        if star:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), GATE))
    t.setStyle(TableStyle(style_cmds))
    story.append(t)
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Convert to scorecard W: 90%+=4 · 75–89%=3 · 60–74%=2 · under 60%=1. "
        "Transfer to Hands-On Evaluation Scorecard.",
        s["small"],
    ))
    story.append(Spacer(1, 6))
    story.append(Paragraph("EVALUATOR ONLY — do not photocopy for candidates", s["footer"]))

    doc = SimpleDocTemplate(
        str(KEY_PDF), pagesize=letter,
        leftMargin=0.55 * inch, rightMargin=0.55 * inch,
        topMargin=0.45 * inch, bottomMargin=0.4 * inch,
        title="NGC Hiring Quiz Answer Key",
        author="Neighborhood Golf Carts",
    )
    doc.build(story)
    print(f"Wrote {KEY_PDF} ({len(rows)} answers)")


if __name__ == "__main__":
    build_quiz_pdf()
    build_key_pdf()
