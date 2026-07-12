---
name: ngc-sync-exports
description: Sync HCP pricebook and QBO exports into knowledge/.generated/sync_manifest.json, detect pricebook drift vs knowledge/, and offer knowledge file updates. Use when the user says sync exports, refresh data, update from exports, or after uploading files to external_docs/exports/.
---

# NGC Sync Exports

## When to use

- User uploaded HCP pricebook or QBO exports
- User says "sync", "refresh exports", "update from pricebook"
- Monthly refresh workflow
- Before financial or pricing answers when data may be stale

## Steps

1. Run from repo root:
   ```bash
   ./scripts/sync/run_ingest.sh
   ```

2. Read `knowledge/.generated/sync_manifest.json`

3. Compare against:
   - `knowledge/02_products/lithium_conversions.md` — Professional SKU prices
   - `knowledge/03_services/shop_services.md` — diagnostic $179, pickup policy
   - `knowledge/archive/legacy_mobile.md` — legacy items should not appear in active quotes

4. Report:
   - Sync timestamp
   - Alerts from manifest
   - Any price or policy drift
   - Legacy item count still in pricebook

5. If drift found, offer to update `knowledge/` files (do not auto-edit without confirmation unless user says "update knowledge")

6. Never include customer PII from exports

## QBO live data

If QuickBooks MCP is connected, prefer live P&L over stale xlsx when user asks current numbers. Fall back to exports if MCP unavailable.

## Related

- `knowledge/10_automation/integration_playbook.md`
- `prompts/monthly_refresh.md`
