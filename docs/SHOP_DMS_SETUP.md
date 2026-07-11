# Shop DMS — Office PC Setup

The DMS and **QC form work on GitHub Pages** with no install:

**https://ngc4160.github.io/NGC-Brain/#/qc**

On Chrome, tap **QC forms folder** once to save zips directly to your shop folder instead of Downloads.

---

Optional: run locally for server-side QC archive in the repo `QC forms/` folder.

## Requirements

- Node.js 20+ (`node -v`)
- This repo cloned on the office PC (or synced via GitHub Desktop)
- Chrome or Edge

## Start the shop DMS (every day)

From the repo root:

```bash
npm run shop
```

Or:

```bash
./scripts/start-shop-dms.sh
```

Wait for the browser to open, or go to:

| Page | URL |
|------|-----|
| **QC Form** (pin this) | http://127.0.0.1:5173/#/qc |
| Status board | http://127.0.0.1:5173/#/board |
| Dashboard | http://127.0.0.1:5173/ |

Leave the terminal window open while the shop is using the DMS. **Ctrl+C** stops it.

## Pin QC Form on the office PC

1. Start `npm run shop`
2. Open http://127.0.0.1:5173/#/qc
3. Chrome → **⋮** → **Save and share** → **Create shortcut…**
4. Name it **NGC QC Form** → check **Open as window** (optional) → Create
5. Drag the shortcut to the taskbar or shop iPad home screen

## First-time database (optional)

If jobs don’t appear, import HCP exports:

```bash
npm run import:hcp
```

Exports live in `external_docs/exports/hcp/` (sync from Drive or run `./scripts/sync/run_hcp_sync.sh` on a machine with `HCP_API_KEY`).

## QC saves

Completed QC forms save to:

```
QC forms/{job#}_{CustomerLastName}.zip
```

Back up this folder to Google Drive (`Management / Shop QC /`) — it is **not** in git.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| “QC save requires local API” | Run `npm run shop`, not the GitHub Pages URL |
| Port in use | Close other `npm run dev` windows; restart |
| Job not pre-filling | Enter job # manually; run `npm run import:hcp` |
| Blank board | Import HCP data or create jobs in **Jobs** |

## Related

- [QC_DMS.md](QC_DMS.md) — QC form behavior and API
- [ARCHITECTURE.md](ARCHITECTURE.md) — DMS overview
