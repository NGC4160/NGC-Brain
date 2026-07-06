#!/usr/bin/env python3
"""Google Drive OAuth helper — get refresh token or test existing credentials."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENV_PATH = ROOT / ".env"
TOKEN_URL = "https://oauth2.googleapis.com/token"
DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files"
SCOPE_READONLY = "https://www.googleapis.com/auth/drive.readonly"


def load_dotenv(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def save_env_value(path: Path, key: str, value: str) -> None:
    lines: list[str] = []
    found = False
    if path.exists():
        for line in path.read_text().splitlines():
            if line.startswith(f"{key}="):
                lines.append(f"{key}={value}")
                found = True
            else:
                lines.append(line)
    if not found:
        lines.append(f"{key}={value}")
    path.write_text("\n".join(lines) + "\n")


def get_access_token(client_id: str, client_secret: str, refresh_token: str) -> str:
    data = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }
    ).encode()
    req = urllib.request.Request(TOKEN_URL, data=data, method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.loads(resp.read().decode())
    token = payload.get("access_token")
    if not token:
        raise RuntimeError(f"No access_token in response: {payload}")
    return token


def list_drive_files(access_token: str, query: str | None = None, page_size: int = 10) -> list[dict]:
    params: dict[str, str] = {
        "pageSize": str(page_size),
        "fields": "files(id,name,mimeType,modifiedTime)",
    }
    if query:
        params["q"] = query
    url = f"{DRIVE_FILES_URL}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {access_token}"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.loads(resp.read().decode())
    return payload.get("files", [])


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
            "token_uri": TOKEN_URL,
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
    parser.add_argument(
        "--authorize",
        action="store_true",
        help="Open browser OAuth flow and save GOOGLE_DRIVE_REFRESH_TOKEN to .env",
    )
    parser.add_argument(
        "--query",
        default="name contains 'logo' or name contains 'PNG Transparent'",
        help="Drive search query for test listing",
    )
    parser.add_argument("--page-size", type=int, default=10)
    args = parser.parse_args()

    file_env = load_dotenv(ENV_PATH)
    client_id = os.environ.get("GOOGLE_DRIVE_CLIENT_ID") or file_env.get("GOOGLE_DRIVE_CLIENT_ID", "")
    client_secret = os.environ.get("GOOGLE_DRIVE_CLIENT_SECRET") or file_env.get(
        "GOOGLE_DRIVE_CLIENT_SECRET", ""
    )
    refresh_token = os.environ.get("GOOGLE_DRIVE_REFRESH_TOKEN") or file_env.get(
        "GOOGLE_DRIVE_REFRESH_TOKEN", ""
    )

    if not client_id or not client_secret:
        print("Missing GOOGLE_DRIVE_CLIENT_ID or GOOGLE_DRIVE_CLIENT_SECRET in .env", file=sys.stderr)
        print("See knowledge/10_automation/google_drive_setup.md", file=sys.stderr)
        return 1

    if args.authorize:
        token = run_authorize_flow(client_id, client_secret)
        save_env_value(ENV_PATH, "GOOGLE_DRIVE_REFRESH_TOKEN", token)
        print(f"Saved GOOGLE_DRIVE_REFRESH_TOKEN to {ENV_PATH}")
        refresh_token = token

    if not refresh_token:
        print("Missing GOOGLE_DRIVE_REFRESH_TOKEN.", file=sys.stderr)
        print("Use OAuth Playground or: ./scripts/setup/google_drive_auth.py --authorize", file=sys.stderr)
        return 1

    try:
        access_token = get_access_token(client_id, client_secret, refresh_token)
        files = list_drive_files(access_token, query=args.query, page_size=args.page_size)
    except urllib.error.HTTPError as err:
        body = err.read().decode(errors="replace")
        print(f"Drive API error ({err.code}): {body}", file=sys.stderr)
        return 1

    print("OK — Google Drive API reachable")
    print(f"Query: {args.query}")
    print(f"Found {len(files)} file(s):")
    for item in files:
        print(f"  - {item.get('name')} ({item.get('mimeType')})")
    if not files:
        print("  (no matches — try a broader --query)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
