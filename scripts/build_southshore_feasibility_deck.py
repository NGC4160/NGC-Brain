#!/usr/bin/env python3
"""Build Southshore second-location feasibility slide deck (PDF)."""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import Color, HexColor, white, black
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

OUT_DIR = Path("/workspace/knowledge/07_customers_marketing/decks")
ARTIFACT_DIR = Path("/opt/cursor/artifacts")
OUT_NAME = "NGC_Southshore_Second_Location_Feasibility_Deck.pdf"
LOGO = Path("/workspace/external_docs/templates/personnel_counseling/assets/ngc-logo.png")

PAGE = landscape(letter)  # 792 x 612
W, H = PAGE

# Brand-ish palette (shop / industrial — not purple/cream AI defaults)
NAVY = HexColor("#0B1F33")
STEEL = HexColor("#1E3A4C")
TEAL = HexColor("#0F766E")
TEAL_LT = HexColor("#14B8A6")
AMBER = HexColor("#D97706")
SLATE = HexColor("#334155")
MUTED = HexColor("#64748B")
LINE = HexColor("#CBD5E1")
BG = HexColor("#F8FAFC")
CARD = HexColor("#FFFFFF")
GO = HexColor("#059669")
WAIT = HexColor("#DC2626")
WARN = HexColor("#D97706")


def draw_bg(c: canvas.Canvas) -> None:
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    # Left accent bar
    c.setFillColor(NAVY)
    c.rect(0, 0, 0.18 * inch, H, fill=1, stroke=0)
    # Bottom strip
    c.setFillColor(STEEL)
    c.rect(0, 0, W, 0.28 * inch, fill=1, stroke=0)
    c.setFillColor(TEAL_LT)
    c.rect(0, 0.28 * inch, W, 0.045 * inch, fill=1, stroke=0)


def footer(c: canvas.Canvas, page: int, total: int, title: str = "Confidential — NGC Internal") -> None:
    c.setFillColor(white)
    c.setFont("Helvetica", 8)
    c.drawString(0.45 * inch, 0.09 * inch, title)
    c.drawRightString(W - 0.4 * inch, 0.09 * inch, f"{page} / {total}")


def header(c: canvas.Canvas, eyebrow: str, title: str, subtitle: str | None = None) -> float:
    """Draw slide header; return y below header."""
    y = H - 0.45 * inch
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(0.55 * inch, y, eyebrow.upper())
    y -= 0.32 * inch
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(0.55 * inch, y, title)
    y -= 0.12 * inch
    c.setStrokeColor(TEAL_LT)
    c.setLineWidth(2.5)
    c.line(0.55 * inch, y, 0.55 * inch + 1.6 * inch, y)
    y -= 0.28 * inch
    if subtitle:
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 11)
        for line in wrap(subtitle, 95):
            c.drawString(0.55 * inch, y, line)
            y -= 0.18 * inch
        y -= 0.06 * inch
    return y


def wrap(text: str, width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur: list[str] = []
    for w in words:
        trial = (" ".join(cur + [w]))
        if len(trial) <= width:
            cur.append(w)
        else:
            if cur:
                lines.append(" ".join(cur))
            cur = [w]
    if cur:
        lines.append(" ".join(cur))
    return lines or [""]


def card(c: canvas.Canvas, x: float, y: float, w: float, h: float, fill: Color = CARD) -> None:
    c.setFillColor(fill)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.8)
    c.roundRect(x, y, w, h, 8, fill=1, stroke=1)


def bullet_block(c: canvas.Canvas, x: float, y: float, items: list[str], max_width: int = 55, size: int = 10, gap: float = 0.22) -> float:
    c.setFont("Helvetica", size)
    for item in items:
        lines = wrap(item, max_width)
        c.setFillColor(TEAL)
        c.circle(x + 0.06 * inch, y + 0.04 * inch, 2.2, fill=1, stroke=0)
        c.setFillColor(SLATE)
        for i, line in enumerate(lines):
            c.drawString(x + 0.2 * inch, y, line)
            if i < len(lines) - 1:
                y -= gap * 0.85
        y -= gap
    return y


