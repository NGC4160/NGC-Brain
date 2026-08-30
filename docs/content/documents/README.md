# NGC Documents (Command Center)

**Publish output — do not edit files in this folder as a second copy.**

Structured home for **printable forms, scorecards, and working documents** in the Command Center. Copies here are generated from [`external_docs/templates/`](../../external_docs/templates/) (canonical hiring / ops / counseling forms) and selected `knowledge/` guides.

**Hub (after deploy):** `documents/index.html`  
**Catalog (what gets copied):** [`scripts/documents_catalog.py`](../../scripts/documents_catalog.py)  
**Canonical templates:** `external_docs/templates/` — edit those, then rebuild.

## Categories

| Category | For |
|----------|-----|
| Hiring | Phone screens, shop evals |
| Team & HR | Counseling, roles |
| Operations | Shop checklists, floor tools |
| Customer-facing | Care guides, quote templates |
| Finance & admin | Deposit / billing helpers |

## Add a document (present or future)

1. Put the file in `external_docs/templates/<category>/` (or `knowledge/` for guides).
2. Append an entry to `DOCUMENTS` in `scripts/documents_catalog.py`.
   - Ready now → `"status": "active"` + `"source": "..."`
   - Not built yet → `"status": "planned"` (shows dashed card in the hub)
3. Rebuild:

```bash
python3 scripts/build_command_center.py
```

4. Commit `docs/documents/` (catalog + copies) with your change.

## Featured cards

Set `"featured": True` on an active doc to pin it on the Command Center **Documents** zone (in addition to the hub).
