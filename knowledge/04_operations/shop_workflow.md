# Shop Workflow

**Last verified:** 2026-06-28

## Current state

NGC operates as a **shop-first** business. All repair, diagnostic, and lithium conversion work happens at the Covington location. Mobile service has been discontinued.

## Customer journey (typical)

```
Customer contact → Intake/scheduling → Drop-off OR pickup →
Shop diagnosis/repair → Payment → Pickup/delivery OR customer pickup
```

### 1. Customer contact & scheduling

- **Christine** (office manager) answers phones and handles intake
- Scheduling via **Housecall Pro**
- Hours: Mon–Fri 8 AM – 5 PM

### 2. Vehicle arrival

Options:

- Customer drops cart at shop
- **Roy** picks up cart (free within 40 mi North Shore; **$99** for South Shore or outside 40 mi)

### 3. Service execution

- **Ryan** — service manager; oversees jobs and workflow
- **Taylor** & **Marlon** — golf cart technicians; primary shop work
- **Peyton** — advanced diagnostics as needed

Every service includes **free 7-point safety inspection**.

For electric diagnostics, follow: `NGC Document Repository /Procedures/NGC_Technician_Standard_Diagnosing_Test_Process_and_Procedure.docx`

Key diagnostic sequence:

1. Static voltage + IR check, visual inspection
2. DVOM setup for load test
3. Handheld programmer to motor controller
4. Review/clear fault codes (photo or save .CPF)
5. Monitor review
6. Log file for complaint
7. Test drive with voltage monitoring
8. Save post-drive .CPF

### 4. Parts & deposits

- Large-ticket items (batteries, motors, controllers, special orders) require **deposit before ordering**
- Inventory tracked in QBO (~$19.7k inventory asset as of Jun 2026)

### 5. Lithium conversions

- Turnaround: **2–3 days**, sometimes same day
- Professional Kit install ~6 hours
- Provide lithium care guide at pickup

### 6. Job completion & payment

- Collect payment at pickup or invoice via HCP (text/email)
- **Roy** delivers cart if customer used pickup service

### 7. Documentation

Historical mobile SOPs referenced Housecall Pro photos, checklists, and NGC stickers on carts. Shop workflow should maintain:

- Before/after photos where applicable
- Diagnostic notes and fault codes
- Parts used / ordered
- Customer-facing summary of work performed

## SOP program

Full list of SOPs to create (intake, shop lanes, tech, lithium, driver, multi-site): **[sop_catalog.md](sop_catalog.md)**.  
**Live SOPs:** [SOP-01 Customer Intake](sops/SOP-01_customer_intake.md)  
**Draft SOPs:** [SOP-03](sops/SOP-03_repair_diagnostic_quote.md) · [SOP-04](sops/SOP-04_lithium_quote.md) · [SOP-05](sops/SOP-05_deposit_collection.md) · [SOP-11 Job Lanes](sops/SOP-11_job_lane_lifecycle.md)  
Per-location variables for a second shop: **[../01_company/location_profile_template.md](../01_company/location_profile_template.md)**.

## Internal reference documents

| Document | Location |
|----------|----------|
| Mobile repair SOP (legacy) | `NGC Document Repository /Procedures/Mobile Golf Cart Repair and Safety Protocol.docx` |
| Procedure checklist (legacy HCP flow) | `NGC Document Repository /Checklists/NGC Mobile Golf Cart Repair Services Procedure Checklist.docx` |
| Technician hiring test | `My Drive/Hiring quiz evaluation - Technician.docx` |
| Bill of sale form | `Management/NGC Golf Cart Bill of Sale Form (2).pdf` (for future sales) |

## Future: DMS migration

| System | Status |
|--------|--------|
| **Housecall Pro** | Current — scheduling, pricebook, invoicing |
| **Everlogic** | Preferred DMS candidate when shop slows enough to migrate |
| **BitDMS** | Under consideration |

HCP was chosen for mobile operations. Migration to Everlogic (or similar dealer/shop DMS) planned because NGC no longer offers mobile service.

**Before migration:**

1. Deactivate legacy mobile pricebook items
2. Remove discontinued NGC Conversion products
3. Confirm Professional lithium SKUs and current policies in new system