def table(
    c: canvas.Canvas,
    x: float,
    y: float,
    col_widths: list[float],
    rows: list[list[str]],
    header: bool = True,
    font_size: int = 9,
    row_h: float = 0.32 * inch,
) -> float:
    total_w = sum(col_widths)
    # header bg
    if header and rows:
        c.setFillColor(NAVY)
        c.rect(x, y - row_h, total_w, row_h, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", font_size)
        cx = x
        for i, cell in enumerate(rows[0]):
            c.drawString(cx + 0.08 * inch, y - row_h + 0.1 * inch, cell[:48])
            cx += col_widths[i]
        y -= row_h
        data = rows[1:]
    else:
        data = rows

    for ri, row in enumerate(data):
        bg = HexColor("#F1F5F9") if ri % 2 == 0 else white
        c.setFillColor(bg)
        c.setStrokeColor(LINE)
        c.setLineWidth(0.4)
        c.rect(x, y - row_h, total_w, row_h, fill=1, stroke=1)
        c.setFillColor(SLATE)
        c.setFont("Helvetica", font_size)
        cx = x
        for i, cell in enumerate(row):
            if i == 0:
                c.setFont("Helvetica-Bold", font_size)
            else:
                c.setFont("Helvetica", font_size)
            c.drawString(cx + 0.08 * inch, y - row_h + 0.1 * inch, cell[:52])
            cx += col_widths[i]
        y -= row_h
    return y


def badge(c: canvas.Canvas, x: float, y: float, text: str, color: Color) -> None:
    c.setFillColor(color)
    tw = c.stringWidth(text, "Helvetica-Bold", 10) + 0.28 * inch
    c.roundRect(x, y, tw, 0.28 * inch, 4, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x + 0.12 * inch, y + 0.08 * inch, text)


TOTAL = 12


def slide_01_title(c: canvas.Canvas) -> None:
    # Full navy hero
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.rect(0, 0, W, 0.35 * inch, fill=1, stroke=0)
    c.setFillColor(TEAL_LT)
    c.rect(0, H - 0.12 * inch, W, 0.12 * inch, fill=1, stroke=0)

    if LOGO.exists():
        try:
            c.drawImage(str(LOGO), 0.55 * inch, H - 1.35 * inch, width=1.5 * inch, height=0.9 * inch, mask="auto", preserveAspectRatio=True, anchor="sw")
        except Exception:
            pass

    c.setFillColor(TEAL_LT)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.55 * inch, H - 1.85 * inch, "MARKET ANALYSIS  ·  FEASIBILITY STUDY")

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(0.55 * inch, H - 2.45 * inch, "Southshore Second Location")
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(HexColor("#94A3B8"))
    c.drawString(0.55 * inch, H - 2.85 * inch, "Metairie  ·  Jefferson  ·  Kenner")

    c.setStrokeColor(TEAL_LT)
    c.setLineWidth(2)
    c.line(0.55 * inch, H - 3.15 * inch, 3.2 * inch, H - 3.15 * inch)

    points = [
        "Free pickup & delivery up to 40 miles from Southshore shop",
        "Shop-only repair + Professional LiFePO4 conversions",
        "Home base: Covington, LA (Northshore)",
    ]
    y = H - 3.55 * inch
    c.setFont("Helvetica", 12)
    for p in points:
        c.setFillColor(TEAL_LT)
        c.circle(0.65 * inch, y + 0.04 * inch, 2.5, fill=1, stroke=0)
        c.setFillColor(HexColor("#E2E8F0"))
        c.drawString(0.85 * inch, y, p)
        y -= 0.32 * inch

    c.setFillColor(HexColor("#94A3B8"))
    c.setFont("Helvetica", 10)
    c.drawString(0.55 * inch, 0.7 * inch, "Prepared for Ryan & Christine White  ·  Neighborhood Golf Carts")
    c.drawString(0.55 * inch, 0.48 * inch, "July 9, 2026  ·  Internal planning deck")
    c.setFillColor(white)
    c.setFont("Helvetica", 8)
    c.drawRightString(W - 0.4 * inch, 0.12 * inch, "1 / 12")


