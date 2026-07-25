#!/usr/bin/env python3
"""Generate NGC Golf Cart Technician Phone Interview Scorecard PDF."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT = Path(__file__).resolve().parent / "NGC_Technician_Phone_Interview_Scorecard.pdf"

NGC_BLUE = colors.HexColor("#1a4d7a")
NGC_BLUE_LIGHT = colors.HexColor("#2d6ba3")
NGC_GREEN = colors.HexColor("#6faa2d")
BORDER = colors.HexColor("#c5d4e3")
MUTED = colors.HexColor("#555555")
LIGHT_BG = colors.HexColor("#f4f7fb")
GATE_BG = colors.HexColor("#fff6e8")
PASS_BG = colors.HexColor("#eef7e4")


def styles():
    base = getSampleStyleSheet()
    s = {
        "title": ParagraphStyle(
            "title",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=14,
            textColor=NGC_BLUE,
            spaceAfter=2,
            leading=17,
        ),
        "sub": ParagraphStyle(
            "sub",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            textColor=MUTED,
            leading=11,
            spaceAfter=6,
        ),
        "section": ParagraphStyle(
            "section",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=10,
            textColor=colors.white,
            leading=12,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            textColor=colors.HexColor("#1a1a1a"),
            leading=11,
        ),
        "prompt": ParagraphStyle(
            "prompt",
            parent=base["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=8,
            textColor=MUTED,
            leading=10.5,
            leftIndent=4,
        ),
        "small": ParagraphStyle(
            "small",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            textColor=MUTED,
            leading=9.5,
        ),
        "score_label": ParagraphStyle(
            "score_label",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            textColor=NGC_BLUE,
            leading=10,
        ),
        "footer": ParagraphStyle(
            "footer",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            textColor=MUTED,
            alignment=TA_CENTER,
        ),
        "rec": ParagraphStyle(
            "rec",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
        ),
    }
    return s


def section_header(text, width, bg=NGC_BLUE):
    data = [[Paragraph(text, styles()["section"])]]
    t = Table(data, colWidths=[width])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), bg),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return t


def fill_line(label, width_label, width_line):
    s = styles()
    data = [
        [
            Paragraph(label, s["body"]),
            Paragraph("_" * 48, s["body"]),
        ]
    ]
    t = Table(data, colWidths=[width_label, width_line])
    t.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    return t


def score_row(criterion, weight, guide_3, notes_hint=""):
    """One scored criterion: label, 1-4 circles, notes line."""
    s = styles()
    circles = "  1   ○     2   ○     3   ○     4   ○"
    left = [
        Paragraph(f"<b>{criterion}</b>  <font color='#555555'>({weight})</font>", s["score_label"]),
        Paragraph(f"“3” looks like: {guide_3}", s["small"]),
    ]
    if notes_hint:
        left.append(Paragraph(notes_hint, s["prompt"]))
    left_cell = left
    right = Paragraph(f"<b>Score</b><br/>{circles}", s["body"])
    data = [[left_cell, right]]
    t = Table(data, colWidths=[5.35 * inch, 1.9 * inch])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("BACKGROUND", (1, 0), (1, 0), colors.white),
                ("BOX", (1, 0), (1, 0), 0.75, NGC_BLUE_LIGHT),
                ("ALIGN", (1, 0), (1, 0), "CENTER"),
            ]
        )
    )
    return t


def notes_box(label, height_lines=2):
    s = styles()
    lines = "<br/>".join(["_" * 95] * height_lines)
    data = [[Paragraph(f"<b>{label}</b><br/>{lines}", s["body"])]]
    t = Table(data, colWidths=[7.25 * inch])
    t.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.4, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
            ]
        )
    )
    return t


def build():
    s = styles()
    content_width = 7.25 * inch
    story = []

    # Header
    header = Table(
        [
            [
                Paragraph("NEIGHBORHOOD GOLF CARTS", s["title"]),
                Paragraph("<b>PHONE SCREEN</b><br/>Technician hire", s["sub"]),
            ],
            [
                Paragraph(
                    "Golf Cart Technician — Phone Interview Scorecard",
                    ParagraphStyle(
                        "h2",
                        parent=s["body"],
                        fontName="Helvetica-Bold",
                        fontSize=11,
                        textColor=NGC_BLUE,
                    ),
                ),
                Paragraph("15–20 minutes · Ryan", s["sub"]),
            ],
        ],
        colWidths=[5.2 * inch, 2.05 * inch],
    )
    header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ]
        )
    )
    story.append(header)
    story.append(HRFlowable(width="100%", thickness=2.5, color=NGC_BLUE, spaceAfter=6))
    story.append(
        Paragraph(
            "Purpose: Screen for transferable electrical/mechanical skill, diagnostic thinking, "
            "safety, and coachability. <b>Golf cart experience is a bonus — not a hiring gate.</b> "
            "Logistics (hours, commute, availability) are cleared on Indeed — skip unless inconsistent.",
            s["body"],
        )
    )
    story.append(Spacer(1, 6))

    # Candidate block
    info = Table(
        [
            [
                Paragraph("Candidate: _______________________________", s["body"]),
                Paragraph("Date: ______________", s["body"]),
                Paragraph("Interviewer: ______________", s["body"]),
            ],
            [
                Paragraph("Indeed / source: _________________________", s["body"]),
                Paragraph("Phone: ________________", s["body"]),
                Paragraph("Call length: ______ min", s["body"]),
            ],
        ],
        colWidths=[3.1 * inch, 2.15 * inch, 2.0 * inch],
    )
    info.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(info)
    story.append(Spacer(1, 8))

    # Scale key
    story.append(
        Paragraph(
            "<b>Scoring scale:</b> &nbsp; 1 = Unsatisfactory &nbsp;·&nbsp; 2 = Developing &nbsp;·&nbsp; "
            "3 = Solid / trainable &nbsp;·&nbsp; 4 = Strong &nbsp;&nbsp;|&nbsp;&nbsp; "
            "<b>Advance if:</b> Safety ≥ 3, Diagnostic ≥ 3, and overall trainable.",
            s["small"],
        )
    )
    story.append(Spacer(1, 6))

    # --- Section 1: Role frame (no score) ---
    story.append(section_header("1. ROLE FRAME  ·  2 min  ·  no score — set expectations", content_width))
    story.append(Spacer(1, 3))
    story.append(
        Paragraph(
            "☐ Shop-only Covington repair + lithium conversions (no mobile) &nbsp;&nbsp; "
            "☐ Mon–Fri bay work under Ryan &nbsp;&nbsp; "
            "☐ Golf cart veterans not required — we train the product line &nbsp;&nbsp; "
            "☐ Strong fits get a 3–4 hr shop evaluation (written + hands-on + troubleshooting)",
            s["body"],
        )
    )
    story.append(Spacer(1, 7))

    # --- Section 2: Transferable background ---
    story.append(
        section_header(
            "2. TRANSFERABLE BACKGROUND  ·  4 min  ·  Score A",
            content_width,
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        Paragraph(
            "<i>Prompts:</i> Last 2–3 years of work? Auto / marine / RV / forklift / industrial / powersports / HVAC electrical? "
            "Any 12–48V+ DC or battery work? Multimeter use? Mechanical (brakes, bearings, steering)? Shop tickets vs field alone?",
            s["prompt"],
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        score_row(
            "A. Transferable electrical / mechanical experience",
            "High weight",
            "Real DC or shop electrical plus mechanical exposure; can name systems they’ve troubleshot.",
            "Notes: brands/systems _______________________________________________",
        )
    )
    story.append(Spacer(1, 3))
    story.append(notes_box("Background notes", 2))
    story.append(Spacer(1, 7))

    # --- Section 3: Diagnostic thinking ---
    story.append(
        section_header(
            "3. DIAGNOSTIC THINKING  ·  6 min  ·  Scores B–D  ·  highest weight",
            content_width,
        )
    )
    story.append(Spacer(1, 3))

    scenarios = [
        (
            "B. No-go / won’t move",
            "“A battery-powered vehicle won’t move. You don’t know the brand. Where do you start?”",
            "Verifies symptom → safety/visual → source voltage → path of power → what to measure next. Not “replace the controller.”",
        ),
        (
            "C. Weak / dies under load",
            "“It runs a little then dies on hills. What are you trying to prove or rule out?”",
            "Resting vs loaded voltage, connections, pack health — then downstream. Not parts-chasing.",
        ),
        (
            "D. Learning unknown systems",
            "“You’ve never seen this system. How do you learn it on day one without guessing?”",
            "Manuals/diagrams, ask lead tech, structured tests, document findings. Escalates instead of cowboying.",
        ),
    ]
    for title, prompt, guide in scenarios:
        block = [
            Paragraph(f"<b>{title}</b>", s["body"]),
            Paragraph(prompt, s["prompt"]),
        ]
        story.append(KeepTogether(block))
        story.append(Spacer(1, 2))
        story.append(score_row(title, "Highest", guide))
        story.append(Spacer(1, 3))

    story.append(notes_box("Diagnostic notes (listen for measure-before-replace)", 2))
    story.append(Spacer(1, 8))

    # --- Section 4: Safety (gate) ---
    story.append(
        section_header(
            "4. SAFETY & ELECTRICAL JUDGMENT  ·  3 min  ·  Score E  ·  GATE — must be ≥ 3",
            content_width,
            bg=colors.HexColor("#8a5a00"),
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        Paragraph(
            "<i>Prompts:</i> “You’re about to work on a high-current battery pack. What before tools go on?” "
            "Jewelry? Meter discipline? Short/arc risk? Bypass interlocks “just to test”? Any near-miss and what changed?",
            s["prompt"],
        )
    )
    story.append(Spacer(1, 3))
    gate = score_row(
        "E. Safety & high-current judgment",
        "GATE",
        "Explicit caution: PPE mindset, isolate energy, meter discipline, no interlock bypass, respects pack energy.",
        "☐ FAIL SAFETY → do not invite to shop eval",
    )
    # Re-style with warm background
    gate.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), GATE_BG),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#8a5a00")),
                ("BACKGROUND", (1, 0), (1, 0), colors.white),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(gate)
    story.append(Spacer(1, 3))
    story.append(notes_box("Safety notes", 1))
    story.append(Spacer(1, 7))

    # --- Section 5: Shop habits ---
    story.append(
        section_header(
            "5. SHOP HABITS & COACHABILITY  ·  3 min  ·  Scores F–G",
            content_width,
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        Paragraph(
            "<i>Prompts:</i> How do you write up findings so the office can quote? Time you were wrong — what did you do? "
            "Comfortable being new on a product line if the process is clear? Steady ticket closer vs only “interesting” jobs?",
            s["prompt"],
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        score_row(
            "F. Shop communication & documentation",
            "Medium",
            "Can explain findings simply; understands office needs estimate-ready notes.",
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        score_row(
            "G. Coachability & work style",
            "High",
            "Owns mistakes, asks for help, open to process; won’t guess past a stop-point.",
        )
    )
    story.append(Spacer(1, 3))
    story.append(notes_box("Fit notes", 1))
    story.append(Spacer(1, 7))

    # --- Section 6: Bonus ---
    story.append(
        section_header(
            "6. BONUS ONLY (optional)  ·  Score H  ·  does not gate the hire",
            content_width,
            bg=NGC_BLUE_LIGHT,
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        score_row(
            "H. Golf cart / lithium / BMS exposure",
            "Bonus",
            "Some cart, UTV, or lithium/BMS exposure. Absence is fine — leave blank or mark N/A.",
        )
    )
    story.append(Spacer(1, 8))

    # --- Totals ---
    story.append(section_header("7. TOTALS & DECISION", content_width, bg=colors.HexColor("#3d6b12")))
    story.append(Spacer(1, 4))

    score_table = Table(
        [
            [
                Paragraph("<b>A</b> Transferable", s["small"]),
                Paragraph("<b>B</b> No-go", s["small"]),
                Paragraph("<b>C</b> Load", s["small"]),
                Paragraph("<b>D</b> Learning", s["small"]),
                Paragraph("<b>E</b> Safety", s["small"]),
                Paragraph("<b>F</b> Docs", s["small"]),
                Paragraph("<b>G</b> Coach", s["small"]),
                Paragraph("<b>H</b> Bonus", s["small"]),
            ],
            ["_____", "_____", "_____", "_____", "_____", "_____", "_____", "_____ / N/A"],
        ],
        colWidths=[0.95 * inch] * 7 + [1.0 * inch],
    )
    score_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("BACKGROUND", (0, 0), (-1, 0), PASS_BG),
                ("BOX", (0, 0), (-1, -1), 0.6, NGC_GREEN),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("BACKGROUND", (4, 1), (4, 1), GATE_BG),
            ]
        )
    )
    story.append(score_table)
    story.append(Spacer(1, 5))

    story.append(
        Paragraph(
            "<b>Core average</b> (A–G, exclude H): _______ / 4 &nbsp;&nbsp;&nbsp; "
            "<b>Diagnostic average</b> (B–D): _______ / 4 &nbsp;&nbsp;&nbsp; "
            "Safety (E) ≥ 3?  ☐ Yes  ☐ No",
            s["body"],
        )
    )
    story.append(Spacer(1, 6))

    decision = Table(
        [
            [
                Paragraph(
                    "<b>☐ ADVANCE</b><br/>Safety ≥ 3, Diagnostic (B–D) avg ≥ 3, "
                    "looks trainable → schedule 3–4 hr shop eval",
                    s["rec"],
                ),
                Paragraph(
                    "<b>☐ MAYBE</b><br/>Strong wrench, developing electrical; "
                    "honest gaps → only if hungry; heavier hands-on day",
                    s["rec"],
                ),
                Paragraph(
                    "<b>☐ PASS</b><br/>Parts-swap habit, unsafe, "
                    "or cannot describe troubleshooting they’ve owned",
                    s["rec"],
                ),
            ]
        ],
        colWidths=[2.4 * inch, 2.4 * inch, 2.45 * inch],
    )
    decision.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER),
                ("BACKGROUND", (0, 0), (0, 0), PASS_BG),
                ("BACKGROUND", (1, 0), (1, 0), GATE_BG),
                ("BACKGROUND", (2, 0), (2, 0), colors.HexColor("#f8ecec")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(decision)
    story.append(Spacer(1, 6))
    story.append(
        Paragraph(
            "Next step if ADVANCE: shop evaluation — written knowledge (120), hands-on skills (120), "
            "troubleshooting & diagnostics (60). Ref: Hiring quiz evaluation – Technician.",
            s["small"],
        )
    )
    story.append(Spacer(1, 4))
    story.append(notes_box("Final recommendation / scheduling notes", 2))
    story.append(Spacer(1, 8))
    story.append(
        Paragraph(
            "Neighborhood Golf Carts · 71363 Thelma Ln Suite E, Covington LA 70433 · 985-402-1206 · "
            "Confidential hiring record — do not store customer PII on this form",
            s["footer"],
        )
    )

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        leftMargin=0.6 * inch,
        rightMargin=0.65 * inch,
        topMargin=0.45 * inch,
        bottomMargin=0.4 * inch,
        title="NGC Technician Phone Interview Scorecard",
        author="Neighborhood Golf Carts",
    )
    doc.build(story)
    print(f"Wrote {OUT}")
    return OUT


if __name__ == "__main__":
    build()
