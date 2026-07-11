# GitHub Pages — Project Open Links

**Policy:** Always open NGC projects via GitHub Pages.  
**Canonical site:** [https://ngc4160.github.io/NGC-Brain/](https://ngc4160.github.io/NGC-Brain/)

**Last verified:** 2026-07-11

## How Ryan opens projects

1. Go to **https://ngc4160.github.io/NGC-Brain/**
2. Or use a direct route from the table below
3. Bookmark the home URL on phone/desktop for daily use

Do **not** rely on localhost or opening HTML files from the repo for day-to-day use.

## Live routes

| Open link | What it is |
|-----------|------------|
| [Dashboard home](https://ngc4160.github.io/NGC-Brain/) | Ops dashboard |
| [Jobs](https://ngc4160.github.io/NGC-Brain/jobs/) | Job board / jobs view |
| [Invoicing](https://ngc4160.github.io/NGC-Brain/invoicing/) | Invoicing module |
| [Inventory](https://ngc4160.github.io/NGC-Brain/inventory/) | Inventory module |
| [Resources](https://ngc4160.github.io/NGC-Brain/resources/) | Manuals & files |
| [Agent input](https://ngc4160.github.io/NGC-Brain/agent-input/) | Shop / agent intake inputs |
| [Intake checklist](https://ngc4160.github.io/NGC-Brain/docs/intake-checklist.html) | Static intake checklist |

## Deploy notes (for agents)

- Prefer the existing Pages workflow: `.github/workflows/deploy-pages.yml`
- Vite builds: set `VITE_BASE_PATH=/NGC-Brain/` and use `npm run build:pages` when available
- After shipping a new tool, add its row to **Live routes** above and confirm HTTP 200 on the public URL
- Source of truth for this policy: `.cursor/rules/ngc-github-pages.mdc`

## Related

- Systems overview: [`tools.md`](tools.md)
- Decision log: [`../09_daily_ops/decision_log.md`](../09_daily_ops/decision_log.md)
