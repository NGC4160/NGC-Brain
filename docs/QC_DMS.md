# Shop QC Form — DMS Integration

The Shop QC completion form is built into the NGC DMS (React + Express + SQLite).

## Where to find it

| Surface | Path |
|---------|------|
| DMS nav | **QC Form** (`#/qc`) |
| Status board | **Complete QC form** button on QA / In Repair cards |
| Deep link | `#/qc?workOrderId=HCP-17342` or `#/qc?job=17342` |

## Run on GitHub Pages (default)

Open **https://ngc4160.github.io/NGC-Brain/#/qc** — no local server required.

1. Select a job from the dropdown (or filter by customer last name) — fields autofill from the board
2. Complete the checklist and upload photos/videos
3. Add notes under any of the 7 safety inspection points as needed
4. Click **Save QC Form**
5. Browser saves `{job#}_{LastName}.zip` (download, or direct to a folder on Chrome — tap **QC forms folder** once)
6. Certified QC on a job in **QA** moves it to **READY** on the status board (saved on that device)

## Run locally (optional — server archive)

```bash
npm run shop
```

When the local API is running, saves also go to the repo `QC forms/` folder and SQLite.

- **QC Form:** http://127.0.0.1:5173/#/qc
- Status board: http://127.0.0.1:5173/#/board

See [SHOP_DMS_SETUP.md](SHOP_DMS_SETUP.md) for office PC setup.

## Save behavior

1. Tech completes checklist and uploads photos/videos (no limit)
2. **Job #** and **customer last name** are required
3. Click **Save QC Form**
4. Creates `{job#}_{LastName}.zip` with `form.json`, `summary.txt`, and `media/*`
5. **Pages:** downloads zip (or saves to a folder you pick in Chrome)
6. **Local API:** also writes to repo `QC forms/` and SQLite
7. If certified and job is in **QA**, status moves to **READY** on the board

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/qc/context?job=` or `?workOrderId=` | Pre-fill from work order |
| POST | `/api/qc/save` | Multipart: `payload` JSON + `media` files |
| GET | `/api/qc/submissions` | Recent QC saves |
| GET | `/api/qc/submissions/:jobNumber/latest` | Latest QC for a job |

## Privacy

`QC forms/` is gitignored — contains customer last names and job media. Back up via Google Drive or shop file server, not git.
