# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project purpose

This repository maintains AI-friendly business assets for **Neighborhood Golf Carts** (NGC). Business knowledge lives in `NeighborhoodGolfCartsBusinessBrain/`. Structured web facts live in `config/business.yaml`. Generated deployable files are in `public/` and `schema/`.

## Commands

```bash
pip install -r requirements.txt
./scripts/import-desktop-brain.sh   # optional: merge desktop folder
python3 scripts/generate.py
python3 scripts/validate.py
```

## Workflow

1. Edit `NeighborhoodGolfCartsBusinessBrain/` and/or `config/business.yaml`.
2. Optionally import from `~/Desktop/NeighborhoodGolfCartsBusinessBrain` with `./scripts/import-desktop-brain.sh --merge`.
3. Run `python3 scripts/generate.py` to regenerate outputs.
4. Run `python3 scripts/validate.py` before committing.
5. Deploy `public/` to https://www.ngcgolfcarts.com.
6. Embed `schema/*.jsonld` in matching HTML pages.

## Conventions

- Keep `llms.txt` factual and encyclopedic, not marketing copy.
- Every URL in generated files must resolve (no 404s).
- Update `deployment.last_updated` when regenerating for production.
- Do not hand-edit generated files in `public/` or `schema/`; change brain markdown or config and regenerate.

## File map

| Path | Purpose |
|------|---------|
| `NeighborhoodGolfCartsBusinessBrain/` | Agent-readable business knowledge base |
| `config/business.yaml` | Structured facts and page list |
| `scripts/generate.py` | Generator for all AI-facing assets |
| `scripts/import-desktop-brain.py` | Import desktop business brain folder |
| `scripts/validate.py` | Structure and link checks |
| `public/llms.txt` | Primary AI discovery file (llmstxt.org spec) |
| `public/llms-full.txt` | Full concatenated business brain for agents |
| `public/robots.txt` | Crawler rules including AI bots |
| `public/sitemap.xml` | Canonical URL index |
| `schema/organization.jsonld` | Organization schema for homepage |
| `schema/faq.jsonld` | FAQPage schema for FAQ content |

## Deployment notes

- Serve `llms.txt` as `text/plain` or `text/markdown` with HTTP 200.
- Mirror `llms.txt` at `/.well-known/llms.txt` (already generated).
- Replace `https://example.com` in config before production deploy.
