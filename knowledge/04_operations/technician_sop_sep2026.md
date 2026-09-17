# Technician SOP — September 2026

**Status:** Official NGC Technician Operating Standard (September 2026)  
**Core rule:** Test before replacement · Document before assumption · Verify before completion  
**Sequence:** REVIEW → INSPECT → DIAGNOSE → REPORT → REPAIR → VERIFY → QC → DOCUMENT → COMPLETE

## Where the full documents live (staff source of truth)

Staff SOPs stay in Google Drive. Bots use this summary + Drive pointers; do **not** paste the full controlled PDF into chat.

| Document | Drive id | Link |
|---|---|---|
| Technician SOP PDF | `1d40prlzJFo-hGzw8tlUJMU3icxgmc0sT` | https://drive.google.com/file/d/1d40prlzJFo-hGzw8tlUJMU3icxgmc0sT/view |
| Forms & Checklists PDF | `1U1YyZX1ptYATU43r6J5NvFwXdFVB-JtW` | https://drive.google.com/file/d/1U1YyZX1ptYATU43r6J5NvFwXdFVB-JtW/view |
| Technician SOP Word | `1dQvm2UME5pew0lNJ-FFsEk8y8ftK5fq1` | https://drive.google.com/file/d/1dQvm2UME5pew0lNJ-FFsEk8y8ftK5fq1/view |
| Forms & Checklists Word | `1V3zjDyKH_-lEvsfnQ35TdbNmYw1-qJX1` | https://drive.google.com/file/d/1V3zjDyKH_-lEvsfnQ35TdbNmYw1-qJX1/view |
| NGC-EST-1 estimating checklist (blank) | `1DjHCgKhh86CCwdzMf5bbcjYnOO-Y4faS` | https://drive.google.com/file/d/1DjHCgKhh86CCwdzMf5bbcjYnOO-Y4faS/view |

Folders: Procedures `1-NjzSQxTsbXqlOhbK7ptZzg1H5G2ntdh` · Checklists `1aNp0s5gGqq6B_SjxpAyCU3O-IkzUFPkp`.

**NGC-EST-1 note:** One-page HCP-style Pass/Flag/Fail form (Rev. 2026-09-05). Tech fills after diagnosis and hands to Admin for quoting / additional-work authorization.

## Role split (bots must respect)

- **Technician owns:** inspection, diagnosis, measurements, root cause, repair/install, part ID/compatibility, reasonable labor-time estimate, verification, tech QC, technical HCP notes, reporting findings/status.
- **Admin owns:** customer admin comms, approved-vendor search/quotes, price/availability/shipping, estimate formation + customer authorization, whiteboard/HCP admin control, admin scheduling follow-up.
- **Management owns:** priority/assignments, pricing policy/concessions, major repair auth, escalated technical decisions, performance/training, policy exceptions.

## Work classes

- **Main Job** — customer complaint / principal reason cart is here. Primary priority.
- **Required associated operation** — belongs with the Main Job estimate (adjustments, checks, road test, programming, etc.).
- **Courtesy inspection** — separate from Main Job; not automatic authorization to repair.
- **Additional work discovered during repair** — found mid-approved Main Job; requires stop + Admin/customer authorization (§12).

## §11 Estimate support (for Admin quoting)
Tech must estimate the **complete** corrective procedure, not only the part swap:

1. Cause  
2. Correction  
3. Parts/materials/hardware  
4. Labor operations (each needed step)  
5. Estimated labor time (access, corrosion, seized hardware, electrical, programming, calibration, bleeding, alignment, charging, controller/BMS, reassembly, functional + road test as applicable)  
6. Additional findings (separate when applicable)  
7. Safety classification for newly discovered conditions  

**Principle:** e.g. tie-rod-end includes toe/alignment check, adjustment, and road test.

Shop form: **NGC-EST-1** (Job Report Checklist for Estimating) — tech fills and hands to Admin.

## §12 Additional work / authorization

When unexpected work appears during an approved Main Job (not courtesy items):

STOP affected work → document/photo → identify parts → classify safety YES/NO → estimate added labor → notify Admin → Admin gets customer auth / Management direction → continue only after approval.

Minimum to Admin: (1) condition, (2) added parts, (3) safety YES/NO, (4) added labor time.

## Related existing Drive procedures (do not replace)

- Standard Diagnosing Test Process (`1gfkVp3OrMwa2KdL066m9PvYinp4JflVN`)
- Motor Test Procedure, Battery Testing Policy
- Driver / Shop Tech Assistant SOP `NGC-OPS-DRIVER-09032026R0` (`13ZJ9FxUQFD_d9yvVRfr6Ae2xE9P6hsk2`) — transport role; not this full technician SOP
## Bot routing notes

- Shop / Front Desk / Parts operate under this role split for estimates and parts handoff.
- Diagnostics / CartScope stay evidence-first; labor quotes and customer authorization still go through Admin after tech report (NGC-EST-1 or equivalent HCP notes).
- Do not invent parts prices or promise customer authorization from tech findings alone.

## Bay cheat sheet

Quick-reference required job sequence for the shop bay. [Download the Technician 9 Steps cheat sheet PDF](assets/technician_9_steps_cheat_sheet.pdf).

Drive Procedures file id: `1nrIWVY3khb_3-AXBV0ufqkv_KF5qzP0h`

**Core standard:** Test before replacement · Document before assumption · Verify before completion

### Required technician sequence

1. **REVIEW** — Confirm the customer complaint, job notes, and what is authorized before touching the cart.
2. **INSPECT** — Do the courtesy / visual check. Note safety items separately from the main job.
3. **DIAGNOSE** — Test first. Capture meter readings, fault codes, and evidence before guessing parts.
4. **REPORT** — Tell Admin what you found, parts needed, safety yes/no, and labor time.
5. **REPAIR** — Do only authorized work. Main job first, then required related work.
6. **VERIFY** — Road-test / function-check so the complaint is fixed and the cart is safe.
7. **QC** — Run technician self-QC. Catch misses before the cart leaves the bay.
8. **DOCUMENT** — Write clear Housecall Pro notes: complaint, tests, evidence, repair, verification.
9. **COMPLETE** — Job is done only when review → complete is finished — not just because a part was swapped.
