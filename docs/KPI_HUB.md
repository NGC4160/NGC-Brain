# KPI Reporting Hub

Central place for every KPI the DMS tracks, filtered by role.

**Live:** https://ngc4160.github.io/NGC-Brain/#/kpi-hub

## Access

| Role | Visibility |
|------|------------|
| Ryan / Christine / Owner | Full executive library |
| Technicians | Shop ops + personal WIP / completions / labor logs |
| Drivers | Ready queue, deliveries, fleet accounts, on-time placeholder |
| Office | Same full library as Christine |

## Architecture

| Path | Role |
|------|------|
| `src/kpi/registry.ts` | KPI metadata (add future KPIs here) |
| `src/kpi/compute.ts` | Derive values from jobs / invoicing / extras / submissions |
| `src/kpi/thresholds.ts` | Admin-editable targets (localStorage) |
| `src/hooks/useKpiHub.ts` | Filters + role-scoped snapshots |
| `src/pages/KpiHubPage.tsx` | UI |

## Features

- Date range: Today / Week / MTD / QTD / YTD / Custom
- Search + category filter
- Status (green / yellow / red) vs target
- Trend vs prior comparable period
- Detail modal with sparkline history
- CSV export + print-to-PDF
- Threshold editing for service manager / owner

## Adding a KPI

1. Append a `KpiDefinitionMeta` in `registry.ts`
2. Add a `case` in `rawValue()` in `compute.ts`
3. Set `accessRoles` — executives always see everything
