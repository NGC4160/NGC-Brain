# Legacy Mobile Service & Discontinued Products

**Last verified:** 2026-06-28  
**Status:** ARCHIVE ONLY — do not quote, schedule, or recommend these to customers

NGC discontinued mobile/on-site service. All work is **in-shop** at Covington. This file lists pricebook and QBO items that still exist in exports but are **no longer offered**.

## Discontinued service model

| Was | Now |
|-----|-----|
| Mobile/on-site repair | In-shop only |
| "On My Way" dispatch | Customer drop-off or Roy pickup/delivery |
| Trip charges | None |
| Neighborhood-specific diagnostic fees | None — standard shop diagnostic $179 |

## Legacy pricebook line items — do not use

### Mobile diagnostics & service

- `1.0 - Golf Cart Diagnostic & Inspection [Mobile Service Call]` — $174
- `Mobile On-Site Golf Cart Diagnostics` — $174
- `On-Site Mobile Diagnostics` — $229
- `Mobile On-Site Golf Cart General Service and Repairs` — $0
- `Additional Diagnostic Time Labor Only (On-Site)` — $145
- `1.0 - Diagnostic Service Call (Bedico Creek Subdivision)` — $129
- `Diagnostic Service Call (out of service area)` — $149
- `0.5-Inspection Service Call` — $149 *(mobile inspection call)*

### Trip charges

- `Standard Trip Charge` — $50
- `Extended Range Trip Charge` — $49
- `Supplemental Trip Charge` — $30
- `Extended Distance Trip Charge` — $20

### Discontinued lithium products (NGC Conversion line)

Replaced by **Professional Kit** tiers — see [lithium_conversions.md](../02_products/lithium_conversions.md).

- `3.0-NGC Lithium Conversion, 36v 105ah` — $2,199
- `3.0-NGC Lithium Conversion, 48v 105ah` — $1,899
- `3.0-NGC MINI Lithium Conversion, 48v 105ah` — $2,399
- `3.0- NGC Lithium Conversion, 72V 105AH` — $2,699
- `3.0-NGC Lithium Conversion, 60v 105ah` — $2,079
- `NGC Lithium Conversion Kit` — $1,899
- `TEST PARTIAL KIT 48V Professional Lithium Battery Conversion Kit Installed` — $2,499

### Future / inactive

- Golf cart sales line items (e.g. `2022 Club Car Tempo`, `Golf Cart Sales Deposit`) — sales not offered yet
- `Cart Sales` QBO income account — reserved for future

## Legacy Google Drive SOPs

These documents describe **mobile** workflows. Use for historical reference only; adapt for shop context:

| Document | Notes |
|----------|-------|
| `Mobile Golf Cart Repair and Safety Protocol.docx` | Mobile arrival, test drive at customer site |
| `NGC Mobile Golf Cart Repair Services Procedure Checklist.docx` | HCP "On My Way", mobile job flow |
| Old Add-On Menu.docx | **Superseded** by HCP pricebook export |

Shop-relevant content from these SOPs (still valid):

- Safety checklist (PPE, tow/run switch, battery disconnect)
- Photo documentation (before/during/after)
- 7-point inspection
- Diagnostic evidence collection

## Legacy QBO income

- **Mobile Trip Income** — ~$8,258 in Jun 2025–Jun 2026 period; should trend to $0

## Action items for staff

1. **Deactivate** all items in this file in Housecall Pro — step-by-step: [legacy_pricebook_cleanup.md](../10_automation/legacy_pricebook_cleanup.md)
2. **Mark inactive** matching items in QBO products/services
3. **Do not import** these into Everlogic during DMS migration
4. When AI references NGC services, use `knowledge/03_services/` and `knowledge/02_products/` only
