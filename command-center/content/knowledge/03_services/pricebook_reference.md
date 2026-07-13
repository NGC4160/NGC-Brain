# Pricebook Reference

**Last verified:** 2026-07-13  
**Source file:** `external_docs/exports/pricebook/NeighborhoodGolfCarts_pricebook_export.csv`  
**Total line items:** 282

## How to use this document

The CSV is the **full pricebook**. This file summarizes categories and flags items that are **current vs legacy**. For exact prices on repairs, always check the CSV or Housecall Pro.

## Categories (item counts)

| Category | Items | Price range (approx.) |
|----------|------:|----------------------|
| Accessories | 49 | $43 – $3,589 |
| General | 36 | fees & diagnostics |
| Steering and Suspension | 27 | $49 – $499 |
| Drivetrain | 22 | $49 – $799 |
| Electrical | 21 | $3 – $1,899 |
| Controls | 20 | $79 – $479 |
| Batteries & Cables | 17 | $25 – $2,699* |
| Brakes | 16 | $99 – $699 |
| Controllers & Motors | 13 | $250 – $1,499 |
| Lighting | 9 | $350 – $1,199 |
| Bushings | 8 | $269 – $449 |
| Lithium Battery Conversions [Full Kit] | 6 | $2,499 – $3,299 |
| Body | 6 | $125 – $399 |
| Wheels & Tires | 6 | $35 – $69 |
| Lift Kits | 6 | $849 – $1,099 |
| Golf Cart Services | 4 | mixed |
| PM Services | 3 | $125 – $199 |

*Includes discontinued NGC Conversion items — use Professional Kit category instead.

## Labor rates (from pricebook)

| Rate name | Used for |
|-----------|----------|
| R&R Base Technician Rate | Standard R&R work |
| Level 2 Technician Rate | Most repair line items |
| Lithium Battery Conversion Technician Rate | Conversion installs (3–6 hr) |
| Advanced Diagnostics Technician Rate | Complex diagnostics |
| L1 Diagnostics Technician Rate | Diagnostic calls |
| Vendor Labor | Subcontracted work |

## Key General-category line items (current)

| Name | Price | Status |
|------|------:|--------|
| Golf Cart Diagnostic & Inspection | $179 | **Current** (shop) |
| Minimum Service Charge — Diagnostic Inspection | $179 | **Current** |
| Diagnostic Testing | $125 | Current |
| Advanced Diagnostics (In-Shop) | $145 | Current |
| Shop Labor Hours | $125 | Current |
| Standard Pick-up/Drop-off Service | $99 | **Current** — paid zone (outside 40 mi Northshore or Southshore) |
| 7-Point Golf Cart Safety Inspection | $0 | Current |
| WORK PERFORMED AT SHOP | $0 | Internal flag line |

## Legacy — deactivate / do not quote

See [archive/legacy_mobile.md](../archive/legacy_mobile.md) for full list. Includes:

- All mobile diagnostic and on-site service lines
- Trip charges ($30 / $49 / $50)
- Neighborhood-specific diagnostics (e.g. Bedico Creek)
- NGC Conversion lithium products
- TEST PARTIAL KIT 48V
- Mobile On-Site Golf Cart General Service

## Sample accessory & repair pricing

| Service | Price |
|---------|------:|
| Tire Rotation | $49 |
| Tire Replacement Service | $55 |
| Tire Mount (per tire) | $35 |
| Toe Adjustment | $129 |
| Wheel alignment | $149 |
| Brake Adjustment | $99 |
| Complete Cable/Terminal Replacement | $139 |
| Battery terminal clean & protect | $79 |
| Install DC-DC Converter | $199 |
| Battery Monitor Installation | $299 |
| Install Windshield | $299 |
| Governor adjustment (gas) | $149 |

## Online booking

Most line items have `online_booking_enabled: false` in export. Booking flows through office (Christine) and Housecall Pro.

## Reconciliation note

QBO `products_and_services.xlsx` mirrors HCP items with hierarchical names (e.g. `Accessories:`, `Lithium Battery Conversions [Full Kit]:`). Keep HCP and QBO in sync when prices change.
