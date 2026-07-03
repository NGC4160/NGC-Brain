# NGC Brain — AI-friendly business kit

Make your business discoverable, citable, and operable by AI assistants and agents.

This repository is a **config-driven starter kit** that generates the files AI systems expect in 2026:

| Asset | Purpose |
|-------|---------|
| [`llms.txt`](public/llms.txt) | Curated business summary for LLMs ([llmstxt.org](https://llmstxt.org/)) |
| [`robots.txt`](public/robots.txt) | Allows AI crawlers and points to `llms.txt` |
| [`sitemap.xml`](public/sitemap.xml) | Canonical URL index |
| [`schema/*.jsonld`](schema/) | Structured data for Organization and FAQ |
| [`AGENTS.md`](AGENTS.md) | Instructions for AI coding agents in this repo |

## Quick start

1. **Edit your business details** in [`config/business.yaml`](config/business.yaml) — replace `https://example.com`, email, services, and FAQ with your real information.

2. **Generate assets:**

```bash
pip install -r requirements.txt
python3 scripts/generate.py
python3 scripts/validate.py
```

3. **Deploy** the [`public/`](public/) folder to your website root so these URLs work:

- `https://yourdomain.com/llms.txt`
- `https://yourdomain.com/robots.txt`
- `https://yourdomain.com/sitemap.xml`

4. **Embed schema** from [`schema/`](schema/) in your HTML templates (homepage + FAQ page).

See [docs/deployment.md](docs/deployment.md) for server examples and [docs/checklist.md](docs/checklist.md) for a full readiness checklist.

## What “AI-friendly” means

An AI-friendly business publishes accurate context in formats machines can read without scraping your entire site:

- **Discovery** — `llms.txt` tells assistants what you do and which pages matter
- **Permission** — `robots.txt` allows GPTBot, ClaudeBot, PerplexityBot, and similar crawlers
- **Structure** — JSON-LD schema gives knowledge graphs typed facts (name, services, FAQ)
- **Operability** — `AGENTS.md` helps coding agents work correctly in your repositories

This complements SEO; it does not replace clear page copy, fast pages, or good information architecture.

## Repository layout

```
config/business.yaml   # Single source of truth — edit this
scripts/generate.py    # Regenerates all outputs
scripts/validate.py    # Checks structure and flags placeholder URLs
public/                # Deploy to website root
schema/                # JSON-LD snippets for HTML embedding
docs/                  # Deployment guide and checklist
AGENTS.md              # Agent instructions for this repo
```

## Customization

Update these sections in `config/business.yaml`:

- `business` — name, description, contact, location
- `services` — what you offer with one-line descriptions
- `pages` — canonical site pages (paths must exist on your site)
- `faq` — citation-ready Q&A pairs
- `citation` — preferred name, canonical URL, statements you want quoted
- `deployment.base_url` — your production domain

After any change, regenerate and redeploy.

## Maintenance

- Update when positioning, pricing, services, or URLs change
- Review at least quarterly
- Run `python3 scripts/validate.py` before each deploy
- Test with prompts like “What does [Your Business] do?” in ChatGPT, Claude, or Perplexity

## License

Use and adapt freely for your business. Replace placeholder content before production deploy.
