#!/usr/bin/env python3
"""Email the generated morning briefing. Never logs SMTP passwords or customer PII."""

from __future__ import annotations

import argparse
import os
import smtplib
import ssl
import sys
from email.message import EmailMessage
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BRIEFING = ROOT / "knowledge" / ".generated" / "morning_briefing.md"
DEFAULT_TO = "Ryan@NGCgolfcarts.com"


def markdown_to_html(md: str) -> str:
    escaped = (
        md.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
    html_lines = [
        "<html><body style='font-family:Georgia,serif;font-size:15px;line-height:1.45;color:#111'>",
        "<pre style='white-space:pre-wrap;font-family:inherit'>",
        escaped,
        "</pre></body></html>",
    ]
    return "\n".join(html_lines)


def subject_from_briefing(md: str) -> str:
    for line in md.splitlines():
        if line.startswith("# "):
            title = line[2:].strip()
            return title[:120] or "NGC Morning Briefing"
    return "NGC Morning Briefing"


def build_message(md: str, to_addr: str, from_addr: str) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = subject_from_briefing(md)
    msg["From"] = from_addr
    msg["To"] = to_addr
    msg.set_content(md)
    msg.add_alternative(markdown_to_html(md), subtype="html")
    return msg


def send_message(msg: EmailMessage, host: str, port: int, user: str, password: str) -> None:
    context = ssl.create_default_context()
    with smtplib.SMTP(host, port, timeout=30) as smtp:
        smtp.ehlo()
        smtp.starttls(context=context)
        smtp.ehlo()
        if user:
            smtp.login(user, password)
        smtp.send_message(msg)


def main() -> int:
    parser = argparse.ArgumentParser(description="Email NGC morning briefing")
    parser.add_argument("--file", type=Path, default=DEFAULT_BRIEFING)
    parser.add_argument("--to", default=os.environ.get("BRIEFING_EMAIL_TO", DEFAULT_TO))
    parser.add_argument("--dry-run", action="store_true", help="Print envelope only; do not send")
    args = parser.parse_args()

    if not args.file.exists():
        print(f"ERROR: missing {args.file} — run ./scripts/sync/run_morning_briefing.sh first", file=sys.stderr)
        return 1

    md = args.file.read_text()
    host = os.environ.get("SMTP_HOST", "").strip()
    port = int(os.environ.get("SMTP_PORT", "587") or "587")
    user = os.environ.get("SMTP_USER", "").strip()
    password = os.environ.get("SMTP_PASSWORD", "")
    from_addr = os.environ.get("SMTP_FROM", user or args.to).strip()

    msg = build_message(md, args.to, from_addr)

    if args.dry_run:
        print(f"To: {msg['To']}")
        print(f"From: {msg['From']}")
        print(f"Subject: {msg['Subject']}")
        print(f"Bytes: {len(md)}")
        return 0

    if not host or not password:
        print(
            "ERROR: SMTP_HOST and SMTP_PASSWORD are required to send. "
            "Add GitHub Actions secrets SMTP_HOST, SMTP_USER, SMTP_PASSWORD "
            "(optional SMTP_PORT, SMTP_FROM, BRIEFING_EMAIL_TO).",
            file=sys.stderr,
        )
        return 2

    send_message(msg, host, port, user, password)
    print(f"Sent briefing to {args.to}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
