#!/usr/bin/env python3
"""Generate NGC Shop QC Completion Form PDF (2 pages)."""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "external_docs/templates/shop_qc/NGC_Shop_QC_Form.pdf"
LOGO = ROOT / "external_docs/templates/shop_qc/assets/ngc-logo.png"

NGC_BLUE = colors.HexColor("#1a4d7a")
NGC_GREEN = colors.HexColor("#6faa2d")
BORDER = colors.HexColor("#c5d4e3")
MUTED = colors.HexColor("#555555")


def checkbox_cell(text: str = "") -> Paragraph:
    return Paragraph(f"☐ {text}", styles["cell"])


def header_row(title: str) -> Table:
    t = Table([[Paragraph(title, styles["SectionHdr"])]], colWidths=[7.2 * inch])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("LINEBELOW", (0, 0), (-1, -1), 2, NGC_GREEN),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return t


def field_table(rows: list[list[str]], col_widths: list[float]) -> Table:
    data = []
    for row in rows:
        data.append([Paragraph(f"<b>{row[0]}</b>", styles["label"])] + [""] * (len(col_widths) - 1))
        if len(row) > 1:
            data[-1] = [Paragraph(f"<b>{row[i]}</b>", styles["label"]) if i < len(row) else "" for i in range(len(col_widths))]
            data.append([Paragraph("_" * 28, styles["line"]) for _ in col_widths])
    t = Table(data, colWidths=col_widths)
    t.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ]
        )
    )
    return t


def checklist_table(headers: list[str], rows: list[list], col_widths: list[float]) -> Table:
    data = [[Paragraph(f"<b>{h}</b>", styles["label"]) for h in headers]]
    for row in rows:
        data.append(row)
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eef4fa")),
                ("TEXTCOLOR", (0, 0), (-1, 0), NGC_BLUE),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return t


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="DocTitle",
        parent=styles["Heading1"],
        fontSize=14,
        textColor=NGC_BLUE,
        alignment=TA_CENTER,
        spaceAfter=4,
    )
)
styles.add(ParagraphStyle(name="subtitle", parent=styles["Normal"], fontSize=7.5, textColor=MUTED, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="intro", parent=styles["Normal"], fontSize=8, textColor=MUTED, leading=10))
styles.add(ParagraphStyle(name="SectionHdr", parent=styles["Heading3"], fontSize=8.5, textColor=NGC_BLUE, spaceBefore=2, spaceAfter=2))
styles.add(ParagraphStyle(name="label", parent=styles["Normal"], fontSize=7, textColor=MUTED, leading=8))
styles.add(ParagraphStyle(name="cell", parent=styles["Normal"], fontSize=8, leading=10))
styles.add(ParagraphStyle(name="line", parent=styles["Normal"], fontSize=8, textColor=colors.grey))
styles.add(ParagraphStyle(name="small", parent=styles["Normal"], fontSize=7.5, textColor=MUTED, leading=9))
styles.add(ParagraphStyle(name="attest", parent=styles["Normal"], fontSize=8.5, textColor=NGC_BLUE, leading=11))
styles.add(ParagraphStyle(name="footer", parent=styles["Normal"], fontSize=7, textColor=MUTED))


