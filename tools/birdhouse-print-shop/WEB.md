# Blake's Birdhouses — web app

Browser version of the print-shop MVP. Same workflow as the desktop app: dashboard, production board, orders, products, materials, settings.

## Live URL

**https://ngc4160.github.io/NGC-Brain/birdhouse/**

Open that link on a phone or computer. No install. Sample missions: **Kayla**, **Elliot**, **Emmet**.

Data stays on **this device** (localStorage). Phone and computer do not share a shop unless you move a backup file.

**Move the shop between phone and computer**

1. On the device that has the current shop: **Settings → Backup / Restore → Download backup**
2. Send that JSON file to the other device (AirDrop, Files, or email)
3. On the other device: **Settings → Backup / Restore → Choose backup file** (iPhone: Browse → Files)
4. Confirm replace — restore overwrites this device so orders are not duplicated

A bad file is rejected and the current device is left as-is. Live shop backups are **not** stored in the GitHub repo.

Reset sample missions (Kayla, Elliot, Emmet) from **Settings**. The desktop SQLite app is a separate data file.

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
