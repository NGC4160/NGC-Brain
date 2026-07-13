# Finance Overview

**Last verified:** 2026-07-13  
**Source:** QBO API morning sync → `external_docs/exports/qbo/`  
**Reporting basis:** Accrual (as pulled by morning sync)  
**Period referenced:** July 13, 2025 – July 13, 2026

## Privacy

This document covers **structure and categories only** — not customer data, account numbers, or credentials. Dollar figures are high-level aggregates from the live P&L for business planning context.

## Revenue summary (12-month period)

| Metric | Amount |
|--------|-------:|
| Total income | ~$557,481 |
| Cost of goods sold | ~$183,019 |
| Gross profit | ~$374,462 |
| Total expenses | ~$351,498 |
| Net operating income | ~$22,965 |
| Net income | ~$28,276 |

## Income categories (QBO)

| Account | ~Amount | Notes |
|---------|--------:|-------|
| **Sales and Services** | $365,991 | Primary shop/repair bucket |
| **LFP Conversions Only** | $90,494 | Dedicated lithium tracking (~16% of income) |
| **Services Income** | $63,853 | |
| **Sales of Product Income** | $23,276 | Parts/products |
| **Sales** | $22,710 | |
| **Mobile Trip Income** | $8,492 | **Legacy** — wind down to $0 |
| **Shop Supply Fee** | $2,247 | |
| **Housecall Pro Tips** | $2,341 | |
| **Discounts given** | -$6,886 | |
| **Unapplied Cash Payment Income** | -$19,926 | Review/cleanup with Jill |

**Takeaway:** Lithium dedicated line is up vs prior period (~$90k). Majority still flows through Sales and Services. Mobile trip income and Unapplied Cash still need cleanup.

## COGS structure

| Account | ~Amount |
|---------|--------:|
| Cost of goods sold | $107,343 |
| Job Supplies | $71,222 |
| Contractors | $4,454 |

Direct labor accounts exist in COA (`Direct Labor:Salaries & Wages`, payroll taxes) — confirm allocation with Jill.

## Major expense categories

| Category | ~Amount |
|----------|--------:|
| Payroll (wages, taxes, benefits, processing) | $139,747 |
| Advertising & Marketing | $63,661 |
| Rent | $26,113 |
| Automobile (fuel, insurance, repairs) | $23,806 |
| Coaching & Consulting | $14,569 |
| Merchant Account Fees | $13,796 |
| Depreciation | $11,550 |
| Software Expense | $7,496 |
| Shop Supplies | $5,114 |

## Balance sheet highlights (Jul 13, 2026)

| Item | ~Amount | Notes |
|------|--------:|-------|
| **Total bank accounts** | $13,359 | Includes Chase OPEX |
| **Inventory Asset** | $11,967 | Parts and lithium stock |
| **Accounts Receivable** | $2,880 | Still low — healthy |
| **Undeposited Funds** | $1,351 | Periodic review recommended |
| **Due from LDOR** | $3,104 | Sales tax refund/credit in progress |
| **Total current assets** | $32,721 | |
| **Total current liabilities** | $17,645 | |

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

As of Jul 2026: books sync daily via morning sync (HCP + QBO API → Command Center). Unapplied Cash and Mobile Trip Income remain cleanup items for Jill.

## Month-end checklist

- Reconcile Chase checking
- Reconcile Housecall Pro to QBO invoices & payments
- Verify Undeposited Funds < 3 days revenue
- Review P&L, Balance Sheet, Cash Flows, AR Aging
- Confirm morning sync secrets still valid (QBO refresh token)

## Finance flows (document in QBO/Drive)

1. Collecting cash
2. Paying bills
3. Payroll
4. Credit card management
5. Taxes
6. Month closeout

Owner assignments for each flow — confirm current owners with Ryan/Christine.

## Automation

Daily P&L / balance sheet / COA refresh: GitHub Action **Morning Sync** (7:30 AM CST). Manual export ritual for routine finance Qs is **no longer required** — still refresh `knowledge/08_finance/` after material chart changes or when AI answers look stale.
