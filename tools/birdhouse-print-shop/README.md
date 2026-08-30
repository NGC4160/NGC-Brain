# Blake's Birdhouses

Military-themed local ops app for a 3D-printed birdhouse side business.

**Not NGC shop process.** This folder stays in NGC-Brain as the only copy of Blake’s Print project. NGC-Brain **no longer runs** Birdhouse GitHub Actions (`birdhouse-desktop.yml` / `birdhouse-pages.yml` were unused by Command Center / shop morning-sync). Build or deploy from this folder if Blake needs a new package.

**Status:** Browser web app + Mac/Windows desktop packaging  
**Plan:** [BUILD_PLAN.md](BUILD_PLAN.md)  
**Web app:** [WEB.md](WEB.md)  
**Desktop handoff:** [DESKTOP.md](DESKTOP.md)  
**Cloud hosting (optional FastAPI):** [DEPLOY.md](DEPLOY.md)

## Open in a browser

**https://ngc4160.github.io/NGC-Brain/birdhouse/**

Share that URL. No install. Sample missions: **Kayla**, **Elliot**, **Emmet**. Shop data stays on that device. To use phone and computer, export a backup in **Settings** and restore it on the other device — see [WEB.md](WEB.md).

## Product form

- **Web:** GitHub Pages link above
- **Windows:** `BlakesBirdhouses.exe`
- **Mac:** `BlakesBirdhouses-macOS.zip` → `BlakesBirdhouses.app`

See **[WEB.md](WEB.md)** and **[DESKTOP.md](DESKTOP.md)**.

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
