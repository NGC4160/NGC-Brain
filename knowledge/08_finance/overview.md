# Finance Overview

**Last verified:** 2026-07-12  
**Sources:** QBO exports in `external_docs/exports/qbo/` + PAGCW CFO packs in `external_docs/exports/cfo_reports/`  
**Reporting basis:** Cash basis  
**Structured datasets:** [`datasets/`](datasets/README.md) · Monthly narratives: [`monthly/`](monthly/)

## Privacy

This document covers **structure and categories only** — not customer data, account numbers, or credentials. Dollar figures are high-level aggregates for business planning.

## Latest month highlight — June 2026 (RevB)

| Metric | Amount |
|--------|-------:|
| QBO total income | $78,266 |
| QBO gross profit | $55,213 |
| QBO net income | $16,939 |
| QBO net margin | 21.6% |
| HCP completed-job revenue | $75,626 |
| HCP paid-in-full | $83,794 |
| Working capital | $19,311 |
| Current ratio | 1.87 |

Full pack: [`monthly/2026-06.md`](monthly/2026-06.md)

## Monthly KPI trend (HCP production vs QBO)

| Month | Jobs | HCP completed $ | Avg ticket | Travel % | QBO income | QBO NOI | WC |
|-------|-----:|----------------:|-----------:|---------:|-----------:|--------:|---:|
| Jan | 47 | $26.4k | $562 | 28% | $37.9k | $4.1k | — |
| Feb | 51 | $29.4k | $576 | — | $30.1k | $9.1k | −$9.4k |
| Mar | 64 | $40.6k | $634 | 49% | $43.0k | $2.9k | −$10.5k |
| Apr* | 70 tgt | $46.6k tgt | $665 tgt | ≤44% tgt | ~$47–49k | ~$5–6k | — |
| May | — | — | — | — | $62.8k | $6.3k | $4.4k |
| Jun | 45 | $75.6k | $1,666 | 25% | $78.3k | $16.9k | $19.3k |

\*April row is **forecast target** from the Apr 7 planning report, not actual close.

Machine-readable: [`datasets/monthly_kpis.csv`](datasets/monthly_kpis.csv)

## Revenue summary (12-month QBO export period)

Period referenced in export files: June 28, 2025 – June 28, 2026.

| Metric | Amount |
|--------|-------:|
| Total income | ~$554,509 |
| Cost of goods sold | ~$182,591 |
| Gross profit | ~$371,918 |
| Total expenses | ~$344,640 |
| Net income | ~$31,807 |

## Income categories (QBO — trailing 12 months)

| Account | ~Amount | Notes |
|---------|--------:|-------|
| **Sales and Services** | $377,093 | Primary shop/repair bucket |
| **LFP Conversions Only** | $81,026 | Dedicated lithium tracking |
| **Services Income** | $55,101 | |
| **Sales of Product Income** | $22,978 | Parts/products |
| **Sales** | $22,710 | |
| **Mobile Trip Income** | $8,258 | **Legacy** — wind down |
| **Housecall Pro Tips** | $2,843 | |
| **Shop Supply Fee** | $1,982 | |
| **Discounts given** | -$7,949 | |
| **Unapplied Cash Payment Income** | -$14,400 | Review/cleanup item |

**June 2026 mix (single month):** Sales and Services $39.4k · LFP Conversions $17.3k · Services Income $9.1k · Product $4.9k

**Takeaway:** Lithium is meaningful on the dedicated line and often larger inside Sales and Services. Mobile trip income still posting historically — reconcile to zero as mobile ends.

## COGS structure (trailing 12 months)

| Account | ~Amount |
|---------|--------:|
| Cost of goods sold | $97,254 |
| Job Supplies | $80,884 |
| Contractors | $4,454 |

Direct labor accounts exist in COA (`Direct Labor:Salaries & Wages`, payroll taxes) — confirm allocation with Jill.

## Major expense categories (trailing 12 months)

