# SOP-72 — Month-End Export Ritual

**Owner:** Ryan (with Jill for QBO)  
**Last verified:** 2026-07-12  
**Status:** Draft — ready for review

## Purpose

Keep the business brain current — stale exports = bad AI/staff answers.

## Steps

1. Export HCP pricebook CSV → `external_docs/exports/pricebook/`
2. Export QBO P&L, balance sheet, products → `external_docs/exports/qbo/`
3. Run `./scripts/sync/run_ingest.sh` (or say “sync exports”)
4. Review drift vs knowledge; update files
5. Run monthly_refresh prompt; bump Last verified dates
6. If exports >30 days old mid-month, refresh early

## Related

prompts/monthly_refresh.md · ngc-sync-exports skill
