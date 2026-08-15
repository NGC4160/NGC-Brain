#!/usr/bin/env python3
"""Build a PII-free service-manager morning briefing from HCP + knowledge files."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
JOBS_PATH = ROOT / "external_docs" / "exports" / "hcp" / "jobs.json"
BACKLOG_PATH = ROOT / "knowledge" / "09_daily_ops" / "improvement_backlog.md"
OUT_PATH = ROOT / "knowledge" / ".generated" / "morning_briefing.md"

if str(SCRIPTS / "sync") not in sys.path:
    sys.path.insert(0, str(SCRIPTS / "sync"))
if str(SCRIPTS / "admin_bot") not in sys.path:
    sys.path.insert(0, str(SCRIPTS / "admin_bot"))

from deposit_gate_alerts import Alert, analyze_job  # noqa: E402
from generate_shop_board import (  # noqa: E402
    ACTIVE_STATUSES,
    days_since,
    is_lithium,
    parse_dt,
    sanitize_description,
)

WIP_TARGET = 6
NEEDS_SCHED_TARGET = 5
LITHIUM_SLA_DAYS = 3
STALE_DAYS = 15

BAY_TECH_KEYS = {"marlon", "peyton", "payton", "ryan"}
DRIVER_KEYS = {"roy"}
KNOWN_ROSTER = {"ryan", "jesse", "christine", "roy", "marlon", "peyton", "payton"}
FORMER_STAFF = {"taylor", "dylan"}  # do not assign — departed 2026-08-15

# Do not quote / do not treat as current sellable SKU
DISCONTINUED_LITHIUM = ("ngc lithium conversion", "ngc conversion")

# first_name omitted — staff first names are intentional and can collide with customers
PII_KEYS = (
    "last_name",
    "email",
    "mobile_number",
    "home_number",
    "work_number",
    "street",
    "street_line_2",
    "phone",
)


def _first_key(label: str) -> str:
    return label.split()[0].lower()


def staff_display_name(emp: dict) -> str:
    """First name + last initial only when two staff share a first name. Never email/phone."""
    first = str(emp.get("first_name") or "").strip()
    last = str(emp.get("last_name") or "").strip()
    key = first.lower()
    if key == "payton":
        return "Peyton"
    if key == "ryan":
        initial = last[:1].upper()
        if initial == "G":
            return "Ryan G"
        if initial == "W":
            return "Ryan W"
        return "Ryan"
    return first


def staff_labels(job: dict) -> list[str]:
    labels: list[str] = []
    seen: set[str] = set()
    for emp in job.get("assigned_employees") or []:
        if not isinstance(emp, dict):
            continue
        label = staff_display_name(emp)
        if not label:
            continue
        if label.lower() in seen:
            continue
        seen.add(label.lower())
        labels.append(label)
    return labels


def bay_vs_driver(names: list[str]) -> tuple[list[str], list[str], list[str], list[str]]:
    bay, driver, former, other = [], [], [], []
    for name in names:
        key = _first_key(name)
        if key in FORMER_STAFF:
            former.append(f"{name} (former — reassign)")
        elif key in BAY_TECH_KEYS:
            bay.append(name)
        elif key in DRIVER_KEYS:
            driver.append(name)
        else:
            other.append(name)
    return bay, driver, former, other


def format_techs(names: list[str]) -> str:
    if not names:
        return "unassigned"
    bay, driver, former, other = bay_vs_driver(names)
    parts: list[str] = []
    if bay:
        parts.append("bay " + ", ".join(bay))
    if former:
        parts.append(", ".join(former))
    if other:
        parts.append(", ".join(other))
    if driver:
        parts.append("Roy on ticket")
    return " · ".join(parts) if parts else "unassigned"


def job_age_days(job: dict, now: datetime) -> int | None:
    return days_since(parse_dt(job.get("created_at")) or parse_dt(job.get("updated_at")), now)


def invoice_of(job: dict) -> str:
    return str(job.get("invoice_number") or job.get("id", "")[:8])


def format_job_line(job: dict, now: datetime) -> str:
    days = job_age_days(job, now)
    days_s = f"{days}d" if days is not None else "?d"
    flags = []
    if is_lithium(job):
        flags.append("Li")
    desc = str(job.get("description") or "")
    if any(k in desc.lower() for k in DISCONTINUED_LITHIUM):
        flags.append("DISCONTINUED SKU")
    flag_str = f" ({', '.join(flags)})" if flags else ""
    return (
        f"- #{invoice_of(job)} · {sanitize_description(desc)} · {days_s} · "
        f"{format_techs(staff_labels(job))}{flag_str}"
    )


def parse_p1_open(backlog_text: str) -> list[tuple[str, str]]:
    """Return (item, status) for P1 rows that are not Done/Filled."""
    items: list[tuple[str, str]] = []
    for line in backlog_text.splitlines():
        if not line.startswith("| P1 |"):
            continue
        cols = [c.strip() for c in line.strip("|").split("|")]
        if len(cols) < 5:
            continue
        item, _why, _owner, status = cols[1], cols[2], cols[3], cols[4]
        status_l = status.lower()
        if "filled" in status_l or status_l.startswith("**done"):
            continue
        items.append((item, status))
    return items


def pick_backlog_item(
    p1_items: list[tuple[str, str]],
    stale_count: int,
    lithium_at_risk: int,
) -> tuple[str, str]:
    if not p1_items:
        return (
            "Add a P1 to improvement_backlog.md",
            "No open P1 rows found.",
        )
    preferred = "wip hygiene" if stale_count >= 1 else "lithium" if lithium_at_risk else "legacy"
    for item, status in p1_items:
        blob = item.lower()
        if preferred == "wip hygiene" and "wip" in blob:
            return item, status
        if preferred == "lithium" and "lithium job tracker" in blob:
            return item, status
        if preferred == "legacy" and "legacy" in blob:
            return item, status
    return p1_items[0]


def build_priorities(
    in_progress: list[dict],
    needs_sched: list[dict],
    stale: list[dict],
    lithium_risk: list[dict],
    block_parts: list[Alert],
    roy_as_only_owner: int,
    now: datetime,
) -> list[str]:
    wip = len(in_progress)
    priorities: list[str] = []

    if stale or wip > WIP_TARGET:
        priorities.append(
            f"**WIP hygiene** — {wip} in progress (target {WIP_TARGET}), "
            f"{len(stale)} jobs 15+ days. Audit oldest tickets in HCP: close, "
            f"move to waiting parts, or put a bay owner on the card. "
            f"Hold new drop-offs until WIP ≤ {WIP_TARGET}."
        )
    if lithium_risk:
        top = lithium_risk[0]
        days = job_age_days(top, now)
        priorities.append(
            f"**Protect lithium SLA** — #{invoice_of(top)} is {days}d in shop "
            f"(promise is 2–3 days). Finish, reschedule with a firm date, or "
            f"escalate. Do not start a second lithium until this lane is honest."
        )
    if block_parts:
        invoices = ", ".join(f"#{a.invoice}" for a in block_parts[:3])
        priorities.append(
            f"**Jesse deposit gate** — {len(block_parts)} BLOCK_PARTS "
            f"({invoices}). Collect deposit before any battery/motor/controller order."
        )
    if roy_as_only_owner and len(priorities) < 3:
        priorities.append(
            f"**Bay ownership by 8:30** — {roy_as_only_owner} in-progress jobs "
            f"have Roy (driver) and no Marlon/Ryan G. Assign a wrench owner; "
            f"Roy stays on the ticket only for pickup/delivery."
        )
    if len(needs_sched) > NEEDS_SCHED_TARGET and len(priorities) < 3:
        priorities.append(
            f"**Jesse intake queue** — {len(needs_sched)} needs scheduling "
            f"(target {NEEDS_SCHED_TARGET}). Book, waitlist, or decline within 48 hrs. "
            f"Collect the $179 diagnostic before parking a bay."
        )
    fillers = [
        "**Finish list** — Name max 2 lithium + 2–4 repairs per tech at the 8:15 huddle.",
        "**Status honesty** — Move waiting-parts and ready carts out of In Progress before lunch.",
        "**Intake pause** — Jesse books a bay only if one will open today.",
    ]
    for filler in fillers:
        if len(priorities) >= 3:
            break
        if filler not in priorities:
            priorities.append(filler)
    return priorities[:3]


def _appears_as_word(needle: str, haystack: str) -> bool:
    if not needle or len(needle) < 3:
        return False
    return re.search(rf"\b{re.escape(needle)}\b", haystack, flags=re.IGNORECASE) is not None


def contains_customer_pii(text: str, jobs: list[dict]) -> list[str]:
    """Return leaked PII snippets if any customer fields appear in output."""
    leaks: list[str] = []
    for job in jobs:
        customer = job.get("customer") if isinstance(job.get("customer"), dict) else {}
        address = job.get("address") if isinstance(job.get("address"), dict) else {}
        for source in (customer, address):
            for key in PII_KEYS:
                val = source.get(key)
                if not val:
                    continue
                raw = str(val).strip()
                if key in {"email", "mobile_number", "home_number", "work_number", "phone"}:
                    if raw and raw.lower() in text.lower():
                        leaks.append(f"{key}={raw}")
                    continue
                # Last names / streets: whole-word only so "Lee" does not match "fleet"
                if _appears_as_word(raw, text):
                    leaks.append(f"{key}={raw}")
    return leaks


def build_briefing(
    jobs: list[dict],
    synced_at: str | None,
    backlog_text: str,
    now: datetime | None = None,
) -> str:
    now = now or datetime.now(tz=timezone.utc)
    active = [
        j
        for j in jobs
        if isinstance(j, dict) and str(j.get("work_status", "")).lower() in ACTIVE_STATUSES
    ]
    in_progress = [j for j in active if str(j.get("work_status", "")).lower() == "in progress"]
    scheduled = [j for j in active if str(j.get("work_status", "")).lower() == "scheduled"]
    needs_sched = [j for j in active if str(j.get("work_status", "")).lower() == "needs scheduling"]

    stale = [j for j in in_progress if (job_age_days(j, now) or 0) >= STALE_DAYS]
    lithium_ip = [j for j in in_progress if is_lithium(j)]
    lithium_risk = sorted(
        [j for j in lithium_ip if (job_age_days(j, now) or 0) > LITHIUM_SLA_DAYS],
        key=lambda x: job_age_days(x, now) or 0,
        reverse=True,
    )
    lithium_pipeline = [j for j in active if is_lithium(j)]
    discontinued_open = [
        j
        for j in active
        if any(k in str(j.get("description") or "").lower() for k in DISCONTINUED_LITHIUM)
    ]

    roy_only = 0
    former_jobs: list[dict] = []
    hcp_extra: set[str] = set()
    for j in in_progress:
        names = staff_labels(j)
        bay, driver, _former, _other = bay_vs_driver(names)
        if driver and not bay:
            roy_only += 1
    for j in active:
        names = staff_labels(j)
        if any(_first_key(n) in FORMER_STAFF for n in names):
            former_jobs.append(j)
        for n in names:
            key = _first_key(n)
            if key in FORMER_STAFF:
                continue
            if key not in KNOWN_ROSTER:
                hcp_extra.add(n)

    alerts: list[Alert] = []
    for job in active:
        alert = analyze_job(job)
        if alert:
            alerts.append(alert)
    block_parts = [a for a in alerts if a.code == "BLOCK_PARTS"]
    schedule_unpaid = [a for a in alerts if a.code == "SCHEDULE_UNPAID"]
    collect_balance = [a for a in alerts if a.code == "COLLECT_BALANCE"]
    block_parts.sort(key=lambda a: a.gap_dollars, reverse=True)
    schedule_unpaid.sort(key=lambda a: a.gap_dollars, reverse=True)
    collect_balance.sort(key=lambda a: a.gap_dollars, reverse=True)

    p1_items = parse_p1_open(backlog_text)
    backlog_item, backlog_status = pick_backlog_item(p1_items, len(stale), len(lithium_risk))
    priorities = build_priorities(
        in_progress, needs_sched, stale, lithium_risk, block_parts, roy_only, now
    )

    date_label = now.strftime("%A, %B %-d, %Y") if sys.platform != "win32" else now.strftime("%A, %B %d, %Y")
    lines = [
        f"# NGC Morning Briefing — {now.strftime('%Y-%m-%d')}",
        "",
        f"**{date_label}** · Service manager view · no customer names  ",
        f"**HCP jobs export:** {synced_at or 'unknown'}  ",
        f"**Generated:** {now.strftime('%Y-%m-%d %H:%M UTC')}",
        "",
        "## Snapshot",
        "",
        f"- In progress: **{len(in_progress)}** (target {WIP_TARGET}) · "
        f"over by {max(0, len(in_progress) - WIP_TARGET)}",
        f"- Needs scheduling: **{len(needs_sched)}** (target {NEEDS_SCHED_TARGET})",
        f"- Scheduled incoming: {len(scheduled)}",
        f"- Stale 15+ days: **{len(stale)}** · Lithium in progress: {len(lithium_ip)} · "
        f"Lithium >3d: **{len(lithium_risk)}**",
        f"- Deposit gate: {len(block_parts)} BLOCK_PARTS · {len(schedule_unpaid)} unpaid diag · "
        f"{len(collect_balance)} balances due",
        "",
        "## Top 3 priorities",
        "",
    ]
    for i, p in enumerate(priorities, 1):
        lines.append(f"{i}. {p}")
    lines.append("")

    lines += ["## Lithium jobs at risk (2–3 day turnaround)", ""]
    if lithium_risk:
        for j in sorted(lithium_risk, key=lambda x: job_age_days(x, now) or 0, reverse=True):
            lines.append(format_job_line(j, now))
    else:
        lines.append("- None in progress over 3 days.")
    extra_li = [
        j
        for j in lithium_pipeline
        if j not in lithium_risk
        and (
            str(j.get("work_status", "")).lower() != "in progress"
            or (job_age_days(j, now) or 0) > LITHIUM_SLA_DAYS
        )
    ]
    blocked_li_invoices = {a.invoice for a in block_parts}
    for j in lithium_pipeline:
        if invoice_of(j) in blocked_li_invoices and j not in lithium_risk:
            extra_li.append(j)
    # unique
    seen_inv: set[str] = {invoice_of(j) for j in lithium_risk}
    extras_unique = []
    for j in extra_li:
        inv = invoice_of(j)
        if inv in seen_inv:
            continue
        seen_inv.add(inv)
        extras_unique.append(j)
    if extras_unique:
        lines.append("- Also watch (not in-bay, but lithium / deposit-blocked):")
        for j in extras_unique:
            status = str(j.get("work_status") or "").lower()
            lines.append(f"  {format_job_line(j, now)} · `{status}`")
    if discontinued_open:
        lines.append(
            "- **Do not quote NGC Conversion** — open ticket(s) still on the discontinued line. "
            "Professional Kits only for new work."
        )
        for j in discontinued_open:
            lines.append(f"  {format_job_line(j, now)}")
    lines.append("")

    lines += ["## Deposit / parts-order follow-ups (Jesse)", ""]
    if block_parts:
        lines.append("**BLOCK_PARTS — do not order**")
        for a in block_parts:
            lines.append(
                f"- #{a.invoice} · {a.description} · `{a.status}` · "
                f"gap ${a.gap_dollars:.0f} — {a.action}"
            )
    else:
        lines.append("- No BLOCK_PARTS alerts.")
    if schedule_unpaid:
        lines.append("**Unpaid diagnostic — collect $179 before booking**")
        for a in schedule_unpaid[:6]:
            lines.append(f"- #{a.invoice} · gap ${a.gap_dollars:.0f}")
        if len(schedule_unpaid) > 6:
            lines.append(f"- … and {len(schedule_unpaid) - 6} more unpaid diagnostics")
    ip_balances = [
        a
        for a in collect_balance
        if a.status == "in progress" and a.gap_dollars >= 300
    ]
    if ip_balances:
        lines.append("**In-progress balances ≥ $300 — collect before more labor / pickup**")
        for a in ip_balances[:5]:
            lines.append(f"- #{a.invoice} · {a.description} · gap ${a.gap_dollars:.0f}")
    lines.append("")

    lines += [
        "## Carts in shop (HCP in progress — no customer names)",
        "",
    ]
    if in_progress:
        for j in sorted(in_progress, key=lambda x: job_age_days(x, now) or 0, reverse=True):
            lines.append(format_job_line(j, now))
    else:
        lines.append("- None flagged in progress.")
    lines.append("")

    if former_jobs:
        lines += [
            "## Former staff still on HCP tickets — Jesse reassign",
            "",
            "- **Taylor** and **Dylan** are off the roster (2026-08-15). Pull them off every open job.",
            "- Reassign to **Marlon** or **Ryan G**. Ryan G started today — pair him, don't dump the 100-day pile on day 1.",
        ]
        seen_former: set[str] = set()
        for j in sorted(former_jobs, key=lambda x: job_age_days(x, now) or 0, reverse=True):
            inv = invoice_of(j)
            if inv in seen_former:
                continue
            seen_former.add(inv)
            status = str(j.get("work_status") or "").lower()
            lines.append(f"{format_job_line(j, now)} · `{status}`")
        lines.append("")

    lines += [
        "## Improvement backlog — touch today",
        "",
        f"- **{backlog_item}** ({backlog_status})",
        "- 20 minutes: walk the 15+ day list with Jesse and restatus or finish two tickets.",
        "",
        "## Staff / Roy / urgent",
        "",
        "- Roster: **Ryan W** (service manager), **Jesse**, **Marlon**, **Ryan G** (tech, started today), **Roy**. "
        "Peyton on-call for advanced diag. **Taylor and Dylan are gone — do not assign.**",
        "- Pickups/deliveries for Roy: **none listed** in HCP descriptions. Jesse to set a zone-batched route.",
        "- Urgent: **not provided.**",
        "",
        "## What I still need from you",
        "",
        "- Who is in / out (Jesse, Marlon, Ryan G, Roy, Peyton)",
        "- Confirm Ryan G has HCP access and Taylor/Dylan logins are disabled",
        "- Roy's actual pickup/delivery list (or confirm none)",
        "- Any fire (comeback, angry customer, fleet) — do not paste names/phones",
        "- Which 15+ day tickets are physically in a bay vs stale HCP status",
    ]
    if hcp_extra:
        extras = ", ".join(sorted(hcp_extra))
        lines.append(
            f"- Confirm HCP assignees not on the current roster: **{extras}** "
            f"(first names only — close or reassign those tickets)"
        )
    lines += [
        "",
        "## Notes",
        "",
        "- Diagnostic is **$179** minimum — not waived; applies toward repair on known-issue jobs.",
        "- Pickup/delivery: free within 40 mi Northshore; **$99** outside or Southshore. No mobile / trip charges.",
        "- Lithium: Professional Kits only (36V/48V/MINI/72V/150AH). NGC Conversion is discontinued.",
        "",
        "Regenerate: `./scripts/sync/run_morning_briefing.sh`  ",
        "Daily email: morning-sync GitHub Action → Ryan@NGCgolfcarts.com (needs SMTP secrets).",
        "",
    ]
    text = "\n".join(lines)
    leaks = contains_customer_pii(text, jobs)
    if leaks:
        raise RuntimeError(f"Refusing to write briefing — customer PII detected: {leaks[:5]}")
    return text


def load_jobs(path: Path = JOBS_PATH) -> tuple[list[dict], str | None]:
    if not path.exists():
        raise FileNotFoundError(f"missing {path} — run ./scripts/sync/run_hcp_sync.sh first")
    payload = json.loads(path.read_text())
    jobs = payload.get("jobs", payload if isinstance(payload, list) else [])
    synced_at = payload.get("synced_at") if isinstance(payload, dict) else None
    return jobs, synced_at


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate NGC morning briefing (no customer PII)")
    parser.add_argument("--jobs", type=Path, default=JOBS_PATH)
    parser.add_argument("--backlog", type=Path, default=BACKLOG_PATH)
    parser.add_argument("--out", type=Path, default=OUT_PATH)
    parser.add_argument("--stdout", action="store_true", help="Print briefing to stdout")
    args = parser.parse_args()

    try:
        jobs, synced_at = load_jobs(args.jobs)
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    backlog_text = args.backlog.read_text() if args.backlog.exists() else ""
    text = build_briefing(jobs, synced_at, backlog_text)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(text + "\n")
    print(f"Wrote {args.out}")
    if args.stdout:
        print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
