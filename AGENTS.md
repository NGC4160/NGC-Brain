# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project purpose

This repository maintains AI-friendly business assets for NGC Brain. The single source of truth is `config/business.yaml`. Generated files live in `public/` (website root) and `schema/` (JSON-LD snippets).

## Commands

```bash
pip install -r requirements.txt
python3 scripts/generate.py
python3 scripts/validate.py
```

## Workflow

1. Edit `config/business.yaml` with real business details (URLs, email, services, FAQ).
2. Run `python3 scripts/generate.py` to regenerate outputs.
3. Run `python3 scripts/validate.py` before committing.
4. Deploy `public/` to the website root so `/llms.txt` and `/robots.txt` are live.
5. Embed `schema/*.jsonld` in matching HTML pages or your site template.

## Conventions

- Keep `llms.txt` factual and encyclopedic, not marketing copy.
- Every URL in generated files must resolve (no 404s).
- Update `deployment.last_updated` when regenerating for production.
- Do not hand-edit generated files in `public/` or `schema/`; change the config and regenerate.

## File map

| Path | Purpose |
|------|---------|
| `config/business.yaml` | Editable business facts and page list |
| `scripts/generate.py` | Generator for all AI-facing assets |
| `scripts/validate.py` | Basic structure and link checks |
| `public/llms.txt` | Primary AI discovery file (llmstxt.org spec) |
| `public/robots.txt` | Crawler rules including AI bots |
| `public/sitemap.xml` | Canonical URL index |
| `schema/organization.jsonld` | Organization schema for homepage |
| `schema/faq.jsonld` | FAQPage schema for FAQ content |

## Deployment notes

- Serve `llms.txt` as `text/plain` or `text/markdown` with HTTP 200.
- Mirror `llms.txt` at `/.well-known/llms.txt` (already generated).
- Replace `https://example.com` in config before production deploy.
