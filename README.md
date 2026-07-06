# Golf Cart Repair Dashboard

Operations dashboard for **Neighborhood Golf Carts** — KPIs, agent/shop inputs, service manuals, and an expandable module architecture.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm run build    # production build
npm run preview  # preview production build
```

## Features

- **Dashboard** — 8 KPI cards with date filtering, revenue chart, active jobs, pinned manuals, recent activity
- **Agent Input** — repair intake, status updates, parts used, time logs, quick notes (persisted in localStorage)
- **Manuals & Files** — searchable resource library with categories, tags, and pin-to-dashboard
- **Jobs** — full repair order table with status filter
- **Future modules** — Inventory, Customers, Scheduling, Invoicing (stubbed in nav)

## Project structure

```
src/
├── config/app.config.ts   # KPI definitions, nav modules, feature flags
├── data/
│   ├── mockData.ts        # Sample jobs + static KPI values
│   └── resources.json     # Service manuals & file links (edit this!)
├── types/index.ts         # Shared TypeScript interfaces
├── hooks/useAppStore.ts   # State + KPI calculations + localStorage
├── pages/                 # Route-level views
└── components/            # Reusable UI
docs/
├── ARCHITECTURE.md        # How to add modules and KPIs
└── ADDING_RESOURCES.md    # How to add manuals without code changes
```

## Customization

| What | Where |
|------|-------|
| Business name | `src/config/app.config.ts` |
| KPIs | `src/config/app.config.ts` → `kpiDefinitions` |
| Manuals & files | `src/data/resources.json` |
| Nav / modules | `src/config/app.config.ts` → `navModules` |
| Sample jobs | `src/data/mockData.ts` |

## Data persistence

Jobs, agent submissions, and pin preferences are stored in **localStorage** under `golf-cart-dashboard-state`. The structure is ready to swap for Supabase, Firebase, or a REST API — see `docs/ARCHITECTURE.md`.

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS
- React Router
- Recharts
- Lucide icons

## Docs

- [Architecture & extending the app](docs/ARCHITECTURE.md)
- [Adding service manuals](docs/ADDING_RESOURCES.md)
