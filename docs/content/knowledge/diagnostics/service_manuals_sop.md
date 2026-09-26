# Library — service manuals, parts manuals, and diagrams

**Last verified:** 2026-09-26  
**Owner:** Diagnostics (reports to Chief). Ryan approves every new item before it enters the Library.

One page. The **Library** is Neighborhood Golf Carts’ collection of **service manuals + parts manuals + diagrams**. This is how we find one while diagnosing, get Ryan’s yes, and file it so the next job can use it.

## Source of truth

- **Live files:** NGC985 Google Drive → **Manuals** folder ([open in Drive](https://drive.google.com/drive/folders/1-1QqJQh4UojQEERawwpfEjKYOor2VMuR)), brand folders EZGO / Club Car / Yamaha / Other / Evolution / Tracker / Tomberlin / GEM.
- **Redacted Brain catalog:** [`library_catalog.md`](library_catalog.md) — QC-passed titles, Drive ids, sources, wiring/fault flags. No customer names. No HCP job numbers.
- **Catalog / board:** NGC Manuals board (same brand split). Use with Drive — do not treat this brain as a substitute for the original manufacturer PDF.
- **Local catalog snapshot:** `/workspace/ngc-manuals/` (refresh when Drive Manuals change). Snapshot is a lookup aid only; Drive is still the live Library.

## 1. Search while diagnosing (in this order)

1. **On file first** — Drive Manuals (Library), [`library_catalog.md`](library_catalog.md), NGC Manuals board, and CartScope wire pictures / checklists already in the shop.
2. **Then legitimate online sources** — original equipment manufacturer manuals or other reputable technical publishers. Forums, random blogs, and unverified uploads are **not** shop truth.
3. **If still missing** — say so clearly. Offer to source a candidate. **Never invent a manual**, pinout, or procedure.

CartScope and Diagnostics follow the same order: shop files first, then legitimate online sources, then “missing — need approval to add.”

## 2. Approval (hard gate)

Nothing new enters the Library without **Ryan’s yes through Chief**.

The ask must name:

- **Title** of the manual or diagram
- **Source** (where it came from)
- **Year / make / model coverage**

Other bots do **not** add Library items on their own. Diagnostics may draft the ask and the candidate path; Chief brings it to Ryan.

## 3. After Ryan says yes

1. Store the file in the Drive **Manuals** folder (correct brand folder).
2. Update [`library_catalog.md`](library_catalog.md) (redacted) and the NGC Manuals board so the next search finds it.
3. Refresh `/workspace/ngc-manuals/` when the Drive Manuals set changes.
4. Link it for CartScope and Diagnostics on future jobs (wire pictures, checklists, case notes — no customer private data in this brain).

**Wiring extracts (standing, Ryan yes 2026-09-17 via Chief):** When no separate OEM wiring-only PDF exists, extract the wiring diagrams from the service manual (or OEM controller manual) and file that extract in the brand Drive folder. Catalog it as an extract — not a separate OEM wiring-only publication.

Do not invent pinouts from the extract. Use the OEM PDF. An extract covers only the model on the parent SM. **YDRA/YDRE wiring does NOT cover Yamaha Drive2.**

## 4. Hard rule — no auto-publish

Do **not** auto-publish unverified web PDFs as shop standard operating procedure. A downloaded file is a **candidate** until Ryan approves it into Drive Manuals (the Library).

## New-job manuals practice (Ryan, 2026-09-21)

**Confirmed 2026-09-21 by Ryan White via Chief.** A job counts as new as soon as it is created in Housecall Pro.

For **every** new job:

1. Attach the matching service manual and wiring diagrams to the Housecall Pro job.
2. Slack **Jesse Killian** (she/her) the print PDFs for the tech binders, titled **make/model/year**.
3. Add those manuals into CartScope. CartScope is a **public** repo — never add customer names or job numbers.

**Check-off** (private HCP job note): manuals attached, Jesse has binder prints, CartScope covered.

**Which copy:** When Drive has a manual saved more than once, use the copy on Diagnostics’ checked manual list. Prefer Library matches.

**Do not invent** a manual or substitute one for a different model or year. Tell Ryan via Chief when year/make/model is missing or the Library has no match.

**Standing yes (2026-09-21):** this binder-print Slack to Jesse (manual and wiring PDFs only) needs no per-send approval. Every other Slack to Jesse still needs Ryan’s yes via Chief first.

## Related

- Diagnostics library rules: [`README.md`](README.md)
- Redacted Library catalog: [`library_catalog.md`](library_catalog.md)
- CartScope product rules (manuals on file + approval): [`../06_systems/cartscope.md`](../06_systems/cartscope.md)
- Drive Procedures (shop test process): [Procedures folder](https://drive.google.com/drive/folders/1-NjzSQxTsbXqlOhbK7ptZzg1H5G2ntdh)
