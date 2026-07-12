---
name: ngc-morning-briefing
description: Run the NGC service manager morning briefing using knowledge/, sync_manifest.json, and improvement_backlog. Use when the user says morning briefing, start my day, shop priorities, or opens the day at Neighborhood Golf Carts.
---

# NGC Morning Briefing

## Steps

1. Read:
   - `knowledge/04_operations/shop_throughput.md`
   - `knowledge/.generated/shop_board.md`
   - `knowledge/.generated/deposit_alerts.md` (NGC Admin Bot — Christine queue)
   - `knowledge/09_daily_ops/improvement_backlog.md`
   - `knowledge/.generated/sync_manifest.json` (run sync skill first if missing)

2. Run `./scripts/sync/run_hcp_sync.sh` if shop board is stale (>24h); else `./scripts/sync/run_shop_board.sh` if only jobs.json is fresh

3. Use user's shop status if provided; otherwise ask for:
   - Carts in shop (make/model/issue/tech/day — no customer names)
   - Staff availability
   - Roy pickups/deliveries

4. Output (bullets, actionable by 8:30 AM):
   - Top 3 priorities (service manager lens)
   - Lithium jobs at risk of missing 2–3 day turnaround
   - Deposit / parts-order follow-ups
   - One item from improvement backlog P1
   - 1–2 proactive offers (pricebook cleanup, quote script, marketing, etc.)

5. Tone: direct, owner-to-owner

## Template

See `prompts/morning_briefing.md`

## Privacy

No customer PII in briefing logs or saved files
