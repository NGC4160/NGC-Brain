# Legacy Pricebook Cleanup

**Last verified:** 2026-06-28  
**Owners:** Ryan (approve) · Christine (HCP + QBO clicks)  
**Time:** ~45 min one-time  
**Audit checklist:** `knowledge/.generated/legacy_pricebook_audit.md` (regenerate with `./scripts/admin_bot/run_legacy_audit.sh`)

---

## Why

NGC is **shop-only**. Legacy mobile diagnostics, trip charges, and discontinued **NGC Conversion** lithium SKUs are still active in Housecall Pro and QuickBooks. Christine can accidentally quote or book them.

**Active jobs check:** No open jobs reference these line items (safe to deactivate).

---

## What to deactivate

| Group | Count (HCP) | Examples |
|-------|-------------|----------|
| Mobile / trip | 13 | Mobile Service Call, Trip Charges, On-Site Diagnostics |
| NGC Conversion | 7 | `3.0-NGC Lithium Conversion…`, TEST PARTIAL KIT |
| Future sales | 1 | Golf Cart Sales Deposit |
| **QBO-only** | 2 | 2011 EZGO TXT, 2022 Club Car Tempo |

**Review first (do not deactivate until Ryan confirms):**

| Item | Question |
|------|----------|
| `Shop - 0.5-Inspection Service Call` | Still used for in-shop inspections? |
| `3.0- NGC Infotainment System Installation` | Still offered? |

Full row-by-row list with UUIDs → run the audit script.

---

## Replace-with cheat sheet

| Legacy | Current substitute |
|--------|-------------------|
| Mobile diagnostic ($174–$229) | **`1.0 - Golf Cart Diagnostic & Inspection`** — $179 in-shop |
| Trip charges | **None** — free P&D within 40 mi North Shore; **$99** South Shore or outside 40 mi |
| `3.0-NGC Lithium Conversion, 48v…` | **`6.0- 48V Professional Lithium Battery Conversion Kit Installed`** — $2,799 |
| `3.0-NGC Lithium Conversion, 36v…` | **`6.0- 36V Professional…`** — $2,599 |
| `3.0-NGC MINI…` | **`6.0- 48V MINI Professional…`** — $2,799 |
| `3.0- NGC Lithium Conversion, 72V…` | **`6.0- 72V Professional…`** — $3,299 |
| TEST PARTIAL KIT | Correct **6.0-** Professional SKU for voltage |

Policy source: [lithium_conversions.md](../02_products/lithium_conversions.md) · [archive/legacy_mobile.md](../archive/legacy_mobile.md)

---

## Christine — Housecall Pro (30 min)

### Before you start

1. Open `knowledge/.generated/legacy_pricebook_audit.md` (or print it)
2. Optional: create category **`ZZZ — Inactive (Do Not Use)`** under Price Book

### Per legacy service (21 items)

1. **Settings → Price Book** (or My Apps → Price Book)
2. Search the **exact service name** from the audit
3. Open the service
4. **Online Booking → OFF** (most are already off)
5. **Move** to `ZZZ — Inactive` category *or* **Delete** if Ryan approves (no open jobs use these)
6. Check the box on your audit row

**Search terms** (run each search, deactivate all hits):

- `mobile`
- `trip charge`
- `on-site`
- `NGC Lithium Conversion`
- `TEST PARTIAL`
- `Bedico`
- `service area`
- `Golf Cart Sales Deposit`

### Do not delete

- **`1.0 - Golf Cart Diagnostic & Inspection`** (no “Mobile” in name) — this is the **current** $179 shop diagnostic
- Any **`6.0-`** Professional lithium kit

---

## Christine — QuickBooks Online (15 min)

1. **Settings → Products and services**
2. For each row in the audit **QBO section** (~26 items):
   - Open item → **Make inactive**
3. QBO-only cart listings (not in HCP):
   - `2011 EZGO TXT 48V`
   - `2022 Club Car Tempo`
4. Also inactivate duplicate **NGC Lithium Conversion Kit** part SKUs under Electrical/Accessories if listed

**Do not inactivate:** Professional Kit lines, shop diagnostic, current PM services.

---

## Ryan — verify (5 min)

After Christine finishes:

```bash
# Re-export HCP pricebook CSV to external_docs/exports/pricebook/
./scripts/sync/run_ingest.sh
./scripts/admin_bot/run_legacy_audit.sh
```

**Pass criteria:**

- `knowledge/.generated/sync_manifest.json` → `legacy_item_count: 0`
- HCP search `mobile` returns only inactive/deleted items
- Test quote: lithium job pulls **6.0- Professional** SKU, not 3.0-NGC

Log completion in [improvement_backlog.md](../09_daily_ops/improvement_backlog.md).

---

## API note

HCP Public API lists pricebook services but **deactivation is UI-first**. Do not delete via API without testing — use Price Book UI for this cleanup.

---

## Related

- [archive/legacy_mobile.md](../archive/legacy_mobile.md) — policy archive
- [ngc_admin_bot_spec.md](ngc_admin_bot_spec.md) — deposit alerts (separate automation)
- [pricebook_reference.md](../03_services/pricebook_reference.md) — current categories
