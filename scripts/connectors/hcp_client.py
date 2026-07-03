"""Housecall Pro Public API client (MAX plan). Auth: Authorization: Token <api_key>"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

DEFAULT_BASE = "https://api.housecallpro.com"


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


class HCPClient:
    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        company_id: str | None = None,
    ) -> None:
        load_dotenv()
        self.api_key = api_key or os.environ.get("HCP_API_KEY", "")
        if not self.api_key:
            raise ValueError(
                "HCP_API_KEY not set. Add to .env — see knowledge/10_automation/hcp_api_setup.md"
            )
        self.base_url = (base_url or os.environ.get("HCP_BASE_URL", DEFAULT_BASE)).rstrip("/")
        self.company_id = company_id or os.environ.get("HCP_COMPANY_ID")

    def _headers(self) -> dict[str, str]:
        h = {
            "Authorization": f"Token {self.api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        if self.company_id:
            h["X-Company-Id"] = self.company_id
        return h

    def request(
        self,
        method: str,
        path: str,
        *,
        query: dict[str, Any] | None = None,
        body: dict[str, Any] | None = None,
    ) -> Any:
        url = f"{self.base_url}{path}"
        if query:
            url += "?" + urllib.parse.urlencode({k: v for k, v in query.items() if v is not None})

        data = None
        if body is not None:
            data = json.dumps(body).encode("utf-8")

        req = urllib.request.Request(url, data=data, headers=self._headers(), method=method.upper())
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"HCP API {method} {path} → HTTP {e.code}: {err_body[:500]}") from e

    def get(self, path: str, **query: Any) -> Any:
        return self.request("GET", path, query=query or None)

    def get_company(self) -> Any:
        for path in ("/company", "/v1/company", "/api/company"):
            try:
                return self.get(path)
            except RuntimeError:
                continue
        raise RuntimeError("Could not fetch company — check API key permissions")

    def list_jobs(self, *, page: int = 1, page_size: int = 50, **filters: Any) -> Any:
        params: dict[str, Any] = {"page": page, "page_size": page_size, **filters}
        for path in ("/jobs", "/v1/jobs", "/api/jobs"):
            try:
                return self.get(path, **params)
            except RuntimeError:
                continue
        raise RuntimeError("Could not list jobs")

    def list_all_jobs(self, max_pages: int = 20, **filters: Any) -> list[Any]:
        """Paginate jobs — stops at max_pages or empty page."""
        all_jobs: list[Any] = []
        for page in range(1, max_pages + 1):
            data = self.list_jobs(page=page, page_size=50, **filters)
            jobs = _extract_list(data, ("jobs", "data", "results"))
            if not jobs:
                break
            all_jobs.extend(jobs)
            if len(jobs) < 50:
                break
        return all_jobs

    def list_pricebook_services(self, page: int = 1, page_size: int = 200) -> Any:
        """GET /api/price_book/services — canonical HCP pricebook services endpoint."""
        return self.get("/api/price_book/services", page=page, page_size=page_size)

    def list_pricebook_material_categories(self, page: int = 1, page_size: int = 200) -> Any:
        return self.get("/api/price_book/material_categories", page=page, page_size=page_size)

    def list_pricebook_materials(
        self, *, page: int = 1, page_size: int = 200, category_uuid: str | None = None
    ) -> Any:
        params: dict[str, Any] = {"page": page, "page_size": page_size}
        if category_uuid:
            params["category_uuid"] = category_uuid
        return self.get("/api/price_book/materials", **params)

    def list_all_pricebook_services(self, max_pages: int = 50) -> list[Any]:
        """Paginate all pricebook services."""
        all_items: list[Any] = []
        total_pages = 1
        for page in range(1, max_pages + 1):
            if page > total_pages:
                break
            data = self.list_pricebook_services(page=page, page_size=200)
            if isinstance(data, dict):
                total_pages = int(data.get("total_pages_count") or 1)
            items = _extract_list(data, ("data", "services", "results", "pricebook_services"))
            if not items:
                break
            all_items.extend(items)
        return all_items

    def test_connection(self) -> dict[str, Any]:
        """Verify API key — returns company summary or error."""
        company = self.get_company()
        return {
            "ok": True,
            "company_keys": list(company.keys()) if isinstance(company, dict) else str(type(company)),
            "company_preview": _safe_preview(company),
        }


def _extract_list(data: Any, keys: tuple[str, ...]) -> list[Any]:
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for k in keys:
            if k in data and isinstance(data[k], list):
                return data[k]
    return []


def _safe_preview(obj: Any, limit: int = 800) -> str:
    text = json.dumps(obj, default=str)[:limit]
    return text + ("..." if len(text) >= limit else "")
