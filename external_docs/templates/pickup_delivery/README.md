# NGC Cart Pickup / Delivery Visual Inspection Form

Single-page driver condition record for Roy (or any driver) when picking up and returning customer carts.

## Layout (Rev I)

| Section | Position | Purpose |
|---------|----------|---------|
| **Pickup** | Top half of page | Photos, checklist, notes, and signature **before loading** |
| **Drop-off** | Bottom half of page | Photos, checklist, notes, and signatures **at final return** |

Dashed divider between halves for fold/cut reference.

## Files

| File | Use |
|------|-----|
| `NGC_Cart_Pickup_Delivery_Visual_Inspection_Form.html` | Editable source — open in browser to preview or print |
| `NGC_Cart_Pickup_Delivery_Visual_Inspection_Form_RevI.pdf` | Generated PDF for print / HCP attachment |

## Regenerate PDF

```bash
python3 scripts/generate_pickup_delivery_inspection_pdf.py
```

Requires `weasyprint` (`pip install weasyprint`).

## Revision history

| Rev | Change |
|-----|--------|
| H | Side-by-side Before / Return columns on one flow |
| I | Split layout — pickup top half, drop-off bottom half |