def slide_02_verdict(c: canvas.Canvas) -> None:
    draw_bg(c)
    y = header(c, "Executive Verdict", "Market GO  ·  Timing WAIT  ·  Site KENNER",
               "Southshore is a real second market. Do not lease until Covington is predictable and demand is proven.")

    # Three score cards
    cards = [
        ("MARKET", "GO", GO, "Jefferson ~427–431k people\n> St. Tammany ~278k.\nKenner + Harahan street\nordinances unlock usage."),
        ("TIMING", "WAIT", WAIT, "Covington ~$555k rev,\n~$32k net. WIP / lithium\nSLA risk. One driver.\nOpen too early = burn."),
        ("SITE", "KENNER", TEAL, "Kenner first.\nElmwood–Harahan #2.\nMetairie last — OEM\ndealer saturation."),
    ]
    cw, ch = 2.35 * inch, 2.55 * inch
    x0 = 0.55 * inch
    for i, (label, badge_txt, color, body) in enumerate(cards):
        x = x0 + i * (cw + 0.2 * inch)
        card(c, x, y - ch, cw, ch)
        badge(c, x + 0.15 * inch, y - 0.45 * inch, f"{label}: {badge_txt}", color)
        c.setFillColor(SLATE)
        c.setFont("Helvetica", 10)
        ty = y - 0.75 * inch
        for line in body.split("\n"):
            c.drawString(x + 0.18 * inch, ty, line)
            ty -= 0.22 * inch

    y2 = y - ch - 0.35 * inch
    card(c, 0.55 * inch, 0.5 * inch, W - 1.1 * inch, y2 - 0.5 * inch)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.75 * inch, y2 - 0.35 * inch, "Bottom line")
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 10)
    bl = "Free 40-mile Southshore P&D is the right offer for Location 2 — but the right sequence is demand proof + Covington stability first, brick-and-mortar second."
    by = y2 - 0.58 * inch
    for line in wrap(bl, 105):
        c.drawString(0.75 * inch, by, line)
        by -= 0.18 * inch
    footer(c, 2, TOTAL)


def slide_03_context(c: canvas.Canvas) -> None:
    draw_bg(c)
    y = header(c, "Strategic Context", "NGC today — do not break the model")

    rows = [
        ["Element", "Current state"],
        ["Service model", "Shop-only — no mobile / trip charges"],
        ["Hero product", "Professional LiFePO4 kits $2,599–$3,299 · 5-yr battery + BMS"],
        ["Diagnostic floor", "$179 minimum — not waived"],
        ["P&D today", "Free ≤40 mi Northshore · paid (~$99) outside / Southshore"],
        ["T12 financials", "~$554.5k income · ~$372k GP · ~$31.8k net · ~$81k lithium line"],
        ["Team", "Ryan, Christine, Roy, Taylor, Marlon, Peyton (PT)"],
        ["Strategy", "Solidify service before cart sales / rentals"],
    ]
    y = table(c, 0.55 * inch, y, [1.8 * inch, 7.5 * inch], rows, font_size=9, row_h=0.34 * inch)

    y -= 0.25 * inch
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(0.55 * inch, y, "Why Southshore is hard from Covington")
    y -= 0.15 * inch
    bullet_block(
        c,
        0.55 * inch,
        y,
        [
            "Causeway (~24 mi) is a hard logistics barrier — customers will not trailer for routine service.",
            "Paid ~$99 Southshore P&D is a conversion tax vs free Northshore.",
            "Roy is a single-driver bottleneck; scaling haul volume without a second bay/driver plan breaks WIP.",
        ],
        max_width=100,
        gap=0.26,
    )
    footer(c, 3, TOTAL)


def slide_04_market(c: canvas.Canvas) -> None:
    draw_bg(c)
    y = header(c, "Market Definition", "Trade area & demographics",
               "Proposed free zone: ≤40 miles from Southshore shop.")

    rows = [
        ["Geography", "Population", "Med. HH income", "Signal"],
        ["Jefferson Parish", "427k–431k", "~$65,250", "Primary Location 2 parish"],
        ["Metairie CDP", "~145,000", "~$70,200", "Largest / highest income"],
        ["Kenner city", "~65,000", "~$64,000", "Street-legal ordinance"],
        ["St. Tammany (home)", "~278,000", "Growing +~5%", "Current base — smaller"],
    ]
    y = table(c, 0.55 * inch, y, [2.2 * inch, 1.5 * inch, 1.7 * inch, 3.5 * inch], rows, font_size=9, row_h=0.32 * inch)

    y -= 0.3 * inch
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(0.55 * inch, y, "40-mile free zone coverage")
    y -= 0.1 * inch

    zones = [
        ("A Core Jefferson", "Metairie, Kenner, Harahan,\nRiver Ridge, Elmwood"),
        ("B Orleans East Bank", "Lakeview, Mid-City, Uptown,\nGentilly, NOLA East"),
        ("C Gated / golf", "English Turn &\nEast Bank clubs — high AOV"),
        ("D West Bank fringe", "Harvey, Marrero, Gretna,\nSt. Rose — lower density"),
    ]
    cw = 2.2 * inch
    ch = 1.15 * inch
    for i, (t, b) in enumerate(zones):
        x = 0.55 * inch + i * (cw + 0.12 * inch)
        card(c, x, y - ch - 0.05 * inch, cw, ch)
        c.setFillColor(TEAL)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(x + 0.12 * inch, y - 0.28 * inch, t)
        c.setFillColor(SLATE)
        c.setFont("Helvetica", 8)
        ty = y - 0.5 * inch
        for line in b.split("\n"):
            c.drawString(x + 0.12 * inch, ty, line)
            ty -= 0.16 * inch
    footer(c, 4, TOTAL)


