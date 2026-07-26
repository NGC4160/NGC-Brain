#!/usr/bin/env python3
"""Generate NGC Golf Cart Technician Hands-On Shop Evaluation Scorecard PDF."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
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

OUT = Path(__file__).resolve().parent / "NGC_Technician_Hands_On_Eval_Scorecard.pdf"

NGC_BLUE = colors.HexColor("#1a4d7a")
NGC_BLUE_LIGHT = colors.HexColor("#2d6ba3")
NGC_GREEN = colors.HexColor("#6faa2d")
BORDER = colors.HexColor("#c5d4e3")
MUTED = colors.HexColor("#555555")
LIGHT_BG = colors.HexColor("#f4f7fb")
GATE_BG = colors.HexColor("#fff6e8")
PASS_BG = colors.HexColor("#eef7e4")
WRITE_BG = colors.HexColor("#eef6fc")


def styles():
    base = getSampleStyleSheet()
    return {
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
            fontSize=8.5,
            leading=11.5,
        ),
    }


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


def score_row(criterion, weight, guide_3, notes_hint="", gate=False):
    s = styles()
    circles = "  1   ○     2   ○     3   ○     4   ○"
    left = [
        Paragraph(f"<b>{criterion}</b>  <font color='#555555'>({weight})</font>", s["score_label"]),
        Paragraph(f"“3” looks like: {guide_3}", s["small"]),
    ]
    if notes_hint:
        left.append(Paragraph(notes_hint, s["prompt"]))
    data = [[left, Paragraph(f"<b>Score</b><br/>{circles}", s["body"])]]
    t = Table(data, colWidths=[5.35 * inch, 1.9 * inch])
    bg = GATE_BG if gate else LIGHT_BG
    box = colors.HexColor("#8a5a00") if gate else BORDER
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), bg),
                ("BOX", (0, 0), (-1, -1), 0.75 if gate else 0.5, box),
                ("BACKGROUND", (1, 0), (1, 0), colors.white),
                ("BOX", (1, 0), (1, 0), 0.75, NGC_BLUE_LIGHT),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
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
            ]
        )
    )
    return t


def build():
    s = styles()
    content_width = 7.25 * inch
    story = []

    header = Table(
        [
            [
                Paragraph("NEIGHBORHOOD GOLF CARTS", s["title"]),
                Paragraph("<b>SHOP EVAL</b><br/>Hands-on hire test", s["sub"]),
            ],
            [
                Paragraph(
                    "Golf Cart Technician — Hands-On Evaluation Scorecard",
                    ParagraphStyle(
                        "h2",
                        parent=s["body"],
                        fontName="Helvetica-Bold",
                        fontSize=11,
                        textColor=NGC_BLUE,
                    ),
                ),
                Paragraph("3–4 hours · Ryan", s["sub"]),
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
            "Next step after a phone-screen <b>ADVANCE</b>. Same idea as the phone call — "
            "can they learn the job safely? — but they show you with tools. "
            "<b>Golf cart experience is a plus, not required.</b> "
            "Pairs with the written / hands-on / diagnostics hiring quiz (120 + 120 + 60).",
            s["body"],
        )
    )
    story.append(Spacer(1, 6))

    info = Table(
        [
            [
                Paragraph("Candidate: _______________________________", s["body"]),
                Paragraph("Date: ______________", s["body"]),
                Paragraph("Evaluator: ______________", s["body"]),
            ],
            [
                Paragraph("Phone screen date: ____________________", s["body"]),
                Paragraph("Phone avg (A–G): ______", s["body"]),
                Paragraph("Phone Safety (E): ______", s["body"]),
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
    story.append(Spacer(1, 5))
    story.append(
        Paragraph(
            "<b>Scoring:</b> 1 = Unsatisfactory · 2 = Developing · 3 = Solid / hireable with training · 4 = Strong &nbsp;|&nbsp; "
            "<b>Hire if:</b> Safety ≥ 3, no critical unsafe stop, and overall average ≥ 3.",
            s["small"],
        )
    )
    story.append(Spacer(1, 6))

    # --- 1 Setup ---
    story.append(section_header("1. SETUP  ·  10 min  ·  no score", content_width))
    story.append(Spacer(1, 3))
    story.append(
        Paragraph(
            "<b>Say:</b> “Today is a hands-on tryout — not a trick test. We’ll do a short written part, "
            "then tool work, then a real troubleshooting problem. You don’t need golf cart experience. "
            "If you’re unsure, say so — guessing with power on is worse than asking. Safety first; "
            "I will stop the eval if something is unsafe.”",
            s["body"],
        )
    )
    story.append(Spacer(1, 2))
    story.append(
        Paragraph(
            "☐ Safety glasses / closed shoes &nbsp;&nbsp; "
            "☐ Bay assigned · cart ready &nbsp;&nbsp; "
            "☐ Meter, hand tools, quiz ready &nbsp;&nbsp; "
            "☐ Planted fault set (if using) &nbsp;&nbsp; "
            "☐ Phone scorecard on hand",
            s["small"],
        )
    )
    story.append(Spacer(1, 7))

    # --- 2 Safety gate ---
    story.append(
        section_header(
            "2. LIVE SAFETY GATE  ·  15 min  ·  Score S  ·  must be ≥ 3 before continuing",
            content_width,
            bg=colors.HexColor("#8a5a00"),
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        Paragraph(
            "<b>Why (you):</b> Phone asked if they’re careful. Now watch them. "
            "Same bar as phone Safety — batteries can spark and burn.",
            s["small"],
        )
    )
    story.append(Spacer(1, 2))
    story.append(
        Paragraph(
            "<b>Do / Ask:</b><br/>"
            "1. Point at a cart with batteries. “Show me how you get ready to work around these batteries.” "
            "(Watch — don’t coach unless unsafe.)<br/>"
            "2. “Check the pack voltage with this meter and tell me what you see.”<br/>"
            "3. If they reach for metal jewelry still on: stop and note it.",
            s["body"],
        )
    )
    story.append(Spacer(1, 2))
    story.append(
        Paragraph(
            "<b>Pass looks like:</b> key/power off mindset · jewelry off · meter leads used carefully · "
            "doesn’t lay tools across battery posts · asks before guessing.<br/>"
            "<b>Fail / stop eval:</b> careless around posts · won’t remove rings · bypasses a safety switch · "
            "ignores a direct safety stop.",
            s["small"],
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        score_row(
            "S. Live safety around batteries",
            "GATE",
            "Careful, jewelry off, meter used safely, thinks before touching.",
            "☐ UNSAFE STOP — end eval, do not continue to tools",
            gate=True,
        )
    )
    story.append(Spacer(1, 7))

    # --- 3 Written ---
    story.append(
        section_header(
            "3. WRITTEN KNOWLEDGE  ·  ~45–60 min  ·  120 pts in hiring quiz  ·  Score W",
            content_width,
            bg=NGC_BLUE_LIGHT,
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        Paragraph(
            "<b>Do:</b> Give <i>NGC Technician Hiring Quiz</i> (40 questions / 120 pts). "
            "They work alone. You may clarify a confusing wording — don’t give answers. "
            "Use the Answer Key (evaluator only) to score.",
            s["body"],
        )
    )
    story.append(Spacer(1, 3))
    write_box = Table(
        [
            [
                Paragraph("<b>Quiz points</b><br/>_______ / 120", s["body"]),
                Paragraph("<b>~Percent</b><br/>_______%", s["body"]),
                Paragraph(
                    "<b>1–4 convert:</b> 90%+=4 · 75–89%=3 · 60–74%=2 · under 60%=1",
                    s["small"],
                ),
            ]
        ],
        colWidths=[1.6 * inch, 1.4 * inch, 4.25 * inch],
    )
    write_box.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), WRITE_BG),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(write_box)
    story.append(Spacer(1, 3))
    story.append(
        score_row(
            "W. Written knowledge",
            "High · maps to 120 pts",
            "About 75%+ on quiz, or clear basics even if cart brands are new.",
            "Weak areas: _______________________________________________",
        )
    )
    story.append(Spacer(1, 7))

    # --- 4 Hands-on ---
    story.append(
        section_header(
            "4. HANDS-ON SKILLS  ·  ~90–120 min  ·  120 pts in hiring quiz  ·  Scores H1–H4",
            content_width,
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        Paragraph(
            "Run four short stations. Coach only for safety. Golf-cart brand knowledge is a bonus — "
            "score how they use tools and follow steps.",
            s["small"],
        )
    )
    story.append(Spacer(1, 3))

    stations = [
        (
            "H1. Multimeter basics",
            "“Using this meter, show me battery pack voltage, then check if this wire/path has continuity "
            "(beep / path is good).”",
            "Picks right setting, probes safely, reads a number that makes sense, doesn’t short posts.",
        ),
        (
            "H2. Battery & connections check",
            "“Look over this battery setup. Tell me what looks good, what looks wrong, and what you’d tighten or clean.”",
            "Finds loose/dirty/corroded connections; notices obvious damage; explains in plain words.",
        ),
        (
            "H3. Simple remove / reinstall",
            "“Take this part off and put it back the way you found it.” "
            "(Seat, panel, wheel, solenoid cover, or similar — pick one ready bay task.)",
            "Organized, hardware tracked, cart left as found, no stripped fasteners, asks if stuck.",
        ),
        (
            "H4. Mechanical look-over",
            "“Do a quick safety look: tires, brakes/pedal feel, steering play, anything that looks unsafe to drive.”",
            "Checks the obvious items; flags anything scary; doesn’t skip the walk-around.",
        ),
    ]
    for title, ask, guide in stations:
        story.append(KeepTogether([Paragraph(f"<b>{title}</b>", s["body"]), Paragraph(f"<b>Ask / Do:</b> {ask}", s["prompt"])]))
        story.append(Spacer(1, 2))
        story.append(score_row(title, "Hands-on", guide))
        story.append(Spacer(1, 3))

    hands_pts = Table(
        [
            [
                Paragraph(
                    "<b>Optional quiz points (hands-on section):</b> _______ / 120 &nbsp;&nbsp; "
                    "H1–H4 average: _______",
                    s["body"],
                )
            ]
        ],
        colWidths=[7.25 * inch],
    )
    hands_pts.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), WRITE_BG),
                ("BOX", (0, 0), (-1, -1), 0.4, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(hands_pts)
    story.append(Spacer(1, 3))
    story.append(notes_box("Hands-on notes", 2))
    story.append(Spacer(1, 7))

    # --- 5 Diagnostics ---
    story.append(
        section_header(
            "5. TROUBLESHOOTING  ·  ~45–60 min  ·  60 pts in hiring quiz  ·  Scores D1–D3",
            content_width,
            bg=colors.HexColor("#5b21b6"),
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        Paragraph(
            "<b>Setup (you):</b> Use a real complaint or a planted simple fault "
            "(loose battery cable, open fuse, key/run switch, etc.). "
            "Tell them the customer’s words only — not the answer.",
            s["small"],
        )
    )
    story.append(Spacer(1, 2))
    story.append(
        Paragraph(
            "<b>Say:</b> “Customer says: _______________________________ "
            "Find the problem. Talk out loud about what you’re checking and why. "
            "Write down what you measured.”",
            s["body"],
        )
    )
    story.append(Spacer(1, 3))

    diag = [
        (
            "D1. How they start",
            "Watch first 5–10 minutes.",
            "Confirms the complaint, looks/safes the cart, checks power before swapping parts.",
        ),
        (
            "D2. Testing path",
            "Do they measure, or guess?",
            "Uses meter/tests in a sensible order; narrows the problem; doesn’t shotgun parts.",
        ),
        (
            "D3. Explain & write up",
            "“Tell me what you found and what you’d tell the office to quote.”",
            "Plain-language root cause + next step; notes a customer could understand.",
        ),
    ]
    for title, ask, guide in diag:
        story.append(KeepTogether([Paragraph(f"<b>{title}</b> — <i>{ask}</i>", s["body"])]))
        story.append(Spacer(1, 2))
        story.append(score_row(title, "Diagnostics", guide))
        story.append(Spacer(1, 3))

    diag_pts = Table(
        [
            [
                Paragraph(
                    "<b>Optional quiz points (diagnostics section):</b> _______ / 60 &nbsp;&nbsp; "
                    "Found the fault? ☐ Yes &nbsp; ☐ Partial &nbsp; ☐ No &nbsp;&nbsp; "
                    "Cues given: ______",
                    s["body"],
                )
            ]
        ],
        colWidths=[7.25 * inch],
    )
    diag_pts.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), WRITE_BG),
                ("BOX", (0, 0), (-1, -1), 0.4, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(diag_pts)
    story.append(Spacer(1, 3))
    story.append(notes_box("Troubleshooting notes", 2))
    story.append(Spacer(1, 7))

    # --- 6 Shop fit ---
    story.append(
        section_header(
            "6. SHOP FIT (all day)  ·  Scores F1–F2",
            content_width,
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        Paragraph(
            "Score from how they acted the whole visit — not a separate interview.",
            s["small"],
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        score_row(
            "F1. Pace & cleanliness",
            "Medium",
            "Steady work, cleans as they go, puts tools back, doesn’t freeze or rush unsafely.",
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        score_row(
            "F2. Coachability",
            "High",
            "Takes feedback without getting defensive; asks good questions; improves after one cue.",
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        Paragraph(
            "<b>Optional ask at end:</b> “Any questions about the job, the shop, or working with our team?”",
            s["body"],
        )
    )
    story.append(Spacer(1, 7))

    # --- 7 Totals ---
    story.append(section_header("7. TOTALS & HIRE DECISION", content_width, bg=colors.HexColor("#3d6b12")))
    story.append(Spacer(1, 4))

    score_table = Table(
        [
            [
                Paragraph("<b>S</b> Safety", s["small"]),
                Paragraph("<b>W</b> Written", s["small"]),
                Paragraph("<b>H1</b> Meter", s["small"]),
                Paragraph("<b>H2</b> Batt", s["small"]),
                Paragraph("<b>H3</b> R&amp;R", s["small"]),
                Paragraph("<b>H4</b> Mech", s["small"]),
                Paragraph("<b>D1</b> Start", s["small"]),
                Paragraph("<b>D2</b> Path", s["small"]),
                Paragraph("<b>D3</b> Write", s["small"]),
                Paragraph("<b>F1</b> Pace", s["small"]),
                Paragraph("<b>F2</b> Coach", s["small"]),
            ],
            ["___"] * 11,
        ],
        colWidths=[0.66 * inch] * 11,
    )
    score_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("BACKGROUND", (0, 0), (-1, 0), PASS_BG),
                ("BOX", (0, 0), (-1, -1), 0.6, NGC_GREEN),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("BACKGROUND", (0, 1), (0, 1), GATE_BG),
            ]
        )
    )
    story.append(score_table)
    story.append(Spacer(1, 5))
    story.append(
        Paragraph(
            "<b>Overall average</b> (all scored items): _______ / 4 &nbsp;&nbsp; "
            "<b>Hands-on avg</b> (H1–H4): _______ &nbsp;&nbsp; "
            "<b>Diagnostics avg</b> (D1–D3): _______ &nbsp;&nbsp; "
            "Safety ≥ 3? ☐ Yes ☐ No",
            s["body"],
        )
    )
    story.append(Spacer(1, 3))
    story.append(
        Paragraph(
            "<b>Quiz point total (optional):</b> Written ___/120 + Hands-on ___/120 + Diagnostics ___/60 = "
            "<b>_______ / 300</b>",
            s["body"],
        )
    )
    story.append(Spacer(1, 6))

    decision = Table(
        [
            [
                Paragraph(
                    "<b>☐ HIRE / OFFER</b><br/>"
                    "Safety ≥ 3, overall ≥ 3, trainable. "
                    "Schedule start + onboarding with Taylor/Marlon.",
                    s["rec"],
                ),
                Paragraph(
                    "<b>☐ SECOND LOOK</b><br/>"
                    "Mixed scores; strong in one area, weak in another. "
                    "Optional short paid trial day before offer.",
                    s["rec"],
                ),
                Paragraph(
                    "<b>☐ PASS</b><br/>"
                    "Unsafe, overall under 3, or can’t follow a basic test path. "
                    "Thank them; keep phone notes on file.",
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
    story.append(notes_box("Final notes / offer terms to discuss with Christine", 2))
    story.append(Spacer(1, 6))
    story.append(
        Paragraph(
            "Compare to phone screen: Did Safety, problem-solving, and coachability hold up in person? "
            "If phone was strong and shop is weak (or the reverse), trust what you saw with tools.",
            s["small"],
        )
    )
    story.append(Spacer(1, 6))
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
        topMargin=0.4 * inch,
        bottomMargin=0.35 * inch,
        title="NGC Technician Hands-On Evaluation Scorecard",
        author="Neighborhood Golf Carts",
    )
    doc.build(story)
    print(f"Wrote {OUT}")
    return OUT


if __name__ == "__main__":
    build()
