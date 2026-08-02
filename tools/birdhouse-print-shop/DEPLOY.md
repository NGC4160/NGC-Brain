# Permanent demo link (host online)

Temporary Cloudflare links die when your laptop sleeps.  
A **permanent** link means hosting this app on a free cloud service.

## Recommended: Render (about 5 minutes)

Gives you a stable URL like:

`https://birdhouse-print-shop.onrender.com`

### Option A — Blueprint (fastest)

1. Open [Render Blueprint](https://dashboard.render.com/select-repo?type=blueprint)
2. Connect GitHub repo `NGC4160/NGC-Brain`
3. Choose branch `cursor/birdhouse-print-shop-mvp-838f` (or `main` after merge)
4. Apply the repo-root `render.yaml`
5. Wait for deploy → copy the `.onrender.com` URL → text that

### Option B — Manual Web Service

1. Create a free account at [https://render.com](https://render.com)
2. **New → Web Service → Connect GitHub → `NGC4160/NGC-Brain`**
3. Settings:
   - **Name:** `birdhouse-print-shop`
   - **Root Directory:** `tools/birdhouse-print-shop`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Branch:** `cursor/birdhouse-print-shop-mvp-838f` (or `main` after merge)
4. Create Web Service
5. Wait for deploy → copy the `.onrender.com` URL → text that

### Free-tier note

Render free apps **sleep after ~15 minutes idle**. First open can take 30–60 seconds to wake. The URL itself stays permanent.

SQLite data on free tier can reset when the service redeploys. Fine for demos; for real orders later, add a paid disk or move to Postgres.

## Alternative: Railway

1. [https://railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select `NGC4160/NGC-Brain`
3. Set root / watch path to `tools/birdhouse-print-shop`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Generate a public domain in Settings → Networking

## Alternative: Docker anywhere

```bash
cd tools/birdhouse-print-shop
docker build -t birdhouse-print-shop .
docker run -p 8787:8787 birdhouse-print-shop
```

## Custom domain later

In Render/Railway: Settings → Custom Domain → point `demo.yourbirdhousestore.com` (or similar) via DNS CNAME.

## What to text your friend

> Permanent birdhouse shop demo: https://YOUR-SERVICE.onrender.com
