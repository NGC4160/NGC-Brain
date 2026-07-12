# Adding SOPs to the DMS

The DMS runs shop work from a central **SOP registry**. Every procedure on file — now and later — should be registered here so staff can open or run it from **SOPs** (`#/sops`).

## Registry location

| Path | Purpose |
|------|---------|
| `src/sops/types.ts` | Schema (`SopDefinition`, steps, checklist, runtime) |
| `src/sops/catalog/index.ts` | Built-in SOPs shipped with the app |
| `src/sops/registry.ts` | Load catalog + custom SOPs, checklist runs |
| `knowledge/` | Source-of-truth narrative docs (optional `sourceDoc`) |

## Runtime types

| `runtime` | Behavior |
|-----------|----------|
| `module` | Links to a live DMS screen (`modulePath`, e.g. `/intake`, `/qc`) |
| `checklist` | Runnable checklist on `#/sops/:id` (stored in localStorage) |
| `policy` | Guide + link into Jobs/Board/Intake where the rule is enforced |
| `reference` | Steps/knowledge only until a module exists |

## Add a future SOP (checklist — no new page required)

1. Append a `SopDefinition` in `src/sops/catalog/index.ts`
2. Add it to the `SOP_CATALOG` array
3. Set `runtime: 'checklist'` and fill `checklist: [...]`
4. Set `accessRoles` / `ownerRoles`
5. Ship — it appears on the SOPs hub immediately

Example:

```ts
export const myNewSop: SopDefinition = {
  id: 'battery-watering',
  title: 'Battery Watering SOP',
  shortTitle: 'Watering',
  description: 'Weekly flooded battery watering checks.',
  ownerRoles: ['technician'],
  accessRoles: ['technician', 'service-manager', 'owner'],
  status: 'active',
  runtime: 'checklist',
  modulePath: '/sops/battery-watering',
  tags: ['battery', 'maintenance'],
  lastVerified: '2026-07-12',
  steps: [{ id: 'prep', title: 'Prep', summary: 'PPE and distilled water ready.' }],
  checklist: [
    { id: 'ppe', label: 'PPE on', required: true },
    { id: 'levels', label: 'Water levels topped', required: true },
  ],
}
```

## Add a future SOP (full workflow module)

1. Register with `runtime: 'module'` and `modulePath: '/your-route'`
2. Build the page under `src/pages/` and wire `App.tsx` + `ROLE_MODULES`
3. Keep steps/scripts in the catalog so the SOPs hub stays the index

## SOPs on file today

| ID | Runtime | Screen |
|----|---------|--------|
| `customer-intake` | module | `#/intake` |
| `repair-intake-checklist` | checklist | `#/sops/repair-intake-checklist` |
| `pickup-delivery` | policy | Intake |
| `deposit-gates` | policy | Jobs / Board |
| `job-assignment` | module | Board |
| `shop-qc` | module | `#/qc` |
| `shop-workflow` | reference | `#/sops/shop-workflow` |
| `shop-whiteboard` | reference | Board + knowledge doc |

## Add on-device (no deploy)

Owner / Service Manager → **Settings → SOPs on file → Add checklist SOP**. Saved to `localStorage` (`ngc-custom-sops-v1`) and appears on the hub immediately. Prefer catalog entries for shop-wide permanent procedures.

## Authority

When policies conflict: staff confirmation → `knowledge/` → SOP catalog → legacy Drive docs. Never quote discontinued mobile SOPs.