def slide_05_regulatory(c: canvas.Canvas) -> None:
    draw_bg(c)
    y = header(c, "Regulatory Demand Map", "Street-legal ordinances drive repair volume",
               "LA RS 32:299.4 — carts on public roads only where city/parish designates streets.")

    rows = [
        ["Jurisdiction", "Street-legal?", "Implication for NGC"],
        ["Kenner", "YES — ≤35 mph (2024)", "Strongest Southshore growth node — more wear & lithium"],
        ["Harahan", "YES — ≤25 mph", "Dense pocket near Colonial Golf & CC"],
        ["Metairie / unincorp. Jeff.", "No broad ordinance", "Private / HOA / course / commercial demand"],
        ["English Turn (Orleans)", "Gated / private", "High-ticket residential lithium buyers"],
    ]
    y = table(c, 0.55 * inch, y, [2.3 * inch, 2.4 * inch, 4.2 * inch], rows, font_size=9, row_h=0.36 * inch)

    y -= 0.35 * inch
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(0.55 * inch, y, "Priority outreach pockets")
    y -= 0.05 * inch
    bullet_block(
        c,
        0.55 * inch,
        y,
        [
            "Kenner — Chateau Estates / Chateau Golf & Country Club",
            "Harahan — Colonial Golf & Country Club corridor",
            "Metairie Country Club / Old Metairie (wealth, not street volume)",
            "English Turn — gated golf community, lithium-ready AOV",
            "Commercial / municipal fleets — compete on responsiveness, not OEM sales",
        ],
        max_width=95,
        gap=0.24,
    )
    footer(c, 5, TOTAL)


def slide_06_competition(c: canvas.Canvas) -> None:
    draw_bg(c)
    y = header(c, "Competitive Landscape", "Two OEM dealers own the Metairie corridor")

    # Competitor cards
    comps = [
        ("Golf Cars of Louisiana", "8057 Airline Dr, Metairie", "Club Car authorized distributor\nSales + certified service + P&D\nMulti-location LA scale", "Brand authority & parts pipeline"),
        ("Deep South Golf Cars", "2508 Hickory Ave, Metairie", "EZGO / Cushman authorized\nSales + service + custom\nClaims 24–48 hr parts jobs", "Local brand & parts depth"),
    ]
    cw, ch = 4.5 * inch, 2.35 * inch
    for i, (name, addr, body, strength) in enumerate(comps):
        x = 0.55 * inch + i * (cw + 0.2 * inch)
        card(c, x, y - ch, cw, ch)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(x + 0.18 * inch, y - 0.35 * inch, name)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 9)
        c.drawString(x + 0.18 * inch, y - 0.55 * inch, addr)
        c.setFillColor(SLATE)
        c.setFont("Helvetica", 9)
        ty = y - 0.85 * inch
        for line in body.split("\n"):
            c.drawString(x + 0.18 * inch, ty, line)
            ty -= 0.18 * inch
        c.setFillColor(TEAL)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(x + 0.18 * inch, y - ch + 0.25 * inch, "STRENGTH: " + strength)

    y2 = y - ch - 0.25 * inch
    card(c, 0.55 * inch, 0.5 * inch, W - 1.1 * inch, y2 - 0.55 * inch)
    c.setFillColor(AMBER)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.75 * inch, y2 - 0.4 * inch, "NGC wedge — do not open as a mini-dealership")
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 10)
    msg = "Southshore’s lithium & diagnostics shop: all makes · Professional Kits · free local P&D · 2–3 day lithium SLA · $179 diagnostic toward repair. Differentiated from Club Car / EZGO sales floors."
    by = y2 - 0.65 * inch
    for line in wrap(msg, 105):
        c.drawString(0.75 * inch, by, line)
        by -= 0.18 * inch
    footer(c, 6, TOTAL)


