# Neighborhood Golf Carts Business Brain

Agent-readable knowledge base for Neighborhood Golf Carts (NGC).

This folder is the operational source of truth for AI assistants answering questions about services, service area, scheduling, and policies. Markdown files here feed `llms.txt`, `llms-full.txt`, and JSON-LD generation via `scripts/generate.py`.

## Structure

| Path | Contents |
|------|----------|
| `index.md` | Quick orientation for agents |
| `company/` | Story, team, and positioning |
| `services/` | One file per service line |
| `operations/` | Pickup/delivery, service area, workflow |
| `customer/faq.md` | Citation-ready FAQ |
| `contact.md` | Phone, booking, and contact channels |

## Syncing from your desktop

If you maintain a copy on your local machine, import it into this repo:

```bash
./scripts/import-desktop-brain.sh
python3 scripts/generate.py
```

Default source path: `~/Desktop/NeighborhoodGolfCartsBusinessBrain`

## Maintenance

- Update markdown when services, pricing, or policies change
- Run `python3 scripts/generate.py` after edits
- Deploy regenerated `public/` files to ngcgolfcarts.com
