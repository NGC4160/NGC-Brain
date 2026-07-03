#!/usr/bin/env python3
"""NGC Admin Bot Phase 1 — deposit gate alerts from HCP jobs export (no customer PII)."""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
JOBS_PATH = ROOT / "external_docs" / "exports" / "hcp" / "jobs.json"
OUT_PATH = ROOT / "knowledge" / ".generated" / "deposit_alerts.md"

ACTIVE_STATUSES = {"in progress", "scheduled", "needs scheduling"}

LITHIUM_KEYWORDS = ("lithium", "lfp", "lifepo4", "professional kit", "conversion kit")
BATTERY_KEYWORDS = ("lead acid", "lead-acid", "battery replacement", "6v set", "8v set", "12v set", "battery recovery")
MOTOR_CONTROLLER_KEYWORDS = ("motor", "controller", "controller upgrade", "speed controller")
SKIP_REVIEW_KEYWORDS = ("courtesy", "warranty service", "fleet inspection")

DEPOSIT_LITHIUM_CENTS = 180_000
DEPOSIT_BATTERY_CENTS = 80_000
DIAGNOSTIC_MIN_CENTS = 17_900


@dataclass
class Alert:
    code: str
    invoice: str
    status: str
    description: str
    total_dollars: float
    paid_dollars: float
    required_deposit_dollars: float
    gap_dollars: float
    action: str


def cents_to_dollars(cents: int | float | None) -> float:
    if cents is None:
        return 0.0
    return round(float(cents) / 100.0, 2)


def classify(description: str) -> str:
    text = description.lower()
    if any(k in text for k in LITHIUM_KEYWORDS):
        return "lithium"
    if any(k in text for k in BATTERY_KEYWORDS):
        return "battery"
    if any(k in text for k in MOTOR_CONTROLLER_KEYWORDS):
        return "motor_controller"
    if (
        "diagnostic" in text
        or "minimum service charge" in text
        or "golf cart diagnostic" in text
    ):
        return "diagnostic"
    return "general"