def slide_07_sites(c: canvas.Canvas) -> None:
    draw_bg(c)
    y = header(c, "Site Comparison", "Kenner first  ·  Elmwood–Harahan second  ·  Metairie last")

    rows = [
        ["Criterion", "Metairie", "Jeff (Elmwood/Harahan)", "Kenner"],
        ["Ordinance / usage tailwind", "2", "4", "5"],
        ["Population / income", "5", "3", "3"],
        ["Competitor saturation", "1", "3", "4"],
        ["Industrial rent / zoning fit", "3", "5", "4"],
        ["40-mi zone coverage quality", "4", "4", "5"],
        ["Weighted lean", "Avoid first", "Strong #2", "BEST #1"],
    ]
    y = table(c, 0.55 * inch, y, [2.6 * inch, 1.8 * inch, 2.5 * inch, 1.8 * inch], rows, font_size=9, row_h=0.3 * inch)

    y -= 0.25 * inch
    # Target RE card
    card(c, 0.55 * inch, 0.5 * inch, W - 1.1 * inch, y - 0.55 * inch)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.75 * inch, y - 0.35 * inch, "Target real estate — Kenner primary search")
    specs = [
        "Size: 2,500–4,500 SF warehouse / flex (2–3 bays + office + parts cage)",
        "Must-haves: roll-up door(s), secure outdoor cart staging, adequate 220V, customer parking",
        "Rent: older industrial ~$7–12/SF/yr  →  ~3,500 SF @ $10 ≈ ~$2,900/mo before CAM",
        "Avoid: retail strip; Airline Dr between GCLA and Deep South",
    ]
    bullet_block(c, 0.7 * inch, y - 0.6 * inch, specs, max_width=100, gap=0.22)
    footer(c, 7, TOTAL)


def slide_08_pd(c: canvas.Canvas) -> None:
    draw_bg(c)
    y = header(c, "Operations Design", "Free ≤40 miles Southshore P&D",
               "Policy change vs today’s paid Southshore — log before marketing.")

    rows = [
        ["Zone", "Fee"],
        ["≤40 mi of Southshore shop", "FREE (market like Northshore)"],
        ["Outside 40 mi from either shop", "Flat fee (keep / revisit $99)"],
        ["Cross-lake into Covington bay", "Route to Southshore shop — do not advertise free Causeway hauls"],
    ]
    y = table(c, 0.55 * inch, y, [3.5 * inch, 5.4 * inch], rows, font_size=10, row_h=0.36 * inch)

    y -= 0.3 * inch
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(0.55 * inch, y, "Capacity math — do not underwrite with hope")
    y -= 0.1 * inch

    metrics = [
        ("45–90 min", "Core Jefferson\nround-trip P&D"),
        ("2–3 hrs", "Zone-edge\nround-trip"),
        ("4–6 / day", "Batched stops\nsustainable"),
        ("2–3 / day", "Random routing\nceiling"),
    ]
    cw, ch = 2.2 * inch, 1.35 * inch
    for i, (big, small) in enumerate(metrics):
        x = 0.55 * inch + i * (cw + 0.12 * inch)
        card(c, x, y - ch, cw, ch)
        c.setFillColor(TEAL)
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(x + cw / 2, y - 0.45 * inch, big)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 9)
        ty = y - 0.75 * inch
        for line in small.split("\n"):
            c.drawCentredString(x + cw / 2, ty, line)
            ty -= 0.16 * inch

    c.setFillColor(WAIT)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(0.55 * inch, 0.55 * inch, "Implication: dedicated Southshore driver OR hard zone days (e.g. M/W/F). Free 40-mi without capacity destroys SLA.")
    footer(c, 8, TOTAL)


