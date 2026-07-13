# NGC Enterprise

**Shop-Based Service Operations Platform — Pickup • Repair • Deliver • Grow**

A production-ready, multi-tenant SaaS platform that delivers Housecall Pro–class workflows, re-architected for **shop-based** operations with world-class **pickup & delivery dispatch**.

Built for Neighborhood Golf Carts and any shop that receives, diagnoses, repairs, and returns equipment — not a field-tech-first model.

---

## Features

| Module | Capabilities |
|---|---|
| **Auth & Multi-tenancy** | Organizations, locations, RBAC (11 roles), invitations-ready |
| **Dashboard** | Live shop KPIs, bay status, at-risk jobs, pickups/deliveries |
| **CRM** | Customers, contacts, addresses, equipment/assets, history |
| **Work Orders** | Full shop lifecycle, line items, techs, checklists, activity |
| **Estimates** | Good/Better/Best options, approval, convert to WO |
| **Invoicing** | Progress payments, payment recording, status tracking |
| **Price Book** | Hierarchical catalog, cost/sell/margin |
| **Inventory** | Multi-location stock, reorder points, reservations |
| **Shop Floor** | Drag-and-drop Kanban, bay assignment, tablet-friendly |
| **Dispatch** | Pickup & delivery boards, driver assignment, ETA |
| **Driver App** | Mobile-first stop list, status updates, nav links |
| **Schedule** | Bay capacity & promised dates |
| **Communications** | Unified inbox + templates |
| **Reports** | Revenue, jobs, tech, parts, driver analytics |
| **Settings** | Branding, statuses, taxes, integrations, HCP import stub |
| **Customer Portal** | Tokenized status tracker, estimates, invoices |
| **PWA** | Installable manifest for shop tablets & drivers |

---

## Tech Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Prisma 7** + **PostgreSQL**
- **Auth.js (NextAuth v5)** credentials + RBAC
- **TanStack Query**, Zustand-ready, Zod, React Hook Form
- **dnd-kit**, Framer Motion, Recharts
- Docker Compose for local Postgres + app

---

## Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL 16+ (or Docker)

### 1. Install

```bash
cd ngc-enterprise
npm install
cp .env.example .env
```

### 2. Database

With local Postgres (user `ngc` / password `ngc_dev_password` / db `ngc_enterprise`):

```bash
# Or start via Docker:
docker compose up -d db

npm run db:migrate
npm run db:seed
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Login**.

### Demo accounts

Password for all: **`demo1234`**

| Email | Role |
|---|---|
| `owner@ngc.demo` | Owner |
| `manager@ngc.demo` | Manager |
| `advisor@ngc.demo` | Service Advisor |
| `tech@ngc.demo` | Shop Technician |
| `parts@ngc.demo` | Parts Manager |
| `dispatch@ngc.demo` | Dispatcher |
| `pickup@ngc.demo` | Pickup Driver |
| `delivery@ngc.demo` | Delivery Driver |
| `accounting@ngc.demo` | Accountant |

---

## Docker (full stack)

```bash
docker compose up --build
```

App: `http://localhost:3000` · Postgres: `localhost:5432`

After first boot, run migrate + seed against the container DB if needed:

```bash
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed
```

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm test` | Vitest suite |
| `npm run db:migrate` | Prisma migrate |
| `npm run db:seed` | Seed NGC demo data |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | Reset DB + re-seed |

---

## Architecture

```
Organization
 └── Locations (shops)
      ├── Users (RBAC)
      ├── Bays / Workstations
      ├── Vehicles
      └── Inventory stock levels

Customer → Equipment → Estimate → Work Order → Invoice → Payment
                              ↓
                     Pickup / Delivery Dispatch → Driver App
```

**Central entity:** Work Order. Estimates convert to WOs; WOs convert to invoices.

Multi-tenant isolation is enforced via `organizationId` on all business records.

---

## Importing Housecall Pro data

1. Export customers, jobs, price book, and invoices from Housecall Pro (CSV/JSON).
2. Open **Settings → Import / Export** in NGC Enterprise.
3. Map columns (customers, jobs → work orders, price book SKUs, users).
4. Run dry-run, then import.

CLI / script path (extend as needed):

```bash
# Placeholder — wire CSV mappers under scripts/import/
npx tsx scripts/import/hcp-customers.ts ./exports/customers.csv
```

Seed data already mirrors NGC shop pricing (diagnostic $179, Professional lithium kits, shop-only pickup/delivery).

---

## Environment Variables

See [`.env.example`](./.env.example). Required:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL` / `NEXTAUTH_URL`

Optional integrations: Stripe, Mapbox, Resend, Twilio, Pusher, UploadThing.

---

## Customer Portal

Seeded customers receive a `portalToken`. Visit:

```
/portal/<token>
```

Use Prisma Studio or the customer detail page to copy a token for demos.

---

## Role home screens

| Role | Default home |
|---|---|
| Dispatcher | `/dispatch` |
| Shop Technician | `/shop-floor` |
| Pickup / Delivery Driver | `/driver` |
| Accountant | `/invoices` |
| Owner / Manager / Advisor | `/dashboard` |

---

## Testing

```bash
npm test
npm run lint
npm run build
```

---

## Roadmap / TODOs

- AI CSR & Analyst copilots (architecture hooks in dashboard)
- Live Mapbox Optimization API routing
- Stripe Connect + financing widgets
- QuickBooks two-way sync
- Offline-first service worker for driver/shop tablets
- Public REST API + webhooks
- Full HCP CSV import mappers

---

## License

Proprietary — Neighborhood Golf Carts / NGC Enterprise.
