#!/usr/bin/env python3
"""Generate NGC Cart Pickup/Delivery Visual Inspection Form as PDF.

Top half = pickup (before loading). Bottom half = drop-off (final return).
"""

from __future__ import annotations

from pathlib import Path

from weasyprint import HTML

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "external_docs/templates/pickup_delivery/NGC_Cart_Pickup_Delivery_Visual_Inspection_Form.html"
OUT_DIR = ROOT / "external_docs/templates/pickup_delivery"
OUT_NAME = "NGC_Cart_Pickup_Delivery_Visual_Inspection_Form_RevI.pdf"


def main() -> Path:
    if not TEMPLATE.exists():
        raise FileNotFoundError(f"Template not found: {TEMPLATE}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / OUT_NAME
    HTML(filename=str(TEMPLATE)).write_pdf(str(out_path))
    print(f"Wrote {out_path}")
    return out_path


if __name__ == "__main__":
    main()
