#!/usr/bin/env python3
"""Build a sanitized shop throughput board from HCP jobs export (no customer PII)."""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
JOBS_PATH = ROOT / "external_docs" / "exports" / "hcp" / "jobs.json"
OUT_PATH = ROOT / "knowledge" / ".generated" / "shop_board.md"

ACTIVE_STATUSES = {"in progress", "scheduled", "needs scheduling"}
LITHIUM_KEYWORDS = ("lithium", "lfp", "lifepo4", "conversion", "professional")


def parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def days_since(dt: datetime | None, now: datetime) -> int | None:
    if not dt:
        return None
    return max(0, (now - dt).days)


def is_lithium(job: dict) -> bool:
    text = " ".join(
        [
            str(job.get("description") or ""),
            str(job.get("notes") or "")[:200],
        ]
    ).lower()
    return any(k in text for k in LITHIUM_KEYWORDS)


def sanitize_description(desc: str, max_len: int = 72) -> str:
    text = re.sub(r"\s+", " ", (desc or "").strip())
    if len(text) <= max_len:
        return text or "(no description)"
    return text[: max_len - 1] + "…"


def job_row(job: dict, now: datetime) -> dict:
    created = parse_dt(job.get("created_at"))
    updated = parse_dt(job.get("updated_at"))
    age = days_since(created or updated, now)
    assigned = job.get("assigned_employees") or []
    balance = job.get("outstanding_balance") or 0
    return {
        "invoice": job.get("invoice_number") or job.get("id", "")[:8],
        "status": job.get("work_status") or "unknown",
        "description": sanitize_description(str(job.get("description") or "")),
        "days": age,
        "lithium": is_lithium(job),
        "assigned_count": len(assigned) if isinstance(assigned, list) else 0,
        "has_balance": bool(balance and float(balance) > 0),
        "tags": job.get("tags") or [],
    }


def age_bucket(days: int | None) -> str:
    if days is None:
        return "unknown"
    if days <= 1:
        return "0-1d"
    if days <= 3:
        return "2-3d"
    if days <= 7:
        return "4-7d"
    if days <= 14:
        return "8-14d"
    return "15+d"


def format_row(row: dict) -> str:
    flags = []
    if row["lithium"]:
        flags.append("Li")
    if row["has_balance"]:
        flags.append("$ due")
    if row["assigned_count"] == 0:
        flags.append("unassigned")
    flag_str = f" ({', '.join(flags)})" if flags else ""
    days = row["days"] if row["days"] is not None else "?"
    return f"- #{row['invoice']} · {row['description']} · {days}d{flag_str}"


def build_board(jobs: list[dict], synced_at: str | None) -> str:
    now = datetime.now(tz=timezone.utc)
    active = [
        j
        for j in jobs
        if isinstance(j, dict) and str(j.get("work_status", "")).lower() in ACTIVE_STATUSES
    ]

    in_progress = [j for j in active if str(j.get("work_status", "")).lower() == "in progress"]
    scheduled = [j for j in active if str(j.get("work_status", "")).lower() == "scheduled"]
    needs_sched = [
        j for j in active if str(j.get("work_status", "")).lower() == "needs scheduling"
    ]

    ip_rows = [job_row(j, now) for j in in_progress]
    buckets = Counter(age_bucket(r["days"]) for r in ip_rows)
    lithium_ip = [r for r in ip_rows if r["lithium"]]
    stale = [r for r in ip_rows if (r["days"] or 0) > 14]
    unassigned = [r for r in ip_rows if r["assigned_count"] == 0]
    lithium_at_risk = [r for r in lithium_ip if (r["days"] or 0) > 3]

    # Capacity heuristic: 2 primary techs, target WIP 6 in-progress max
    wip_target = 6
    wip_over = max(0, len(in_progress) - wip_target)

    lines = [
        "# Shop Board (auto-generated)",
        "",
        f"**Generated:** {now.strftime('%Y-%m-%d %H:%M UTC')}  ",
        f"**HCP jobs export:** {synced_at or 'unknown'}  ",
        "**Privacy:** No customer names or addresses.",
        "",
        "## Snapshot",
        "",
        f"| Metric | Count |",
        f"|--------|------:|",
        f"| In progress | {len(in_progress)} |",
        f"| Scheduled | {len(scheduled)} |",
        f"| Needs scheduling | {len(needs_sched)} |",
        f"| **Active pipeline** | **{len(active)}** |",
        f"| WIP over target ({wip_target}) | {wip_over} |",
        f"| Unassigned (in progress) | {len(unassigned)} |",
        f"| Stale in progress (15+ days) | {len(stale)} |",
        f"| Lithium in progress | {len(lithium_ip)} |",
        f"| Lithium at risk (>3d) | {len(lithium_at_risk)} |",
        "",
        "## In progress — age",
        "",
        f"- 0–1 day: {buckets.get('0-1d', 0)}",
        f"- 2–3 days: {buckets.get('2-3d', 0)}",
        f"- 4–7 days: {buckets.get('4-7d', 0)}",
        f"- 8–14 days: {buckets.get('8-14d', 0)}",
        f"- 15+ days: {buckets.get('15+d', 0)}",
        "",
    ]

    if lithium_at_risk:
        lines += ["## Lithium at risk (>3 days in shop)", ""]
        for r in sorted(lithium_at_risk, key=lambda x: x["days"] or 0, reverse=True):
            lines.append(format_row(r))
        lines.append("")

    if stale:
        lines += ["## Stale WIP (15+ days) — close out or escalate today", ""]
        for r in sorted(stale, key=lambda x: x["days"] or 0, reverse=True):
            lines.append(format_row(r))
        lines.append("")

    if unassigned:
        lines += ["## Unassigned (in progress)", ""]
        for r in unassigned:
            lines.append(format_row(r))
        lines.append("")

    if needs_sched:
        ns_rows = sorted([job_row(j, now) for j in needs_sched], key=lambda x: x["days"] or 0, reverse=True)
        lines += ["## Needs scheduling (Christine queue)", ""]
        for r in ns_rows[:15]:
            lines.append(format_row(r))
        if len(ns_rows) > 15:
            lines.append(f"- … and {len(ns_rows) - 15} more")
        lines.append("")

    if scheduled:
        lines += ["## Scheduled (incoming)", ""]
        for r in [job_row(j, now) for j in scheduled][:15]:
            lines.append(format_row(r))
        if len(scheduled) > 15:
            lines.append(f"- … and {len(scheduled) - 15} more")
        lines.append("")

    lines += [
        "## Ryan — 8:30 actions",
        "",
        "1. Assign every in-progress cart to Taylor or Marlon (Peyton only if flagged).",
        "2. Close or update stale HCP statuses (15+ day jobs).",
        "3. Protect lithium lane: finish or reschedule anything over 3 days.",
        "4. Hold new intake if WIP stays above 6 until oldest jobs clear.",
        "",
        "Regenerate: `./scripts/sync/run_shop_board.sh` (runs after HCP sync).",
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

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(build_board(jobs, synced_at) + "\n")
    print(f"Wrote {OUT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
