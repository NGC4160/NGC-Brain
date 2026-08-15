#!/usr/bin/env python3
"""Unit tests for morning briefing generator and email composer."""

from __future__ import annotations

import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import email_morning_briefing as emailer
import generate_morning_briefing as briefing

NOW = datetime(2026, 8, 15, 12, 0, tzinfo=timezone.utc)

BACKLOG = """
| P | Item | Why | Owner | Status |
|---|------|-----|-------|--------|
| P1 | HCP WIP hygiene — audit stale "in progress" (15+ days), correct statuses | board can't lie | Ryan | Open |
| P1 | Lithium job tracker (day 0/1/2, deposit received, parts ordered) | Protect 2–3 day promise | Ryan | In progress |
| P1 | Deactivate legacy HCP/QBO items (mobile, NGC Conversion, trip charges) | Prevents wrong quotes | Ryan / Jesse | Checklist ready |
| P1 | Hire Admin / Service Coordinator (Board Jul 2026) | Free Ryan | Ryan | **Filled — Jesse** (2026-08-15) |
"""


def _job(**kwargs) -> dict:
    base = {
        "id": "job_test",
        "invoice_number": "17000",
        "description": "General - 1.0 - Golf Cart Diagnostic & Inspection",
        "notes": [],
        "work_status": "in progress",
        "total_amount": 20239,
        "outstanding_balance": 20239,
        "assigned_employees": [],
        "created_at": "2026-08-14T12:00:00Z",
        "updated_at": "2026-08-14T12:00:00Z",
        "customer": {
            "first_name": "Secret",
            "last_name": "Customerland",
            "email": "secret.customer@example.com",
            "mobile_number": "9855550100",
        },
        "address": {
            "street": "123 Hidden Lane",
            "city": "Covington",
            "state": "LA",
            "zip": "70433",
        },
    }
    base.update(kwargs)
    return base


class BriefingTests(unittest.TestCase):
    def test_strips_customer_pii_and_staff_last_names(self) -> None:
        jobs = [
            _job(
                invoice_number="17248",
                description="48V Professional Lithium Battery Conversion Kit Installed",
                created_at="2026-05-05T12:00:00Z",
                total_amount="279900",
                outstanding_balance=0,
                assigned_employees=[
                    {
                        "first_name": "Marlon",
                        "last_name": "ShouldNotAppear",
                        "email": "marlon.internal@example.com",
                        "mobile_number": "5045550199",
                    },
                    {
                        "first_name": "Roy",
                        "last_name": "AlsoHidden",
                        "email": "roy.internal@example.com",
                    },
                ],
            ),
            _job(
                invoice_number="17419",
                description="1.5-Complete Battery Replacement, 8V",
                created_at="2026-08-11T12:00:00Z",
                total_amount=153933,
                outstanding_balance=153933,
                assigned_employees=[{"first_name": "Roy", "last_name": "AlsoHidden"}],
            ),
        ]
        text = briefing.build_briefing(jobs, "2026-08-14T14:28:53Z", BACKLOG, now=NOW)
        forbidden = [
            "Secret",
            "Customerland",
            "secret.customer@example.com",
            "9855550100",
            "123 Hidden Lane",
            "ShouldNotAppear",
            "AlsoHidden",
            "marlon.internal@example.com",
            "5045550199",
        ]
        for snippet in forbidden:
            self.assertNotIn(snippet, text, f"leaked {snippet!r}")
        self.assertIn("#17248", text)
        self.assertIn("Marlon", text)
        self.assertIn("Lithium jobs at risk", text)
        self.assertIn("BLOCK_PARTS", text)
        self.assertIn("#17419", text)
        self.assertIn("HCP WIP hygiene", text)

    def test_filled_p1_is_not_selected(self) -> None:
        jobs = [_job(invoice_number="17400", created_at="2026-07-01T12:00:00Z")]
        text = briefing.build_briefing(jobs, None, BACKLOG, now=NOW)
        self.assertNotIn("Hire Admin", text)
        self.assertIn("HCP WIP hygiene", text)

    def test_flags_discontinued_ngc_conversion(self) -> None:
        jobs = [
            _job(
                invoice_number="17425",
                description="Batteries & Cables - 3.0- NGC Lithium Conversion, 72V 105AH",
                work_status="needs scheduling",
                created_at="2026-08-12T12:00:00Z",
                total_amount=360307,
                outstanding_balance=180307,
            )
        ]
        text = briefing.build_briefing(jobs, None, BACKLOG, now=NOW)
        self.assertIn("Do not quote NGC Conversion", text)
        self.assertIn("#17425", text)
        self.assertIn("DISCONTINUED SKU", text)

    def test_former_staff_and_ryan_g(self) -> None:
        jobs = [
            _job(
                invoice_number="17260",
                description="Accessories - 1.0-Seat belt kit installation",
                created_at="2026-05-06T12:00:00Z",
                total_amount=10000,
                outstanding_balance=0,
                assigned_employees=[
                    {"first_name": "Dylan", "last_name": "ShouldNotAppear"},
                    {"first_name": "Taylor", "last_name": "AlsoHidden"},
                    {"first_name": "Ryan", "last_name": "Gorgoglione"},
                    {"first_name": "Roy", "last_name": "DriverLast"},
                ],
            )
        ]
        text = briefing.build_briefing(jobs, None, BACKLOG, now=NOW)
        self.assertIn("Ryan G", text)
        self.assertIn("former — reassign", text)
        self.assertIn("Taylor and Dylan are gone", text)
        for leaked in ("ShouldNotAppear", "AlsoHidden", "Gorgoglione", "DriverLast"):
            self.assertNotIn(leaked, text)

    def test_short_last_name_does_not_match_fleet(self) -> None:
        jobs = [_job(customer={"first_name": "Pat", "last_name": "Lee", "email": "x@y.com"})]
        text = briefing.build_briefing(jobs, None, BACKLOG, now=NOW)
        self.assertIn("fleet", text.lower())
        self.assertFalse(briefing.contains_customer_pii(text, jobs))

    def test_email_dry_run_envelope(self) -> None:
        md = "# NGC Morning Briefing — 2026-08-15\n\n- test"
        msg = emailer.build_message(md, "Ryan@NGCgolfcarts.com", "noreply@ngcgolfcarts.com")
        self.assertEqual(msg["To"], "Ryan@NGCgolfcarts.com")
        self.assertEqual(msg["Subject"], "NGC Morning Briefing — 2026-08-15")
        body = msg.get_body(preferencelist=("plain",))
        assert body is not None
        self.assertIn("test", body.get_content())


if __name__ == "__main__":
    unittest.main()
