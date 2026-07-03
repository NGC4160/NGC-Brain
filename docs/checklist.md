# AI-friendly business checklist

Use this checklist to make your business discoverable and operable by AI systems.

## Discovery (can AI find and understand you?)

- [ ] `llms.txt` live at site root with H1, blockquote summary, and annotated page links
- [ ] `/.well-known/llms.txt` mirrors root file
- [ ] `robots.txt` allows major AI crawlers on public pages
- [ ] `robots.txt` includes `LLMs: https://yourdomain.com/llms.txt`
- [ ] `sitemap.xml` lists canonical URLs only
- [ ] No placeholder `example.com` URLs in production files

## Accuracy (will AI cite you correctly?)

- [ ] Organization JSON-LD on homepage matches `llms.txt` summary
- [ ] FAQ schema on FAQ page matches visible FAQ content
- [ ] Citation guidance section lists preferred name and canonical URL
- [ ] Every fact in `llms.txt` is supported on a linked page
- [ ] Contact email and location are current

## Operability (can agents work with you?)

- [ ] `AGENTS.md` in repositories agents may touch
- [ ] Public pages render without JavaScript for crawler fetches
- [ ] API docs linked if you offer integrations
- [ ] Clear service descriptions with concrete scope (not vague marketing)

## Governance

- [ ] Owner assigned for quarterly `llms.txt` review
- [ ] Regeneration script run after CMS or URL structure changes
- [ ] Validation script passes before each deploy

## Quick test prompts

After deployment, try these with an AI assistant:

1. "What does [Business Name] do?"
2. "What services does [Business Name] offer?"
3. "How do I contact [Business Name]?"

Compare answers to your `llms.txt` and fix gaps.
