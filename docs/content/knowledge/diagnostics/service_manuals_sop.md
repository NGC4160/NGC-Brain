# Library — service manuals, parts manuals, and diagrams

**Last verified:** 2026-09-06  
**Owner:** Diagnostics (reports to Chief). Ryan approves every new item before it enters the Library.

One page. The **Library** is Neighborhood Golf Carts’ collection of **service manuals + parts manuals + diagrams**. This is how we find one while diagnosing, get Ryan’s yes, and file it so the next job can use it.

## Source of truth

- **Live files:** NGC985 Google Drive → **Manuals** folder ([open in Drive](https://drive.google.com/drive/folders/1-1QqJQh4UojQEERawwpfEjKYOor2VMuR)), brand folders EZGO / Club Car / Yamaha / Other.
- **Catalog / board:** NGC Manuals board (same brand split). Use with Drive — do not treat this brain as a substitute for the original manufacturer PDF.
- **Local catalog snapshot:** `/workspace/ngc-manuals/` (refresh when Drive Manuals change). Snapshot is a lookup aid only; Drive is still the live Library.

## 1. Search while diagnosing (in this order)

1. **On file first** — Drive Manuals (Library), NGC Manuals board/catalog, and CartScope wire pictures / checklists already in the shop.
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
2. Update the NGC Manuals board / catalog so the next search finds it.
3. Refresh `/workspace/ngc-manuals/` when the Drive Manuals set changes.
4. Link it for CartScope and Diagnostics on future jobs (wire pictures, checklists, case notes — no customer private data in this brain).

## 4. Hard rule — no auto-publish

Do **not** auto-publish unverified web PDFs as shop standard operating procedure. A downloaded file is a **candidate** until Ryan approves it into Drive Manuals (the Library).

## Related

- Diagnostics library rules: [`README.md`](README.md)
- CartScope product rules (manuals on file + approval): [`../06_systems/cartscope.md`](../06_systems/cartscope.md)
- Drive Procedures (shop test process): [Procedures folder](https://drive.google.com/drive/folders/1-NjzSQxTsbXqlOhbK7ptZzg1H5G2ntdh)