def slide_09_financials(c: canvas.Canvas) -> None:
    draw_bg(c)
    y = header(c, "Financial Feasibility", "Order-of-magnitude planning ranges — refine with Jill before lease")

    # Two columns
    card(c, 0.55 * inch, y - 2.7 * inch, 4.5 * inch, 2.7 * inch)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.75 * inch, y - 0.3 * inch, "A. Cash to open (lean satellite)")
    rows_a = [
        ["Category", "Mid / range"],
        ["Deposit / buildout", "$15–45k"],
        ["Tools / diag / chargers", "$20–50k"],
        ["Opening inventory", "$25–60k"],
        ["Truck / trailer (opt.)", "$0–45k"],
        ["Launch marketing", "$5–20k"],
        ["3 mo working capital", "$40–80k"],
        ["TOTAL (realistic mid)", "~$150–200k"],
    ]
    table(c, 0.7 * inch, y - 0.45 * inch, [2.4 * inch, 1.7 * inch], rows_a, font_size=8, row_h=0.26 * inch)

    card(c, 5.25 * inch, y - 2.7 * inch, 4.5 * inch, 2.7 * inch)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(5.45 * inch, y - 0.3 * inch, "B. Revenue needed (≈67% GP)")
    rows_b = [
        ["Scenario", "Monthly", "Annual"],
        ["Lean breakeven", "$35–45k", "$420–540k"],
        ["Healthy satellite", "$50–65k", "$600–780k"],
        ["Covington-comparable", "~$46k", "~$555k"],
    ]
    table(c, 5.4 * inch, y - 0.45 * inch, [2.0 * inch, 1.1 * inch, 1.1 * inch], rows_b, font_size=8, row_h=0.28 * inch)

    c.setFillColor(SLATE)
    c.setFont("Helvetica", 8)
    note_y = y - 2.15 * inch
    for line in [
        "Lithium mix: ~15 Professional Kits/mo ≈ $42k",
        "before add-ons — can carry a lean shop if",
        "repair fills the rest (needs stock + SLA).",
        "",
        "Monthly opex lean: ~$18.5–36.5k before COGS",
        "(rent, 1–2 techs, desk share, driver, mktg).",
    ]:
        c.drawString(5.45 * inch, note_y, line)
        note_y -= 0.14 * inch

    # Scorecard strip
    y2 = y - 2.95 * inch
    card(c, 0.55 * inch, 0.45 * inch, W - 1.1 * inch, y2 - 0.5 * inch)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.75 * inch, y2 - 0.3 * inch, "Feasibility gates")
    gates = [
        ("Market size", "PASS", GO),
        ("Differentiation", "PASS", GO),
        ("Unit economics", "PASS*", GO),
        ("Ops readiness", "FAIL", WAIT),
        ("Leadership span", "AT RISK", WARN),
    ]
    gx = 0.75 * inch
    for label, status, color in gates:
        badge(c, gx, y2 - 0.7 * inch, f"{label}: {status}", color)
        gx += 1.85 * inch
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(0.75 * inch, 0.55 * inch, "* on paper  ·  Capital = owner decision  ·  Overall: Market GO · Timing WAIT · Site KENNER")
    footer(c, 9, TOTAL)


def slide_10_phases(c: canvas.Canvas) -> None:
    draw_bg(c)
    y = header(c, "Recommended Path", "Three phases — do not skip A")

    phases = [
        ("PHASE A — NOW", TEAL, "Demand proof from Covington", [
            "Finalize free vs paid zip map",
            "90-day Kenner/Metairie/Harahan campaign",
            "Track leads, jobs, lithium %, haul cost",
            "KILL: <8–10 SS jobs/mo after 90 days",
            "GO: ≥12–15 jobs/mo or ≥4 lithium/mo",
        ]),
        ("PHASE B — AFTER GATES", WARN, "Soft satellite", [
            "Covington WIP ≤6 for 4+ weeks",
            "Lithium avg days ≤3",
            "Legacy mobile SKUs deactivated",
            "Kenner/Elmwood LOI 2.5–4.5k SF",
            "1 tech + shared driver; mirror kits",
        ]),
        ("PHASE C — SCALE", NAVY, "Full second location", [
            "Second tech at WIP cap",
            "Dedicated Southshore driver",
            "Local parts min/max",
            "Cart sales only after both shops",
            "hit service targets",
        ]),
    ]
    cw, ch = 3.0 * inch, 3.6 * inch
    for i, (title, color, sub, items) in enumerate(phases):
        x = 0.5 * inch + i * (cw + 0.18 * inch)
        card(c, x, y - ch, cw, ch)
        c.setFillColor(color)
        c.roundRect(x, y - 0.55 * inch, cw, 0.55 * inch, 8, fill=1, stroke=0)
        c.setFillColor(white)
        # square off bottom of header band
        c.rect(x, y - 0.55 * inch, cw, 0.2 * inch, fill=1, stroke=0)
        c.setFillColor(color)
        c.rect(x, y - 0.55 * inch, cw, 0.2 * inch, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x + 0.15 * inch, y - 0.35 * inch, title)
        c.setFillColor(SLATE)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(x + 0.15 * inch, y - 0.8 * inch, sub)
        bullet_block(c, x + 0.1 * inch, y - 1.1 * inch, items, max_width=38, size=9, gap=0.28)
    footer(c, 10, TOTAL)


