# Architecture

This dashboard is built as a **modular, config-driven** React app. Each feature area is a self-contained module registered in central config.

## High-level layout

```
┌─────────────────────────────────────────────────┐
│  Sidebar (nav from app.config.ts)               │
├─────────────────────────────────────────────────┤
│  Page (Dashboard | Agent Input | Resources …)   │
│    └── Components + hooks                       │
│         └── useAppStore (shared state)           │
└─────────────────────────────────────────────────┘
```

## Key files

| File | Purpose |
|------|---------|
| `src/config/app.config.ts` | Nav modules, KPI definitions, categories, feature flags |
| `src/types/index.ts` | All shared TypeScript interfaces |
| `src/hooks/useAppStore.ts` | App state, KPI computation, localStorage persistence |
| `src/data/resources.json` | External file links (manuals, SOPs, vendor docs) |
| `src/data/mockData.ts` | Seed job data and static KPI placeholders |

## Adding a new sidebar module

1. **Define the route** in `src/App.tsx`:
   ```tsx
   <Route path="/my-module" element={<MyModulePage />} />
   ```

2. **Register in nav** — add to `navModules` in `src/config/app.config.ts`:
   ```ts
   {
     id: 'my-module',
     label: 'My Module',
     path: '/my-module',
     icon: 'Package',  // must exist in Sidebar iconMap
     enabled: true,
     description: 'What this module does',
   }
   ```

3. **Add the icon** (if new) to `iconMap` in `src/components/layout/Sidebar.tsx`.

4. **Create the page** at `src/pages/MyModulePage.tsx`.

5. **Extend types** in `src/types/index.ts` if the module introduces new data shapes.

6. **Wire state** — use `useApp()` from `@/context/AppContext` or extend `useAppStore` if the module needs shared persistence.

## Adding a new KPI

1. Add a definition to `kpiDefinitions` in `src/config/app.config.ts`:
   ```ts
   {
     id: 'new-kpi',
     label: 'My KPI',
     description: 'What it measures',
     format: 'number', // 'number' | 'currency' | 'decimal'
   }
   ```

2. Compute the value in `computeKpis()` inside `src/hooks/useAppStore.ts` and return a matching `KpiValue` object.

3. The dashboard automatically renders new KPIs — no page changes needed.

## Enabling a future module

Stub modules (Inventory, Customers, etc.) have `enabled: false` in `navModules`. To ship one:

1. Build the page component.
2. Add the route in `App.tsx`.
3. Set `enabled: true` on the nav entry.

## Swapping localStorage for an API

The store layer is isolated in `useAppStore.ts`. To connect a backend:

1. Replace `loadState()` / `saveState()` with API fetch/mutate calls.
2. Keep the same `AppState` shape from `src/types/index.ts`.
3. Add async loading states as needed in `AppProvider`.

Suggested folder for API layer: `src/services/api.ts`.

## Feature flags

`featureFlags` in `app.config.ts` controls optional behavior (dark mode, max pinned resources, showing future nav items). Extend this object for toggles without code branches scattered across the app.

## Module checklist

When adding any new module, ensure:

- [ ] TypeScript types defined
- [ ] Nav entry in config (with `enabled` flag)
- [ ] Route registered
- [ ] Empty state UX
- [ ] Responsive layout (tablet-friendly)
- [ ] Documented in this file if non-obvious
