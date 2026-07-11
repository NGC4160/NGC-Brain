# View the dashboard on your iPhone

## Your link

**https://ngc4160.github.io/NGC-Brain/**

Full setup steps: [GITHUB_PAGES.md](./GITHUB_PAGES.md)

---

## One-time setup (if the link is 404)

1. Open https://github.com/NGC4160/NGC-Brain/settings  
2. Make the repo **Public** (Danger Zone → Change visibility), unless your plan supports private Pages.  
3. Go to **Settings → Pages**:
   - Source: **GitHub Actions**, **or**
   - Branch: **gh-pages** / folder **/ (root)**
4. Wait 1–2 minutes, then open the link above in Safari.

Bookmark it, or tap **Share → Add to Home Screen**.

---

## What you can do on your phone

- **Dashboard** — shop numbers and overview  
- **Agent Input** — log repairs from the shop  
- **Manuals & Files** — open service docs  
- **Jobs** — see all repair orders  
- **Invoicing** — AR and deposit alerts from cached HCP data  

Notes save in your phone’s browser (localStorage) on that device.

---

## Refresh the published site

On a computer:

```bash
npm run deploy:pages
```

Or push to `main` and let the GitHub Actions Pages workflow deploy.