def slide_11_risks(c: canvas.Canvas) -> None:
    draw_bg(c)
    y = header(c, "Risks & Mitigations", "What can kill Location 2 — and how to prevent it")

    rows = [
        ["Risk", "Sev.", "Mitigation"],
        ["OEM dealers own Metairie mindshare", "High", "Don't open on their block; win lithium + speed + free P&D"],
        ["Free 40-mi P&D cost blowout", "High", "Hard polygon; batch routes; booking capacity caps"],
        ["Covington quality collapse", "Crit.", "Phase gates; Ryan stays Northshore primary Year 1"],
        ["Technician hiring lag", "High", "Recruit before lease; use existing hiring quiz"],
        ["Flood / insurance (Jefferson)", "Med", "Elevation, contents coverage, staging plan"],
        ["Sales tax complexity", "Med", "Jill configures Jefferson nexus correctly"],
        ["Web still shows legacy mobile", "Med", "Align copy to shop-only before Southshore ads"],
        ["Over-marketing before capacity", "Med", "Cap SS bookings to Roy's batched days"],
    ]
    table(c, 0.45 * inch, y, [3.2 * inch, 0.7 * inch, 5.4 * inch], rows, font_size=8, row_h=0.34 * inch)
    footer(c, 11, TOTAL)


def slide_12_decision(c: canvas.Canvas) -> None:
    draw_bg(c)
    y = header(c, "Decision Framework", "What Ryan should do next")

    options = [
        ("Max upside (24 mo)", "Phase A hard, then Kenner lease — don't skip proof"),
        ("Lowest risk", "One shop; Southshore as paid premium lane until Covington is a machine"),
        ("Best competitive angle", "Lithium + free SS P&D + Kenner ordinance communities — not cart sales"),
        ("Worst move", "Sign Metairie retail near Airline while Covington WIP is aged & Roy is solo"),
    ]
    for i, (t, b) in enumerate(options):
        x = 0.55 * inch
        yy = y - i * 0.72 * inch
        card(c, x, yy - 0.58 * inch, W - 1.1 * inch, 0.58 * inch)
        c.setFillColor(TEAL if i < 3 else WAIT)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x + 0.2 * inch, yy - 0.22 * inch, t)
        c.setFillColor(SLATE)
        c.setFont("Helvetica", 10)
        c.drawString(x + 0.2 * inch, yy - 0.42 * inch, b)

    # Suggested decision box
    card(c, 0.55 * inch, 0.45 * inch, W - 1.1 * inch, 0.95 * inch, fill=HexColor("#ECFDF5"))
    c.setFillColor(GO)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.75 * inch, 1.1 * inch, "Suggested decision (log when ready)")
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 9)
    dec = "Explore Southshore via Kenner-first site search; no lease until Phase A demand proof and Covington throughput gates pass. Future Location 2 markets free P&D ≤40 miles Southshore."
    by = 0.85 * inch
    for line in wrap(dec, 108):
        c.drawString(0.75 * inch, by, line)
        by -= 0.15 * inch
    footer(c, 12, TOTAL)


def build(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(path), pagesize=PAGE)
    c.setTitle("NGC Southshore Second Location — Market & Feasibility Deck")
    c.setAuthor("Neighborhood Golf Carts")
    c.setSubject("Internal market analysis and feasibility study")

    slides = [
        slide_01_title,
        slide_02_verdict,
        slide_03_context,
        slide_04_market,
        slide_05_regulatory,
        slide_06_competition,
        slide_07_sites,
        slide_08_pd,
        slide_09_financials,
        slide_10_phases,
        slide_11_risks,
        slide_12_decision,
    ]
    for fn in slides:
        fn(c)
        c.showPage()
    c.save()


def main() -> None:
    out = OUT_DIR / OUT_NAME
    build(out)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    art = ARTIFACT_DIR / OUT_NAME
    art.write_bytes(out.read_bytes())
    print(f"Wrote {out}")
    print(f"Wrote {art}")
    print(f"Size: {out.stat().st_size} bytes")


if __name__ == "__main__":
    main()