def build_pdf() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        leftMargin=0.45 * inch,
        rightMargin=0.45 * inch,
        topMargin=0.4 * inch,
        bottomMargin=0.35 * inch,
        title="NGC Shop QC Completion Form",
    )
    story: list = []

    # Header
    logo = Image(str(LOGO), width=1.0 * inch, height=0.72 * inch)
    company = Paragraph(
        "<b>Neighborhood Golf Carts</b><br/>"
        "71363 Thelma Ln, Suite E · Covington, LA 70433<br/>"
        "985-402-1206 · contact@ngcgolfcarts.com · NGCGolfCarts.com<br/>"
        "Shop hours: Monday–Friday, 8:00 AM – 5:00 PM",
        styles["subtitle"],
    )
    header = Table([[logo, company]], colWidths=[1.15 * inch, 6.05 * inch])
    header.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("ALIGN", (1, 0), (1, 0), "RIGHT")]))
    story += [header, Spacer(1, 4)]

    banner = Table([[Paragraph("SHOP QC COMPLETION FORM", styles["DocTitle"])]], colWidths=[7.2 * inch])
    banner.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), NGC_BLUE),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story += [
        banner,
        Spacer(1, 6),
        Paragraph(
            "<b>Turn in this completed form when a cart is finished and ready to move to READY.</b> "
            "Adapted from the NGC service-call procedure for in-shop work. All photos must be uploaded to "
            "Housecall Pro before turning in this form. Use invoice # only on the whiteboard — no customer "
            "names on posted copies.",
            styles["intro"],
        ),
        Spacer(1, 6),
    ]

    # Job info
    story.append(header_row("JOB INFORMATION"))
    job_fields = Table(
        [
            [
                Paragraph("<b>HCP INVOICE / JOB #</b><br/>____________________", styles["label"]),
                Paragraph("<b>DATE COMPLETED</b><br/>____________________", styles["label"]),
                Paragraph("<b>TIME COMPLETED</b><br/>____________________", styles["label"]),
            ],
            [
                Paragraph("<b>TECHNICIAN</b><br/>____________________", styles["label"]),
                Paragraph("<b>BAY / LOCATION</b><br/>____________________", styles["label"]),
                Paragraph("<b>SERVICE TYPE</b><br/>____________________", styles["label"]),
            ],
            [
                Paragraph("<b>CART MAKE / MODEL / YEAR</b><br/>____________________", styles["label"]),
                Paragraph("<b>SERIAL # OR VIN</b><br/>____________________", styles["label"]),
                Paragraph("<b>POWER TYPE</b><br/>____________________", styles["label"]),
            ],
        ],
        colWidths=[2.4 * inch, 2.4 * inch, 2.4 * inch],
    )
    story += [job_fields, Spacer(1, 6)]

    # Pre-work
    story.append(header_row("PRE-WORK SHOP PROCEDURE (BEFORE WRENCHING)"))
    prework = checklist_table(
        ["✓", "Step", "Notes / Initial"],
        [
            [checkbox_cell(), Paragraph("Reviewed HCP job — complaint, authorized work, and parts list verified", styles["cell"]), Paragraph("________________", styles["line"])],
            [checkbox_cell(), Paragraph("Verified correct cart (invoice #, keys, and physical cart match)", styles["cell"]), Paragraph("________________", styles["line"])],
            [checkbox_cell(), Paragraph("PPE in use (safety glasses, gloves; lithium protocols if applicable)", styles["cell"]), Paragraph("________________", styles["line"])],
            [checkbox_cell(), Paragraph("Tow / run switch in TOW or OFF before electrical work; cart secured", styles["cell"]), Paragraph("________________", styles["line"])],
            [checkbox_cell(), Paragraph("Battery disconnect / lockout performed when required", styles["cell"]), Paragraph("________________", styles["line"])],
            [checkbox_cell(), Paragraph("Work area clean; tools and lift/chocks set up safely", styles["cell"]), Paragraph("________________", styles["line"])],
        ],
        [0.35 * inch, 4.55 * inch, 2.3 * inch],
    )
    story += [prework, Spacer(1, 6)]

    # 7 photos
    story.append(header_row("REQUIRED BEFORE-WORK PHOTOS (7) — UPLOADED TO HCP"))
    story.append(
        Paragraph(
            "Take all seven photos before starting repair work. Check each box when uploaded to the HCP job.",
            styles["small"],
        )
    )
    photos = Table(
        [
            [checkbox_cell("1 Front of cart (full view)"), checkbox_cell("2 Rear of cart (full view)")],
            [checkbox_cell("3 Driver side (full profile)"), checkbox_cell("4 Passenger side (full profile)")],
            [checkbox_cell("5 Battery compartment / pack area"), checkbox_cell("6 Dash / key switch / charge port")],
            [checkbox_cell("7 Serial # / VIN tag or data plate"), ""],
        ],
        colWidths=[3.6 * inch, 3.6 * inch],
    )
    photos.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, BORDER), ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fafcfe"))]))
    story += [photos, Spacer(1, 6)]

    # 7-point inspection
    story.append(header_row("7-POINT SAFETY INSPECTION (FREE WITH EVERY SERVICE)"))
    inspection_points = [
        "Wires, cables, and terminals",
        "Battery water levels (lead-acid) or lithium pack condition",
        "Lights and horn (if applicable)",
        "Tires — inflation, tread depth, uneven wear",
        "Steering and suspension",
        "Drivetrain (axle & motor)",
        "Brakes — operation and adjustment",
    ]
    insp_rows = []
    for i, point in enumerate(inspection_points, 1):
        insp_rows.append(
            [
                Paragraph(str(i), styles["cell"]),
                checkbox_cell(),
                Paragraph(point, styles["cell"]),
                Paragraph("________________", styles["line"]),
            ]
        )
    story.append(checklist_table(["#", "✓", "Inspection point", "Pass / note / N/A"], insp_rows, [0.25 * inch, 0.3 * inch, 3.9 * inch, 2.75 * inch]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("NGC Shop QC Completion Form · Rev. 2026-07 · Page 1 of 2 · Form ID: SHOP-QC-001", styles["footer"]))

    # Page 2
    story.append(PageBreak())
    story.append(header_row("HCP INVOICE / JOB # (PAGE 2)"))
    story.append(Paragraph("____________________", styles["line"]))
    story.append(Spacer(1, 6))

    story.append(header_row("INSPECTION FINDINGS — NOTABLE CONDITIONS (PHOTOS UPLOADED TO HCP)"))
    story.append(
        Paragraph(
            "Photograph damage, wear, leaks, corrosion, loose hardware, fault codes, or symptoms found during inspection.",
            styles["small"],
        )
    )
    finding_rows = [[checkbox_cell(), Paragraph("______________________________", styles["line"]), Paragraph("Y / N", styles["line"])] for _ in range(3)]
    story.append(checklist_table(["✓", "Condition / finding", "Photo?"], finding_rows, [0.35 * inch, 5.0 * inch, 1.85 * inch]))
    story.append(checkbox_cell("No notable conditions beyond normal wear — N/A"))
    story.append(Spacer(1, 5))

    story.append(header_row("WORK PERFORMED — PHOTO DOCUMENTATION (UPLOADED TO HCP)"))
    work_rows = [[checkbox_cell(), Paragraph("______________________________", styles["line"]), Paragraph("Y / N", styles["line"])] for _ in range(3)]
    story.append(checklist_table(["✓", "Work area / repair performed", "Before & after?"], work_rows, [0.35 * inch, 5.0 * inch, 1.85 * inch]))
    story.append(Spacer(1, 5))

    story.append(header_row("ELECTRIC DIAGNOSTIC CLOSE-OUT (IF APPLICABLE)"))
    for item in [
        "Fault codes reviewed and cleared (photo or .CPF saved to HCP)",
        "Post-repair monitor / log file saved if required",
        "Charger tested / verified compatible",
        "Lithium care guide staged for customer (lithium jobs)",
        "N/A — non-electrical job",
    ]:
        story.append(checkbox_cell(item))
    story.append(Spacer(1, 5))

    story.append(header_row("FINAL QUALITY CHECK — WORK COMPLETENESS"))
    story.append(Paragraph("Physically re-walk the cart. Check every item that applies.", styles["small"]))
    quality_items = [
        "<b>Completeness</b> — all authorized work finished; no open tasks or missing parts",
        "<b>Neatness</b> — wiring routed and secured; panels aligned; no stray hardware",
        "<b>Cleanliness</b> — work area wiped down; grease and debris removed from cart",
        "<b>Tightness</b> — fasteners, lug nuts, terminals, and clamps torqued / snugged correctly",
        "<b>Safety</b> — seat belts, body panels, battery hold-downs, and covers reinstalled",
        "<b>Fluids / levels</b> — battery water, gear oil, or other fluids checked as applicable",
        "<b>Accessories</b> — lights, horn, mirrors, and add-ons function correctly",
        "<b>Tools & parts</b> — no tools, rags, or old parts left on or in the cart",
        "<b>HCP updated</b> — notes, parts used, labor, and photos complete on the job",
    ]
    q_rows = [[checkbox_cell(), Paragraph(item, styles["cell"])] for item in quality_items]
    story.append(checklist_table(["✓", "Quality standard"], q_rows, [0.35 * inch, 6.85 * inch]))
    story.append(Spacer(1, 5))

    story.append(header_row("TEST DRIVE & DELIVERY READINESS"))
    story.append(
        Paragraph(
            "<b>Test drive date / time:</b> ____________________ &nbsp;&nbsp; "
            "<b>Distance / duration:</b> ____________________",
            styles["cell"],
        )
    )
    for item in [
        "Forward / reverse operation verified",
        "Brakes stop cart smoothly — no pull or noise",
        "Steering tracks straight; no new vibrations or noises",
        "Speed / acceleration normal; no fault codes after drive",
        "Customer complaint verified resolved (or documented if not)",
        "Cart charged / SOC appropriate for pickup or delivery",
    ]:
        story.append(checkbox_cell(item))
    story.append(Paragraph("<b>Test drive notes:</b> ________________________________________________", styles["cell"]))
    story.append(Spacer(1, 5))

    attest = Table(
        [[
            Paragraph(
                "☐ <b>I certify</b> that I completed all required steps, uploaded all required photos to Housecall Pro, "
                "performed the 7-point safety inspection, test drove this cart, and verified it is complete, neat, clean, "
                "tight, and in proper condition for customer pickup or delivery. I am turning this form in to move this cart to <b>READY</b>.",
                styles["attest"],
            )
        ]],
        colWidths=[7.2 * inch],
    )
    attest.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 1.5, NGC_BLUE), ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f4f8fc")), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    story += [attest, Spacer(1, 6)]

    story.append(header_row("TECHNICIAN SIGN-OFF"))
    sig = Table(
        [
            [Paragraph("<b>Technician signature</b><br/>________________________", styles["label"]), Paragraph("<b>Date</b><br/>________________________", styles["label"])],
            [Paragraph("<b>Service manager review (Ryan — spot-check)</b><br/>________________________", styles["label"]), Paragraph("<b>Date</b><br/>________________________", styles["label"])],
        ],
        colWidths=[3.6 * inch, 3.6 * inch],
    )
    story += [sig, Spacer(1, 4)]
    story.append(
        Paragraph(
            "Turn in to office tray · Move whiteboard card to READY · Christine notifies customer · "
            "Form ID: SHOP-QC-001 · Page 2 of 2",
            styles["footer"],
        )
    )

    doc.build(story)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build_pdf()
