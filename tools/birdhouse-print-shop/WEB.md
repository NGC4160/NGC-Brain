# Blake's Birdhouses — web app

Browser version of the print-shop MVP. Same workflow as the desktop app: dashboard, production board, orders, products, materials, settings.

## Live URL

**https://ngc4160.github.io/NGC-Brain/birdhouse/**

Open that link on a phone or computer. No install. Sample missions: **Kayla**, **Elliot**, **Emmet**.

Data stays in **this browser** (localStorage). It is not synced to the desktop SQLite file. Reset sample missions from **Settings**.

## How it deploys

GitHub Actions copies `tools/birdhouse-print-shop/web/` to the `gh-pages` branch at `/birdhouse`.

- Workflow: [`.github/workflows/birdhouse-pages.yml`](../../.github/workflows/birdhouse-pages.yml)
- Trigger: push to `main` (or this feature branch) when web files change, or **Actions → Deploy Birdhouse Web → Run workflow**

## Local preview

```bash
cd tools/birdhouse-print-shop/web
python3 -m http.server 8788
# open http://127.0.0.1:8788/
```

## Desktop / FastAPI (unchanged)

The original localhost/desktop app is still at `python -m app.main` — see [README.md](README.md) and [DESKTOP.md](DESKTOP.md).
