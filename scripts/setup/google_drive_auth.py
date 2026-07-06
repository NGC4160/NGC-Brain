#!/usr/bin/env python3
"""Google Drive OAuth helper — test connection (uses connectors/google_drive_client.py)."""

from __future__ import annotations

import argparse
import sys
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

from connectors.google_drive_client import (  # noqa: E402
    ENV_PATH,
    get_client,
    get_credentials,
    list_files,
    save_env_value,
    SCOPE_READONLY,
)


def run_authorize_flow(client_id: str, client_secret: str) -> str:
    try:
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError as exc:
        raise SystemExit(
            "Install google-auth-oauthlib for local browser auth:\n"
            "  .venv/bin/pip install google-auth-oauthlib\n"
            "Or use OAuth Playground — see knowledge/10_automation/google_drive_setup.md"
        ) from exc

    client_config = {
        "installed": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost"],
        }
    }
    flow = InstalledAppFlow.from_client_config(client_config, scopes=[SCOPE_READONLY])
    creds = flow.run_local_server(port=0)
    if not creds.refresh_token:
        raise RuntimeError("No refresh token returned — revoke app access and retry")
    return creds.refresh_token


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--authorize", action="store_true")
    parser.add_argument(
        "--query",
        default="name contains 'logo' or name contains 'PNG Transparent'",
    )
    parser.add_argument("--page-size", type=int, default=10)
    args = parser.parse_args()

    if args.authorize:
        client_id, client_secret, _ = get_credentials()
        if not client_id or not client_secret:
            print("Set GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET first", file=sys.stderr)
            return 1
        token = run_authorize_flow(client_id, client_secret)
        save_env_value(ENV_PATH, "GOOGLE_DRIVE_REFRESH_TOKEN", token)
        print(f"Saved GOOGLE_DRIVE_REFRESH_TOKEN to {ENV_PATH}")

    try:
        _, _, _, access_token = get_client()
        files = list_files(access_token, query=args.query, page_size=args.page_size)
    except (RuntimeError, urllib.error.HTTPError) as err:
        print(f"Drive error: {err}", file=sys.stderr)
        return 1

    print("OK — Google Drive API reachable")
    print(f"Query: {args.query}")
    print(f"Found {len(files)} file(s):")
    for item in files:
        print(f"  - {item.get('name')} ({item.get('mimeType')})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
