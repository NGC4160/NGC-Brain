#!/usr/bin/env python3
"""One-time OAuth helper — exchange Intuit auth code for QBO_REFRESH_TOKEN."""

from __future__ import annotations

import base64
import json
import os
import sys
import urllib.parse
import urllib.request
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from threading import Thread

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "connectors"))

from qbo_client import load_dotenv  # noqa: E402

REDIRECT_URI = "http://localhost:8000/callback"
AUTH_URL = "https://appcenter.intuit.com/connect/oauth2"
TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
SCOPE = "com.intuit.quickbooks.accounting"

auth_code: str | None = None
realm_id: str | None = None


class CallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        global auth_code, realm_id
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != "/callback":
            self.send_response(404)
            self.end_headers()
            return
        params = urllib.parse.parse_qs(parsed.query)
        auth_code = (params.get("code") or [None])[0]
        realm_id = (params.get("realmId") or [None])[0]
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(b"<h1>QBO authorized. Return to terminal.</h1>")

    def log_message(self, format: str, *args: object) -> None:
        return


def exchange_code(client_id: str, client_secret: str, code: str) -> dict:
    creds = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    body = urllib.parse.urlencode(
        {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URI,
        }
    ).encode()
    req = urllib.request.Request(
        TOKEN_URL,
        data=body,
        headers={
            "Authorization": f"Basic {creds}",
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


def main() -> int:
    load_dotenv(ROOT / ".env")
    client_id = os.environ.get("QBO_CLIENT_ID", "")
    client_secret = os.environ.get("QBO_CLIENT_SECRET", "")
    if not client_id or not client_secret:
        print("Set QBO_CLIENT_ID and QBO_CLIENT_SECRET in .env first.", file=sys.stderr)
        return 1

    params = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "redirect_uri": REDIRECT_URI,
            "response_type": "code",
            "scope": SCOPE,
            "state": "ngc-qbo-setup",
        }
    )
    url = f"{AUTH_URL}?{params}"
    print("Opening browser for Intuit authorization...")
    print(f"If it does not open: {url}\n")

    server = HTTPServer(("localhost", 8000), CallbackHandler)
    thread = Thread(target=server.handle_request, daemon=True)
    thread.start()
    webbrowser.open(url)
    thread.join(timeout=300)
    server.server_close()

    if not auth_code:
        print("No authorization code received.", file=sys.stderr)
        return 1

    tokens = exchange_code(client_id, client_secret, auth_code)
    refresh = tokens.get("refresh_token")
    if not refresh:
        print(f"No refresh_token in response: {tokens}", file=sys.stderr)
        return 1

    print("\n=== Add to .env and GitHub Actions secrets ===\n")
    print(f"QBO_REFRESH_TOKEN={refresh}")
    if realm_id:
        print(f"QBO_REALM_ID={realm_id}")
    print(f"QBO_ENVIRONMENT=production")
    print("\nThen test: ./scripts/sync/sync_qbo_api.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
