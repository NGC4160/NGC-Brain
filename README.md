# GreenLine Golf Cart Repair — Inventory Dashboard

Full-stack **parts inventory system** for a golf cart repair business with **2 locations**, **retail counter sales**, **barcode scanner input**, **SMS/email low-stock alerts**, **core returns (RMA)**, and **QuickBooks Online** integration (inventory + non-inventory items).

## Quick start

### 1. Start database services

```bash
docker compose up -d
```

### 2. Backend API

```bash
cd backend
cp ../.env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

API runs at [http://localhost:3001](http://localhost:3001).

### 3. Frontend

```bash
npm install
npm run dev
```

Open [http://localhost:5173/inventory](http://localhost:5173/inventory).

## Features

| Module | Description |
|--------|-------------|
| **Dashboard** | KPIs: SKUs, low/out of stock, inventory value, open POs & work orders, retail MTD, QBO sync status |
| **Parts Catalog** | 30 seeded golf cart parts; inventory vs non-inventory types; barcode lookup; QBO sync status |
| **Stock (2 locations)** | Main Shop + South Bay; bin locations; barcode scan to find |
| **Retail Sales** | Counter sales with barcode cart; auto QBO invoice |
| **Purchase Orders** | Receive stock; weighted avg cost; QBO bill creation |
| **Work Orders** | Issue parts to jobs; invoice to QBO |
| **Core Returns** | RMA workflow for motors/controllers; ship → credit |
| **QBO Integration** | OAuth connect; two-way item/vendor sync; mock mode for dev |
| **Alerts** | Email + SMS low-stock alerts; hourly auto-check |

## Two locations

- **Main Shop** (`MAIN`) — 1200 Fairway Dr, Augusta, GA
- **South Bay** (`SOUTH`) — 450 Cart Path Ln, Martinez, GA

## QuickBooks Online

### Development (mock mode — default)

Set `QBO_USE_MOCK=true` in `.env`. Click **Connect QuickBooks** on the QBO page — no Intuit credentials needed.

### Production

1. Create an app at [Intuit Developer](https://developer.intuit.com/)
2. Set in `.env`:
   ```
   QBO_USE_MOCK=false
   QBO_CLIENT_ID=your_client_id
   QBO_CLIENT_SECRET=your_client_secret
   QBO_REDIRECT_URI=http://localhost:3001/api/qbo/callback
   QBO_ENVIRONMENT=sandbox
   ```
3. Connect from **Inventory → QBO** and sync parts/vendors

### Sync mapping

| App | QBO | Direction |
|-----|-----|-----------|
| Parts (INVENTORY type) | Item (Inventory) | Two-way |
| Parts (NON_INVENTORY) | Item (NonInventory) | Two-way |
| Vendors | Vendor | Two-way |
| Retail / WO close | Invoice | App → QBO |
| PO receive | Bill | App → QBO |

## Barcode scanner

USB keyboard-wedge scanners work out of the box. Focus the scanner input field and scan — the field captures rapid keystrokes + Enter.

Used on: Parts catalog, Stock lookup, Retail counter, Core returns.

## Low-stock alerts

Configure recipients on **Inventory → Alerts**. Without SMTP/Twilio credentials, alerts log to the API console (mock mode). Set:

```
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
```

Alerts run every hour automatically; use **Send Test Alert Now** for immediate check.

## Project structure

```
backend/
  prisma/schema.prisma   # Full data model
  prisma/seed.ts         # 2 locations, 30 parts, vendors, PO, WO
  src/routes/            # REST API
  src/services/qbo/      # QBO adapter + mock + sync
  src/services/alerts.ts # Email/SMS notifications
src/
  pages/inventory/       # Inventory UI modules
  components/inventory/  # Barcode scanner, KPI cards
  lib/api.ts             # API client
```

## Tests

```bash
cd backend && npm test
```

## Tech stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Express, Prisma, PostgreSQL, Redis
- **QBO**: Official OAuth 2.0 + REST API (mock adapter for local dev)

## Docs

- [Architecture & extending the app](docs/ARCHITECTURE.md)
- [Adding service manuals](docs/ADDING_RESOURCES.md)
