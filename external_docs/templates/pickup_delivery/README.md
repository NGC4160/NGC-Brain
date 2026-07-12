# NGC Cart Pickup / Delivery Visual Inspection Form

Single-page driver condition record for Roy (or any driver) when picking up and returning customer carts.

## Layout (Rev I)

Single letter-size page:

| Section | Position | Purpose |
|---------|----------|---------|
| **Pickup** | Top half | Photos, checklist, notes, and signature **before loading** |
| **Drop-off** | Bottom half | Photos, checklist, notes, and signatures **at final return** |

Dashed divider between halves. Bottom section is completed at final return — do not remove from form.

**Driver instructions (Rev I):**
- Photos must show the **entire subject in frame** (nothing cropped)
- Required photo items: Data Tag(s) and Battery Compartment (not roof/seats)
- Obtain **customer/receiver signature** at drop-off whenever possible
- No Miles/Hrs field

## GitHub Pages

**Live form:** https://ngc4160.github.io/NGC-Brain/docs/pickup-delivery-inspection.html

Deploy updates:

```bash
./scripts/deploy_pickup_delivery_form_pages.sh
```

## Files

| File | Use |
|------|-----|
| `NGC_Cart_Pickup_Delivery_Visual_Inspection_Form.html` | Editable source |
| `NGC_Cart_Pickup_Delivery_Visual_Inspection_Form_RevI.pdf` | Print / HCP attachment |

Regenerate PDF: `python3 scripts/generate_pickup_delivery_inspection_pdf.py` (requires `weasyprint`)

## Revision history

| Rev | Change |
|-----|--------|
| H | Side-by-side Before / Return columns on one flow |
| I | Single page — pickup top half, drop-off bottom half |
