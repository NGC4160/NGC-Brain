# Run the NGC dashboard on GitHub Pages

Your public site base is **https://ngc4160.github.io**.

Because this app lives in the **NGC-Brain** repo, the dashboard URL will be:

**https://ngc4160.github.io/NGC-Brain/**

---

## One-time setup (required)

`NGC-Brain` is currently a **private** repo. GitHub Pages needs either:

1. **Make the repo public** (simplest on a free plan), **or**
2. A GitHub plan that allows Pages on private repos

### A. Make the repo public (recommended)

1. Open https://github.com/NGC4160/NGC-Brain/settings
2. Scroll to **Danger Zone** → **Change repository visibility** → **Public**

### B. Turn on Pages

**Option 1 — GitHub Actions (preferred)**

1. Repo → **Settings** → **Pages**
2. Under **Build and deployment** → **Source**, choose **GitHub Actions**
3. Merge this branch (or push to `main`), then open the **Actions** tab and confirm **Deploy to GitHub Pages** succeeds
4. Open **https://ngc4160.github.io/NGC-Brain/**

**Option 2 — `gh-pages` branch**

1. Repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **gh-pages** / folder: **/ (root)**
4. Save, wait 1–2 minutes, then open the link above

---

## Deploy / refresh the site

From a machine with Node installed:

```bash
npm install
npm run deploy:pages
```

That builds the static dashboard (with cached Housecall Pro data) and pushes to the `gh-pages` branch.

Or push to `main` / this feature branch and let the **Deploy to GitHub Pages** workflow publish it.

---

## What works on GitHub Pages

| Feature | On Pages |
|---------|----------|
| Dashboard, Jobs, Status Board, Invoicing, Manuals | Yes (static + cached HCP JSON) |
| Create / edit work orders | Yes (saved in browser localStorage on that device) |
| Agent Input notes | Yes (saved in browser localStorage) |
| Live HCP API / SQLite DMS / QBO | No — those need the local API (`npm run dev:all`) |

---

## Put the app at the root (https://ngc4160.github.io/)

If you want the dashboard at the root of your user/org site instead of `/NGC-Brain/`:

1. Build for root: `npm run deploy:pages:root`
2. Copy everything inside `dist/` into your existing **ngc4160.github.io** Pages repo
3. Commit and push that repo

Use root base path (`/`) only for that user-site repo — not for the NGC-Brain project Pages URL.

---

## If you see a 404

- Wait 2–5 minutes after enabling Pages or redeploying
- Confirm the repo is **public**
- Confirm Source is branch **gh-pages** / folder **/ (root)** (or GitHub Actions)
- Hard-refresh Safari / Chrome (old 404 pages are cached briefly)
- In **Settings → Pages**, status should say **Your site is live**, not “errored”

If Pages shows **errored**, redeploy a clean site:

```bash
npm run deploy:pages
```

That publish includes a `.nojekyll` file so GitHub does not run Jekyll on the Vite build.