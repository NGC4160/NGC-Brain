# Shop QC Form — DMS Integration

The Shop QC completion form is built into the NGC DMS (React + Express + SQLite).

## Where to find it

| Surface | Path |
|---------|------|
| DMS nav | **QC Form** (`#/qc`) |
| Status board | **Complete QC form** button on QA / In Repair cards |
| Deep link | `#/qc?workOrderId=HCP-17342` or `#/qc?job=17342` |

## Run locally (required for save)

```bash
npm run shop
```

(`npm run dev:all` works too — `shop` also opens the QC form and ensures `QC forms/` exists.)

- **QC Form (pin this):** http://127.0.0.1:5173/#/qc
- Status board: http://127.0.0.1:5173/#/board
- API: http://127.0.0.1:3001

See [SHOP_DMS_SETUP.md](SHOP_DMS_SETUP.md) for office PC bookmark instructions.

GitHub Pages is **read-only** — QC save needs the local API.

## Save behavior

1. Tech completes checklist and uploads photos/videos (no limit)
2. **Job #** and **customer last name** are required
3. Click **Save QC Form**
4. Creates `QC forms/{job#}_{LastName}.zip` at the repo root containing:
   - `form.json` — full checklist
   - `summary.txt` — quick summary
   - `media/` — all uploads
5. Records submission in SQLite (`qc_submissions` table)
6. If certified and job is in **QA**, status moves to **READY** on the board

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/qc/context?job=` or `?workOrderId=` | Pre-fill from work order |
| POST | `/api/qc/save` | Multipart: `payload` JSON + `media` files |
| GET | `/api/qc/submissions` | Recent QC saves |
| GET | `/api/qc/submissions/:jobNumber/latest` | Latest QC for a job |

## Privacy

`QC forms/` is gitignored — contains customer last names and job media. Back up via Google Drive or shop file server, not git.
