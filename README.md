# NGC Brain — AI-friendly business kit for Neighborhood Golf Carts

Make **Neighborhood Golf Carts** discoverable, citable, and operable by AI assistants and agents.

This repository combines:

| Component | Purpose |
|-----------|---------|
| [`NeighborhoodGolfCartsBusinessBrain/`](NeighborhoodGolfCartsBusinessBrain/) | Agent-readable business knowledge (services, FAQ, operations) |
| [`config/business.yaml`](config/business.yaml) | Structured facts that drive generated web assets |
| [`public/`](public/) | Deployable `llms.txt`, `llms-full.txt`, `robots.txt`, `sitemap.xml` |
| [`schema/`](schema/) | JSON-LD for Organization and FAQ pages |
| [`AGENTS.md`](AGENTS.md) | Instructions for AI coding agents in this repo |

## Quick start

1. **Customize business knowledge** in `NeighborhoodGolfCartsBusinessBrain/` and `config/business.yaml`.

2. **Import from your desktop** (if you maintain a local copy):

```bash
./scripts/import-desktop-brain.sh
```

Default source: `~/Desktop/NeighborhoodGolfCartsBusinessBrain`

3. **Generate and validate:**

```bash
pip install -r requirements.txt
python3 scripts/generate.py
python3 scripts/validate.py
```

4. **Deploy** `public/` to https://www.ngcgolfcarts.com so these URLs work:

- `/llms.txt`
- `/llms-full.txt`
- `/robots.txt`
- `/sitemap.xml`

5. **Embed** `schema/*.jsonld` in your site templates.

See [docs/deployment.md](docs/deployment.md) and [docs/checklist.md](docs/checklist.md).

## Business brain folder

`NeighborhoodGolfCartsBusinessBrain/` is the knowledge base AI agents should read for operational context:

- `company/` — story, team, positioning
- `services/` — one markdown file per service line
- `operations/` — pickup/delivery, service area, workflow
- `customer/faq.md` — citation-ready FAQ
- `contact.md` — phone and booking

The generator concatenates these into `public/llms-full.txt` for single-fetch agent ingestion.

## Syncing your desktop folder

This cloud environment cannot read your local Desktop directly. To merge your desktop copy into the repo:

```bash
./scripts/import-desktop-brain.sh
# or specify a path:
python3 scripts/import-desktop-brain.py --source /path/to/NeighborhoodGolfCartsBusinessBrain --merge
python3 scripts/generate.py
```

Use `--merge` to combine desktop files with existing repo content instead of replacing it.

## Maintenance

- Edit brain markdown or `config/business.yaml` when services or policies change
- Run `python3 scripts/generate.py` after edits
- Review quarterly and test with prompts like “Who does golf cart repair near Covington LA?”
