# Birdhouse Print Shop

Local ops app for a 3D-printed birdhouse side business.

**Status:** MVP + Windows desktop packaging  
**Plan:** [BUILD_PLAN.md](BUILD_PLAN.md)  
**Desktop handoff (Mac + Windows):** [DESKTOP.md](DESKTOP.md)  
**Cloud hosting (optional):** [DEPLOY.md](DEPLOY.md)

## Product form

- **Windows friend:** `BirdhousePrintShop.exe` (Windows only — will not open on your Mac)
- **You on MacBook Air:** macOS `.app` zip

See **[DESKTOP.md](DESKTOP.md)**.

## Run from source (dev)

This app lives **inside the NGC-Brain git repo**, not in your home folder.

```bash
cd ~/NGC-Brain   # or wherever you cloned it
git fetch origin
git checkout cursor/birdhouse-print-shop-mvp-838f
cd tools/birdhouse-print-shop
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m app.main          # browser at http://127.0.0.1:8787
```

Desktop window (dev):

```bash
pip install -r requirements-desktop.txt
python -m app.desktop
```

## What it does

- Products & variants (SKU, price, est. grams / hands-on labor hours)
- Materials (filament + hardware) with reorder alerts
- Manual orders (Etsy/Facebook/Local)
- Production board with status moves
- Auto filament/hardware deduction when a job moves to **Finishing**
- Estimated margin on open orders

## Out of scope (for now)

Etsy API, OctoPrint control, accounting sync, multi-user auth, code signing.
