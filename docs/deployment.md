# Deployment guide

Deploy the generated files in `public/` to your website root.

## Prerequisites

1. Fill in real values in `config/business.yaml` (especially `deployment.base_url`, email, and social links).
2. Run `python3 scripts/generate.py`.
3. Confirm linked pages exist on your site (no 404s).

## Files to publish

| Source | Destination | Content-Type |
|--------|-------------|--------------|
| `public/llms.txt` | `https://yourdomain.com/llms.txt` | `text/plain` or `text/markdown` |
| `public/llms-full.txt` | `https://yourdomain.com/llms-full.txt` | `text/plain` or `text/markdown` |
| `public/.well-known/llms.txt` | `https://yourdomain.com/.well-known/llms.txt` | same as above |
| `public/.well-known/llms-full.txt` | `https://yourdomain.com/.well-known/llms-full.txt` | same as above |
| `public/robots.txt` | `https://yourdomain.com/robots.txt` | `text/plain` |
| `public/sitemap.xml` | `https://yourdomain.com/sitemap.xml` | `application/xml` |

## Schema markup

Copy JSON-LD from `schema/` into your HTML templates:

- `organization.jsonld` → homepage `<head>` as `<script type="application/ld+json">`
- `faq.jsonld` → FAQ page

The `description` in organization schema should match the blockquote summary in `llms.txt`.

## Server examples

### Nginx

```nginx
location = /llms.txt {
    default_type text/plain;
    add_header Cache-Control "public, max-age=3600";
}

location = /.well-known/llms.txt {
    default_type text/plain;
}
```

### Vercel / Netlify / Cloudflare Pages

Copy `public/` into your static site output directory, or symlink:

```bash
cp -r public/* ./dist/
```

### GitHub Pages

Place contents of `public/` in the publishing branch root or `/docs` folder depending on your Pages config.

## Verification checklist

After deploy:

1. `curl -I https://yourdomain.com/llms.txt` returns `200`
2. `curl https://yourdomain.com/robots.txt` includes `LLMs:` line
3. Ask ChatGPT, Claude, or Perplexity: "What does [Your Business] do?" and check accuracy
4. Re-run `python3 scripts/validate.py` locally after config changes

## Maintenance

- Update `config/business.yaml` when services, pricing, or URLs change
- Set `deployment.last_updated` and regenerate
- Review quarterly at minimum
