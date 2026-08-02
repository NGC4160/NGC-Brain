# Host online for a month (friend can keep using it)

For **~30 days of real use**, you need:

1. An always-on URL (doesn’t sleep)
2. A **persistent disk** so orders/inventory don’t wipe on restart

Free Render/Railway sleep + ephemeral storage are fine for a quick peek — **not** for a month.

## Recommended: Render Starter + 1 GB disk (~$7–10/mo)

Gives a stable link like `https://birdhouse-print-shop.onrender.com` that stays up all month and keeps their data.

### Deploy (once)

1. Open [Render Blueprint](https://dashboard.render.com/select-repo?type=blueprint)
2. Connect GitHub → **NGC4160/NGC-Brain**
3. Branch: **`cursor/birdhouse-print-shop-mvp-838f`** (or `main` after merge)
4. Apply repo-root `render.yaml` (Starter plan + `/var/data` disk)
5. Add a payment method if Render asks (required for Starter)
6. Wait for live deploy → copy the `.onrender.com` URL

### Manual setup (same result)

1. [render.com](https://render.com) → **New → Web Service** → `NGC4160/NGC-Brain`
2. Settings:
   - **Root Directory:** `tools/birdhouse-print-shop`
   - **Build:** `pip install -r requirements.txt`
   - **Start:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance type:** Starter (not Free)
   - **Disk:** 1 GB mounted at `/var/data`
   - **Env var:** `BIRDHOUSE_DATA_DIR=/var/data`
   - **Env var:** `RELOAD=0`
3. Deploy → text the URL

### Text your friend

> Here’s the birdhouse shop tool — use this link for the next month:  
> https://YOUR-SERVICE.onrender.com  
> Add products/orders on the Board as you go. Don’t delete the bookmark.

### Keep it healthy for 30 days

| Do | Don’t |
|---|---|
| Leave the Render service running | Switch back to Free plan |
| Avoid unnecessary redeploys if they’re mid-trial | Expect Free tier to keep their data |
| Optional: download `birdhouse.db` from disk/backups later | Put real customer passwords in it (there is no login yet) |

**No login yet** — anyone with the link can edit the shared shop. Only send it to people you trust for this trial.

### After the month

- Cancel/delete the Render service to stop billing, **or**
- Keep it if the side business is using it

## Cheaper but weaker: Free Render

- URL can last a month
- App **sleeps** after idle (slow first open)
- **Data can reset** on redeploy  
Only use this if they’re casually clicking around, not running real orders.

## Optional later

- Custom domain in Render → Settings → Custom Domain
- Add a simple password/gate before wider sharing
