"""QuickBooks Online API client — OAuth refresh token + accounting reports."""

from __future__ import annotations

import base64
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, timedelta
from pathlib import Path
from typing import Any

TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
API_BASE = {
    "production": "https://quickbooks.api.intuit.com",
    "sandbox": "https://sandbox-quickbooks.api.intuit.com",
}


def load_dotenv(path: Path | None = None) -> None:
    """Minimal .env loader — no dependency."""
    env_path = path or Path.cwd() / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key, val = key.strip(), val.strip().strip("'\"")
        if key and key not in os.environ:
            os.environ[key] = val


class QBOClient:
    def __init__(
        self,
        client_id: str | None = None,
        client_secret: str | None = None,
        realm_id: str | None = None,
        refresh_token: str | None = None,
        environment: str | None = None,
    ) -> None:
        load_dotenv()
        self.client_id = client_id or os.environ.get("QBO_CLIENT_ID", "")
        self.client_secret = client_secret or os.environ.get("QBO_CLIENT_SECRET", "")
        self.realm_id = realm_id or os.environ.get("QBO_REALM_ID", "")
        self.refresh_token = refresh_token or os.environ.get("QBO_REFRESH_TOKEN", "")
        self.environment = (environment or os.environ.get("QBO_ENVIRONMENT", "production")).lower()
        self._access_token: str | None = None

        missing = [
            name
            for name, val in [
                ("QBO_CLIENT_ID", self.client_id),
                ("QBO_CLIENT_SECRET", self.client_secret),
                ("QBO_REALM_ID", self.realm_id),
                ("QBO_REFRESH_TOKEN", self.refresh_token),
            ]
            if not val
        ]
        if missing:
            raise ValueError(
                f"{', '.join(missing)} not set. See knowledge/10_automation/qbo_api_setup.md"
            )
        if self.environment not in API_BASE:
            raise ValueError("QBO_ENVIRONMENT must be 'production' or 'sandbox'")

    @property
    def base_url(self) -> str:
        return API_BASE[self.environment]

    def refresh_access_token(self) -> str:
        creds = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()
        body = urllib.parse.urlencode(
            {"grant_type": "refresh_token", "refresh_token": self.refresh_token}
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
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                payload = json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"QBO token refresh failed HTTP {e.code}: {err[:500]}") from e

        token = payload.get("access_token")
        if not token:
            raise RuntimeError(f"QBO token refresh missing access_token: {payload}")
        self._access_token = token
        # Intuit may rotate refresh tokens — callers can persist if returned
        new_refresh = payload.get("refresh_token")
        if new_refresh:
            self.refresh_token = new_refresh
        return token

    def access_token(self) -> str:
        if not self._access_token:
            return self.refresh_access_token()
        return self._access_token

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.access_token()}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def request(
        self,
        method: str,
        path: str,
        *,
        query: dict[str, Any] | None = None,
        body: dict[str, Any] | None = None,
        retry_on_401: bool = True,
    ) -> Any:
        url = f"{self.base_url}{path}"
        if query:
            url += "?" + urllib.parse.urlencode({k: v for k, v in query.items() if v is not None})

        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(url, data=data, headers=self._headers(), method=method.upper())
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as e:
            if e.code == 401 and retry_on_401:
                self._access_token = None
                self.refresh_access_token()
                return self.request(method, path, query=query, body=body, retry_on_401=False)
            err_body = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"QBO API {method} {path} → HTTP {e.code}: {err_body[:500]}") from e

    def company_path(self, suffix: str) -> str:
        return f"/v3/company/{self.realm_id}{suffix}"

    def get_report(self, report_name: str, **params: Any) -> dict:
        q = {"minorversion": "65", **params}
        return self.request("GET", self.company_path(f"/reports/{report_name}"), query=q)

    def query(self, sql: str) -> dict:
        return self.request(
            "GET",
            self.company_path("/query"),
            query={"query": sql, "minorversion": "65"},
        )

    def test_connection(self) -> dict:
        result = self.query("select Id, CompanyName from CompanyInfo")
        return {"ok": True, "environment": self.environment, "company_info": result}

    @staticmethod
    def last_12_months_range() -> tuple[str, str]:
        end = date.today()
        start = end - timedelta(days=365)
        return start.isoformat(), end.isoformat()
