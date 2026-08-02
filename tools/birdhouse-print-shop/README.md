# Birdhouse Print Shop

Local ops app for a 3D-printed birdhouse side business.

**Status:** Phase 0 scaffold + usable Phase 1 starter  
**Plan:** [BUILD_PLAN.md](BUILD_PLAN.md)

## What it does

- Products & variants (SKU, price, est. grams/hours)
- Materials (filament + hardware) with reorder alerts
- Manual orders (Etsy/Facebook/Local)
- Production board with status moves
- Auto filament/hardware deduction when a job moves to **Finishing**
- Estimated margin on open orders

## Run locally

```bash
cd tools/birdhouse-print-shop
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m app.main
```

Open [http://127.0.0.1:8787](http://127.0.0.1:8787).

SQLite DB path: `data/birdhouse.db` (created on first launch, seeded with sample catalog).

## Backup

Copy `data/birdhouse.db` anywhere. That’s the whole shop database.

## Out of scope (for now)

Etsy API, OctoPrint control, accounting sync, multi-user auth.
