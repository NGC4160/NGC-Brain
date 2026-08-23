# Birdhouse Print Shop — Build Plan

Local ops app for a 3D-printed birdhouse side business.  
**Not part of NGC golf-cart operations.**

## Goal

One machine-local app that answers:

1. What should I print today?
2. Do I have the filament/hardware?
3. Where is each order in production?
4. Did this order make money?

## Stack (v1)

| Layer | Choice | Why |
|---|---|---|
| Runtime | Python 3.11+ | Already used in this repo |
| API/UI | FastAPI + Jinja2 | Fast local web UI, no JS framework tax |
| DB | SQLite file (`data/birdhouse.db`) | Zero ops, single-file backup |
| Hosting | GitHub Pages static web + optional localhost FastAPI | Shareable URL; desktop still works |

Phase 2 options (not now): Tauri/Electron wrapper, Etsy API, OctoPrint hooks.

## Screens (ship in this order)

1. **Dashboard** — due orders, stuck jobs, low stock, open-order margin
2. **Products** — models + variants (size/color/SKU/price/est grams/labor hours)
3. **Materials** — filament + hardware on hand, reorder alerts
4. **Orders** — manual intake, line items, channel, due date
5. **Production Board** — kanban status moves; deduct materials on print complete

## Workflow

```
Draft → Queued → Printing → Finishing → Ready to Ship → Shipped
                                    ↘ Cancelled
```

## Implementation phases

### Phase 0 — Scaffold (this PR)

- [x] Project layout under `tools/birdhouse-print-shop/`
- [x] SQLite schema
- [x] Seed sample birdhouse products + filament
- [x] Runnable local server with 5 routes stubbed/working at MVP level
- [x] Settings: hourly rate, waste factor

### Phase 1 — Daily usable

- [ ] Create/edit products + variants
- [ ] Create/edit materials + adjust stock
- [ ] Create orders with line items
- [ ] Production board drag/or button status changes
- [ ] Auto material deduction when job → Finishing
- [ ] Margin panel on order detail (revenue − material − labor)

### Phase 2 — Speed

- [ ] Duplicate order
- [ ] Batch create jobs from order qty
- [ ] Printer name field + filter board by printer
- [ ] CSV export of orders/materials
- [ ] Backup button (copy SQLite file)

### Phase 3 — Integrations (only if volume justifies)

- [ ] Etsy order import (manual CSV first, API later)
- [ ] OctoPrint/Klipper status read-only
- [ ] Photo attachments for finished units

## Data model

See `schema.sql`.

### Entities

- `settings` — labor rate, waste %
- `products` / `variants`
- `materials`
- `orders` / `order_items`
- `jobs` — printable unit tied to an order item
- `material_uses` — actual consumption per job

## Pricing rules (v1)

```
material_cost = sum(actual_or_est_grams * (1 + waste%) / 1000 * cost_per_kg)
labor_cost    = sum(actual_or_est_hours * hourly_rate)
margin        = revenue - material_cost - labor_cost
```

`est_hours` is hands-on labor (finish/pack), not full printer runtime.  
Use estimates until a job records actuals.

## Explicit non-goals (v1)

- Multi-user auth/roles
- Cloud sync
- Full accounting / tax
- Live printer control
- 3D model viewer

## Definition of done (Phase 1)

You can run a real week of birdhouse orders without a spreadsheet:

- Enter 5 products and stock
- Enter orders from Etsy/local
- Move jobs across the board
- See filament drop
- See margin per order

## How to run

```bash
cd tools/birdhouse-print-shop
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m app.main
# open http://127.0.0.1:8787
```