def required_deposit_cents(job_type: str, total_cents: int) -> int:
    if job_type == "lithium":
        return DEPOSIT_LITHIUM_CENTS
    if job_type == "battery":
        return DEPOSIT_BATTERY_CENTS
    if job_type == "motor_controller":
        return max(total_cents // 2, DIAGNOSTIC_MIN_CENTS)
    return 0


def sanitize_description(desc: str, max_len: int = 70) -> str:
    text = re.sub(r"\s+", " ", (desc or "").strip())
    if len(text) <= max_len:
        return text or "(no description)"
    return text[: max_len - 1] + "…"


def analyze_job(job: dict) -> Alert | None:
    status = str(job.get("work_status") or "").lower()
    if status not in ACTIVE_STATUSES:
        return None

    description = str(job.get("description") or "")
    desc_lower = description.lower()
    if any(k in desc_lower for k in SKIP_REVIEW_KEYWORDS):
        return None

    total_cents = int(job.get("total_amount") or 0)
    outstanding_cents = int(job.get("outstanding_balance") or 0)
    if total_cents <= 0 and outstanding_cents <= 0:
        return None

    paid_cents = max(0, total_cents - outstanding_cents)
    job_type = classify(description)
    required_cents = required_deposit_cents(job_type, total_cents)

    invoice = str(job.get("invoice_number") or job.get("id", "")[:8])

    if job_type in {"lithium", "battery", "motor_controller"} and required_cents > 0:
        if paid_cents < required_cents:
            gap = required_cents - paid_cents
            return Alert(
                code="BLOCK_PARTS",
                invoice=invoice,
                status=status,
                description=sanitize_description(description),
                total_dollars=cents_to_dollars(total_cents),
                paid_dollars=cents_to_dollars(paid_cents),
                required_deposit_dollars=cents_to_dollars(required_cents),
                gap_dollars=cents_to_dollars(gap),
                action="Do not order parts — collect deposit first",
            )

    if status == "needs scheduling" and job_type == "diagnostic" and outstanding_cents >= DIAGNOSTIC_MIN_CENTS:
        return Alert(
            code="SCHEDULE_UNPAID",
            invoice=invoice,
            status=status,
            description=sanitize_description(description),
            total_dollars=cents_to_dollars(total_cents),
            paid_dollars=cents_to_dollars(paid_cents),
            required_deposit_dollars=cents_to_dollars(DIAGNOSTIC_MIN_CENTS),
            gap_dollars=cents_to_dollars(outstanding_cents),
            action="Collect $179 diagnostic before booking bay time",
        )

    if outstanding_cents > 0 and job_type not in {"diagnostic"}:
        return Alert(
            code="COLLECT_BALANCE",
            invoice=invoice,
            status=status,
            description=sanitize_description(description),
            total_dollars=cents_to_dollars(total_cents),
            paid_dollars=cents_to_dollars(paid_cents),
            required_deposit_dollars=cents_to_dollars(required_cents),
            gap_dollars=cents_to_dollars(outstanding_cents),
            action="Balance due before pickup or additional work",
        )

    if outstanding_cents > 0 and job_type == "diagnostic" and status != "needs scheduling":
        return Alert(
            code="COLLECT_BALANCE",
            invoice=invoice,
            status=status,
            description=sanitize_description(description),
            total_dollars=cents_to_dollars(total_cents),
            paid_dollars=cents_to_dollars(paid_cents),
            required_deposit_dollars=cents_to_dollars(DIAGNOSTIC_MIN_CENTS),
            gap_dollars=cents_to_dollars(outstanding_cents),
            action="Diagnostic balance due",
        )

    return None


def format_alert(a: Alert) -> str:
    return (
        f"- **#{a.invoice}** · {a.description} · `{a.status}` · "
        f"paid ${a.paid_dollars:.2f} / ${a.total_dollars:.2f} · "
        f"**gap ${a.gap_dollars:.2f}** — {a.action}"
    )


def build_report(alerts: list[Alert], synced_at: str | None) -> str:
    now = datetime.now(tz=timezone.utc)
    by_code: dict[str, list[Alert]] = {"BLOCK_PARTS": [], "SCHEDULE_UNPAID": [], "COLLECT_BALANCE": []}
    for a in alerts:
        by_code.setdefault(a.code, []).append(a)

    lines = [
        "# Deposit Gate Alerts (NGC Admin Bot)",
        "",
        f"**Generated:** {now.strftime('%Y-%m-%d %H:%M UTC')}  ",
        f"**HCP jobs export:** {synced_at or 'unknown'}  ",
        "**Privacy:** Invoice # and description only — open job in HCP for customer contact.",
        "",
        "## Summary",
        "",
        f"| Alert | Count |",
        f"|-------|------:|",
        f"| BLOCK_PARTS (do not order) | {len(by_code['BLOCK_PARTS'])} |",
        f"| SCHEDULE_UNPAID | {len(by_code['SCHEDULE_UNPAID'])} |",
        f"| COLLECT_BALANCE | {len(by_code['COLLECT_BALANCE'])} |",
        "",
    ]

    sections = [
        ("BLOCK_PARTS — Christine priority", "BLOCK_PARTS"),
        ("SCHEDULE_UNPAID — collect before booking", "SCHEDULE_UNPAID"),
        ("COLLECT_BALANCE — before pickup / more labor", "COLLECT_BALANCE"),
    ]
    for title, code in sections:
        items = by_code.get(code, [])
        lines.append(f"## {title}")
        lines.append("")
        if items:
            for a in sorted(items, key=lambda x: x.gap_dollars, reverse=True):
                lines.append(format_alert(a))
        else:
            lines.append("- None")
        lines.append("")

    lines += [
        "## Christine — next steps",
        "",
        "1. Work **BLOCK_PARTS** top to bottom.",
        "2. Send HCP payment link; note `Deposit received YYYY-MM-DD` on job.",
        "3. Tell Ryan when parts can be ordered.",
        "",
        "Regenerate: `./scripts/admin_bot/run_deposit_alerts.sh`",
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    if not JOBS_PATH.exists():
        print(f"ERROR: missing {JOBS_PATH} — run ./scripts/sync/run_hcp_sync.sh first", file=sys.stderr)
        return 1

    payload = json.loads(JOBS_PATH.read_text())
    jobs = payload.get("jobs", payload if isinstance(payload, list) else [])
    synced_at = payload.get("synced_at") if isinstance(payload, dict) else None

    alerts: list[Alert] = []
    for job in jobs:
        if isinstance(job, dict):
            alert = analyze_job(job)
            if alert:
                alerts.append(alert)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(build_report(alerts, synced_at) + "\n")
    print(f"Wrote {OUT_PATH} ({len(alerts)} alerts)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
