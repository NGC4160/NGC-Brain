# Technician SOP (September 2026)

**Last verified:** 2026-09-06  
**Document ID:** NGC-OPS-TECH-092026R0  
**Title:** Technician Standard Operating Procedure & Related Documents  
**Effective:** September 2026 · **Revision:** R0  
**Approved by:** Ryan White (shop use)

## Source of truth

The **full official SOP is the staff master** in Google Drive **Procedures**. This brain file is a **summary and pointer only**. Do **not** paste or reconstruct the controlled package here.

| Item | Value |
|------|--------|
| Folder | [Procedures](https://drive.google.com/drive/folders/1-NjzSQxTsbXqlOhbK7ptZzg1H5G2ntdh) (`1-NjzSQxTsbXqlOhbK7ptZzg1H5G2ntdh`) |
| SOP PDF | [NGC-OPS-TECH-092026R0_Technician_SOP.pdf](https://drive.google.com/file/d/1d40prlzJFo-hGzw8tlUJMU3icxgmc0sT/view) (file id `1d40prlzJFo-hGzw8tlUJMU3icxgmc0sT`) |
| SOP DOCX | [NGC-OPS-TECH-092026R0_Technician_SOP.docx](https://drive.google.com/file/d/1dQvm2UME5pew0lNJ-FFsEk8y8ftK5fq1/view) (file id `1dQvm2UME5pew0lNJ-FFsEk8y8ftK5fq1`) |
| Forms / checklists PDF | [NGC-OPS-TECH-092026R0_Forms_Checklists.pdf](https://drive.google.com/file/d/1U1YyZX1ptYATU43r6J5NvFwXdFVB-JtW/view) (file id `1U1YyZX1ptYATU43r6J5NvFwXdFVB-JtW`) |
| Forms / checklists DOCX | [NGC-OPS-TECH-092026R0_Forms_Checklists.docx](https://drive.google.com/file/d/1V3zjDyKH_-lEvsfnQ35TdbNmYw1-qJX1/view) (file id `1V3zjDyKH_-lEvsfnQ35TdbNmYw1-qJX1`) |

**EST-1 estimate-support checklist** lives in Drive **Checklists** (not Procedures):

| Item | Value |
|------|--------|
| Folder | [Checklists](https://drive.google.com/drive/folders/1aNp0s5gGqq6B_SjxpAyCU3O-IkzUFPkp) (`1aNp0s5gGqq6B_SjxpAyCU3O-IkzUFPkp`) |
| File | [NGC-EST-1_Job_Report_Checklist_Estimating_blank.pdf](https://drive.google.com/file/d/1DjHCgKhh86CCwdzMf5bbcjYnOO-Y4faS/view) (file id `1DjHCgKhh86CCwdzMf5bbcjYnOO-Y4faS`) |
| Rev | 2026-09-05 · blank shop record · Tech → Admin estimate handoff (SOP §§11–12) |

Open the Drive SOP for the complete position standard, workflows, escalation matrix, and appendices. Live Drive content = Google Drive connector (NGC985). Brain catalog = `knowledge/.generated/drive_catalog.md`.

## Who it applies to

**Golf Cart Technician.** Current people in the role: **Marlon** and **Ryan Gorgoglione**. **Ryan White** oversees technicians, diagnostics, training, and QC.

This is **not** the Driver / Shop Technician Assistant package. Hayden Silva stays on [driver_sop.md](driver_sop.md) (**NGC-OPS-DRIVER-09032026R0**). Roster: [roles.md](../05_team/roles.md).

## Core standard

**TEST BEFORE REPLACEMENT — DOCUMENT BEFORE ASSUMPTION — VERIFY BEFORE COMPLETION.**

Required sequence (Drive SOP §1): **REVIEW → INSPECT → DIAGNOSE → REPORT → REPAIR → VERIFY → QC → DOCUMENT → COMPLETE.**

A job is not technically complete because a part was replaced or the cart runs. The technician must be able to explain the complaint, authorization, inspection, tests, evidence, correction, and verification.

## Role boundaries (high level)

| Lane | Owns |
|------|------|
| **Technician** | Inspection, diagnosis, measurements, root cause, repair/install, technical part ID, reasonable labor-time for technical ops, verification, tech QC, technical HCP notes, reporting findings/status |
| **Admin (Jesse)** | Customer admin comms, approved-vendor search/quotes, price/availability/shipping, estimate formation and authorization workflow, whiteboard reconciliation, HCP admin control, documentation follow-up |
| **Management** | Work priority and assignments, pricing/concessions, major repair authorization, escalated technical decisions, performance/training, policy exceptions |

Shop owns live HCP jobs, estimates, and WIP. Diagnostics owns the evidence library ([diagnostics/README.md](../diagnostics/README.md)) and supports **TEST BEFORE REPLACEMENT**. It does not replace hands-on tests.

## Work classifications (high level)

Use these names. Full definitions and authorization rules are in the Drive SOP.

| Classification | Brain reminder |
|----------------|----------------|
| **MAIN JOB** | Complaint / requested repair / principal reason the cart is here. Primary priority. |
| **REQUIRED ASSOCIATED OPERATION** | Work needed to complete and verify the Main Job (alignment, programming, charge check, road test). Include in the original labor-time estimate. |
| **ADDITIONAL WORK DISCOVERED DURING REPAIR** | Unexpected condition during already-approved Main Job work. Report to Admin (condition, parts, safety YES/NO, extra labor). **Do not proceed without authorization.** |
| **COURTESY INSPECTION ITEM** | Separate finding. Document separately with safety YES/NO. Does **not** replace the Main Job and is not automatically authorized. |

Priority: Main Job → required associated ops → additional **authorized** work → courtesy recommendations. Safety may override.

## SOP package (high level)

Full section text is in the Drive SOP. Use these headings to find the right part — do **not** invent checklist steps from this brain file.

| Package area | Use the Drive SOP for |
|--------------|------------------------|
| Shop work queue | Whiteboard is the primary **shop** work queue; do not independently reorganize unless authorized |
| Start-of-job / courtesy inspection | Confirm cart vs work order; keep courtesy items separate |
| Diagnostic standard | Structured testing and evidence; verify before replacement |
| Parts ID + Admin handoff | Tech IDs the part (IPL/manual); Admin sources approved-vendor quote |
| Estimate support + labor time | Complete repair time, not just the swap — **NGC-EST-1** |
| Additional-work authorization | Stop, document, hand to Admin, wait |
| Lithium / high-current | Stored energy, BMS, polarity, charger compatibility; running ≠ complete |
| HCP documentation | Separate Main Job / courtesy / additional work |
| Self-QC, comeback, daily open/close | Printables in the Forms / Checklists package |

Shop policy that still applies (already in the brain — not a substitute for the Drive SOP):

- In-shop only — no mobile service, no trip charges
- HCP **New job** / **Customer drop off** ARE the pickup/drop-off queue (distinct from the shop whiteboard work queue)
- Deposit pipeline: **COPY TO JOB** → **Awaiting Deposit** → **Need to Order** → **Waiting for Materials**
- Diagnostic **$179** — not waived; applies toward repair on known-issue jobs
- Credit card surcharge on every estimate; update before invoice/payment
- Lithium: Professional Kits only; inspect, test, and tune every install

See [shop_workflow.md](shop_workflow.md) and [shop_services.md](../03_services/shop_services.md).

## Hard limits

- Do **not** treat this file as the official SOP — open the Drive masters
- Do **not** invent SOP steps, labor times, QC marks, or form fields
- Do **not** authorize additional work from this summary — Admin / Management own authorization
- Do **not** quote mobile service, trip charges, or NGC Conversion lithium products
- Do **not** store customer names or addresses in this file
- Do **not** clone Drive SOP/PDF binaries into the repo
