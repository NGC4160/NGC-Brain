# Birdhouse Print Shop

Local ops app for a 3D-printed birdhouse side business.

**Status:** Phase 0 scaffold + usable Phase 1 starter  
**Plan:** [BUILD_PLAN.md](BUILD_PLAN.md)

## What it does

- Products & variants (SKU, price, est. grams / hands-on labor hours)
- Materials (filament + hardware) with reorder alerts
- Manual orders (Etsy/Facebook/Local)
- Production board with status moves
- Auto filament/hardware deduction when a job moves to **Finishing**
- Estimated margin on open orders

## Run locally

This app lives **inside the NGC-Brain git repo**, not in your home folder.

```bash
# 1) Go to your clone of NGC-Brain (adjust path if different)
cd ~/NGC-Brain   # or wherever you cloned it

# 2) Use the branch that has this app (until PR #47 is merged)
git fetch origin
git checkout cursor/birdhouse-print-shop-mvp-838f
git pull origin cursor/birdhouse-print-shop-mvp-838f

# 3) Enter the app folder and start it
cd tools/birdhouse-print-shop
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m app.main
```

Open [http://127.0.0.1:8787](http://127.0.0.1:8787).

If `cd tools/birdhouse-print-shop` fails, you are not in the NGC-Brain repo root yet (`pwd` should end with `NGC-Brain`).

SQLite DB path: `data/birdhouse.db` (created on first launch, seeded with sample catalog).

## Text a demo link to a friend

### Permanent / month-long link (recommended)

For a friend to use it for ~a month: host on **Render Starter + disk** (~$7–10/mo) so it stays awake and keeps their data.

See **[DEPLOY.md](DEPLOY.md)**.

### Temporary link (laptop must stay awake)

```bash
cd tools/birdhouse-print-shop
./share.sh
```

Copy the `https://….trycloudflare.com` URL. Closing the terminal kills the link.

## Backup

Copy `data/birdhouse.db` anywhere. That’s the whole shop database.

## Out of scope (for now)

Etsy API, OctoPrint control, accounting sync, multi-user auth.
