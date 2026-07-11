# GitHub Pages — Project Open Links

**Policy:** Always open NGC projects via GitHub Pages.  
**Rule:** **Each project has its own Pages link** under `/projects/<slug>/`.

**Hub:** [https://ngc4160.github.io/NGC-Brain/projects/](https://ngc4160.github.io/NGC-Brain/projects/)  
**Last verified:** 2026-07-11

## How Ryan opens projects

1. Open the **hub**: https://ngc4160.github.io/NGC-Brain/projects/
2. Or bookmark the **specific project** link below
3. Do **not** rely on localhost or opening HTML from the repo

## Project links (one per project)

| Project | Open link |
|---------|-----------|
| **Projects hub** | [projects/](https://ngc4160.github.io/NGC-Brain/projects/) |
| **Ops Dashboard** | [projects/ops-dashboard/](https://ngc4160.github.io/NGC-Brain/projects/ops-dashboard/) |
| **Shop Board** | [projects/shop-board/](https://ngc4160.github.io/NGC-Brain/projects/shop-board/) |
| **Shop QC Form** | [projects/shop-qc/](https://ngc4160.github.io/NGC-Brain/projects/shop-qc/) |
| **Pickup / Delivery Inspection** | [projects/pickup-delivery/](https://ngc4160.github.io/NGC-Brain/projects/pickup-delivery/) |
| **Personnel Counseling Form** | [projects/personnel-counseling/](https://ngc4160.github.io/NGC-Brain/projects/personnel-counseling/) |
| **Repair Intake Checklist** | [projects/intake-checklist/](https://ngc4160.github.io/NGC-Brain/projects/intake-checklist/) |

Registry JSON: [`pages/projects/projects.json`](../../pages/projects/projects.json)

## Dashboard modules (not separate projects)

These live inside the ops dashboard SPA — use the **Ops Dashboard** project link, then navigate:

| Module | Path on dashboard site |
|--------|------------------------|
| Jobs | `/NGC-Brain/jobs/` |
| Invoicing | `/NGC-Brain/invoicing/` |
| Inventory | `/NGC-Brain/inventory/` |
| Resources | `/NGC-Brain/resources/` |
| Agent input | `/NGC-Brain/agent-input/` |

## Deploy notes (for agents)

1. Put the project at `pages/projects/<slug>/index.html`
2. Add hub + `projects.json` entries
3. Run `./scripts/pages/publish_projects.sh`
4. Confirm the **project** URL returns 200
5. Hand Ryan that URL — not only the site root

Source of truth for this policy: `.cursor/rules/ngc-github-pages.mdc`

## Related

- Systems overview: [`tools.md`](tools.md)
- Decision log: [`../09_daily_ops/decision_log.md`](../09_daily_ops/decision_log.md)
- Pages source: [`pages/README.md`](../../pages/README.md)