| Category | ~Amount |
|----------|--------:|
| Payroll (wages, taxes, 401k) | $139,431 |
| Advertising & Marketing | $63,846 |
| Rent | $23,763 |
| Merchant Account Fees | $13,504 |
| Automobile (fuel, insurance, repairs) | $23,558 |
| Software Expense | $7,662 |
| Coaching & Consulting | $11,780 |
| Depreciation | $11,550 |
| Shop Supplies | $5,047 |

## Balance sheet highlights

### June 30, 2026 (CFO RevB)

| Item | Amount / notes |
|------|----------------|
| Current assets | $41,455 |
| Total liabilities | $22,145 |
| Working capital | $19,311 |
| Current ratio | 1.87 |
| Bank accounts | $3,766 — improved vs May but still timing-sensitive |
| Inventory Asset | $24,382 |
| Undeposited Funds | **$7,069** — clear weekly |
| Stripe Capital | $15,069 (down $3,846 in June) |
| Suspense (P&L other expense) | $785 — resolve before July final |

### Prior export snapshot (Jun 28, 2026 QBO file)

| Item | Notes |
|------|-------|
| **Inventory Asset** | ~$19,706 in earlier export — RevB month-end shows higher; prefer RevB for June close narrative |
| **Due from LDOR** | ~$6,208 — sales tax refund/credit in progress |
| **Customer Deposits** | Liability account exists — used for pre-orders |
| **Accounts Receivable** | Near zero — healthy |

## Chart of accounts — income accounts

- Billable Expense Income / Billable Expense Income-1
- Cart Sales *(future — not active)*
- Discounts given
- Housecall Pro Tips Account
- **LFP Conversions Only**
- Mobile Trip Income *(legacy)*
- Payment Processing Fee
- Sales / Sales and Services
- Sales of Product Income
- Services Income
- Shop Supply Fee
- Uncategorized Income

## Sales tax — Louisiana multi-parish

QBO tracks parish-level sales tax payables. Parishes with activity include:

- **Saint Tammany** (home parish — Covington)
- Jefferson
- Tangipahoa
- Washington
- Orleans
- East Baton Rouge
- And others configured for out-of-area jobs

**Rule of thumb:** Tax jurisdiction follows **where the service is performed** or customer location — confirm specific rules with Jill/bookkeeper for shop vs pickup/delivery scenarios.

## Bank accounts (names only)

- Chase Checking (7928) — OPEX
- Growth & Reserves (0056)
- Payroll 6966
- Tax Account 6982
- Tax Reserves (0031)
- Amazon Credit
- Housecall Pro Balance

## Bookkeeping status

As of Jun 2026 RevB: books revised after deferred bank-register cleanup; **still watch Undeposited Funds and Suspense**.

Historical issues (2024 evaluation) — largely reconciled since:

- OPEX reconciliation gaps
- Uncategorized expenses
- Undeposited funds
- AR/invoice matching with HCP

## Month-end checklist

- Reconcile Chase checking
- Reconcile Housecall Pro to QBO invoices & payments
- Clear Undeposited Funds weekly (avoid >7-day buildup)
- Resolve Suspense to $0
- Bridge: HCP completed $ vs paid-in-full $ vs QBO income
- Review P&L, Balance Sheet, Cash Flows, AR Aging
- Update `knowledge/08_finance/datasets/` + monthly narrative after each PAGCW pack

## Finance flows (document in QBO/Drive)

1. Collecting cash  
2. Paying bills  
3. Payroll  
4. Credit card management  
5. Taxes  
6. Month closeout  

Owner assignments for each flow — confirm current owners with Ryan/Christine.

## How to refresh

1. Drop new CFO PDF into `external_docs/exports/cfo_reports/`  
2. Say **"ingest CFO report"** or update datasets + `monthly/YYYY-MM.md`  
3. Re-export QBO files monthly per `prompts/monthly_refresh.md`
