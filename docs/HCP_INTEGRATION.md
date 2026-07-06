# Housecall Pro integration

The dashboard pulls jobs, KPIs, and company info from **Housecall Pro** (HCP).

## What syncs from HCP

| Dashboard area | HCP source |
|----------------|------------|
| **KPIs** — active jobs, completed week, revenue MTD, avg turnaround, waitlist | Aggregated from `/jobs` |
| **Fleet accounts** | Customers with company/commercial flag |
| **Parts on order** | Active jobs mentioning parts/orders in notes |
| **Jobs table** | All open jobs + recent completed |
| **Dashboard active jobs list** | Same job feed |
| **Revenue chart** | Completed jobs with `total_amount` |
| **Company name / logo** | `/company` endpoint (when live) |

Agent Input notes, time logs, and local pins still save in your browser. Job create/update goes through HCP when connected.

## Setup (live API)

1. Copy env file:
   ```bash
   cp .env.example .env
   ```

2. Add your HCP API key (MAX/XL plan required):
   ```bash
   HCP_API_KEY=your_key_here
   ```

3. Run the API proxy + dashboard:
   ```bash
   npm run dev:all
   ```

4. Open http://localhost:5173 — the banner shows **Housecall Pro (live)**.

## Sync commands

```bash
# Pull latest from HCP API → public/data/
npm run sync:hcp

# Rebuild static dashboard JSON from cached export
npm run build:hcp-cache
```

## GitHub Pages (iPhone link)

Static hosting loads `public/data/hcp-dashboard.json` (no API key in the browser).

Before deploy:
```bash
npm run sync:hcp        # if you have HCP_API_KEY
# or
npm run build:hcp-cache # from existing export
npm run deploy:pages
```

## Architecture

```
Housecall Pro API
       ↓
server/hcpClient.ts  (API key stays on server)
       ↓
server/hcpMapper.ts  (HCP job → dashboard job)
       ↓
GET /api/hcp/dashboard  →  React dashboard
       ↓
public/data/hcp-dashboard.json  (static fallback)
```

## Job status mapping

| HCP `work_status` | Dashboard status |
|-------------------|------------------|
| needs scheduling | Received |
| scheduled | Diagnosing |
| in progress | In Repair |
| complete (no date) | Ready |
| complete (with date) | Picked Up |
| user/pro canceled | Hidden |

## Security

- Never commit `.env` or `HCP_API_KEY`
- The API key is only used by `server/` — not exposed to the browser
- Full job export cache (`hcp-cache.json`) is gitignored; only trimmed `hcp-dashboard.json` is deployed
