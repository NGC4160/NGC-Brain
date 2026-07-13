# Neighborhood Golf Carts — Business Brain + NGC Enterprise

This repository contains:

1. **Knowledge base** (`knowledge/`, `prompts/`, `external_docs/`) — NGC operations brain for Cursor agents
2. **NGC Enterprise** (`ngc-enterprise/`) — full shop-based service management platform (Housecall Pro–class, redesigned for shop + pickup/delivery)

## NGC Enterprise

**Live demo (GitHub Pages):** https://ngc4160.github.io/NGC-Brain/enterprise/

```bash
cd ngc-enterprise
npm install
cp .env.example .env
# ensure Postgres is running (see ngc-enterprise/docker-compose.yml)
npm run db:migrate && npm run db:seed
npm run dev
```

See [`ngc-enterprise/README.md`](ngc-enterprise/README.md) for architecture, demo accounts, and modules.

## Business Brain

Start at [`START_HERE.md`](START_HERE.md) and [`knowledge/00_index.md`](knowledge/00_index.md).
