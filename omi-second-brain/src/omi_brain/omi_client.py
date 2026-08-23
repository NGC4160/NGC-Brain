"""Thin client for the Omi Developer API (REST).

Docs: https://docs.omi.me/doc/developer/api/overview
Base: https://api.omi.me/v1/dev

Important: use omi_dev_... keys here. omi_mcp_... keys only work on /v1/mcp/sse.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Iterator

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from omi_brain.config import Settings


class OmiAPIError(RuntimeError):
    def __init__(self, status: int, body: str):
        super().__init__(f"Omi API {status}: {body[:500]}")
        self.status = status
        self.body = body


class OmiClient:
    def __init__(self, settings: Settings, session: requests.Session | None = None):
        self.settings = settings
        self.base = settings.omi_api_base.rstrip("/")
        self.session = session or requests.Session()
        self.session.headers.update(
            {
                "Authorization": f"Bearer {settings.omi_dev_api_key}",
                "Accept": "application/json",
                "User-Agent": "omi-second-brain/0.1",
            }
        )

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=20))
    def _get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        url = f"{self.base}{path}"
        resp = self.session.get(url, params=params or {}, timeout=60)
        if resp.status_code == 429:
            raise OmiAPIError(429, resp.text)  # tenacity will retry
        if resp.status_code >= 400:
            raise OmiAPIError(resp.status_code, resp.text)
        if resp.status_code == 204 or not resp.content:
            return {}
        return resp.json()

    def list_conversations(
        self,
        *,
        limit: int = 50,
        offset: int = 0,
        start_date: str | None = None,
        end_date: str | None = None,
        statuses: list[str] | None = None,
    ) -> dict[str, Any]:
        """GET /user/conversations — metadata list (no full transcript)."""
        params: dict[str, Any] = {"limit": limit, "offset": offset}
        if start_date:
            params["start_date"] = start_date
        if end_date:
            params["end_date"] = end_date
        if statuses:
            # API may accept repeated status or comma; send as repeated via requests list
            params["statuses"] = statuses
        return self._get("/user/conversations", params)

    def get_conversation(self, conversation_id: str, *, include_transcript: bool = True) -> dict[str, Any]:
        """GET /user/conversations/{id}?include_transcript=true"""
        return self._get(
            f"/user/conversations/{conversation_id}",
            {"include_transcript": str(include_transcript).lower()},
        )

    def iter_conversations_since(self, since: datetime) -> Iterator[dict[str, Any]]:
        """Paginate conversations, yielding those finished/created after `since`."""
        if since.tzinfo is None:
            since = since.replace(tzinfo=timezone.utc)
        start_date = since.date().isoformat()
        offset = 0
        limit = self.settings.page_limit
        while True:
            payload = self.list_conversations(limit=limit, offset=offset, start_date=start_date)
            items = _extract_list(payload, "conversations")
            if not items:
                break
            for item in items:
                if _conversation_is_fresh(item, since):
                    yield item
            if len(items) < limit:
                break
            offset += limit

    def list_memories(
        self,
        *,
        limit: int = 50,
        offset: int = 0,
        updated_after: str | None = None,
    ) -> dict[str, Any]:
        params: dict[str, Any] = {"limit": limit, "offset": offset}
        if updated_after:
            params["updated_after"] = updated_after
        return self._get("/user/memories", params)

    def iter_memories_since(self, since: datetime) -> Iterator[dict[str, Any]]:
        if since.tzinfo is None:
            since = since.replace(tzinfo=timezone.utc)
        updated_after = since.isoformat().replace("+00:00", "Z")
        offset = 0
        limit = self.settings.page_limit
        while True:
            payload = self.list_memories(limit=limit, offset=offset, updated_after=updated_after)
            items = _extract_list(payload, "memories")
            if not items:
                break
            for item in items:
                yield item
            if len(items) < limit:
                break
            offset += limit

    def list_action_items(
        self,
        *,
        limit: int = 50,
        offset: int = 0,
        completed: bool | None = False,
    ) -> dict[str, Any]:
        params: dict[str, Any] = {"limit": limit, "offset": offset}
        if completed is not None:
            params["completed"] = str(completed).lower()
        return self._get("/user/action-items", params)

    def iter_open_action_items(self) -> Iterator[dict[str, Any]]:
        offset = 0
        limit = self.settings.page_limit
        while True:
            payload = self.list_action_items(limit=limit, offset=offset, completed=False)
            items = _extract_list(payload, "action_items")
            if not items:
                break
            for item in items:
                yield item
            if len(items) < limit:
                break
            offset += limit


def _extract_list(payload: Any, key: str) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [x for x in payload if isinstance(x, dict)]
    if isinstance(payload, dict):
        for candidate in (key, "data", "items", "results"):
            val = payload.get(candidate)
            if isinstance(val, list):
                return [x for x in val if isinstance(x, dict)]
    return []


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    text = value.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(text)
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _conversation_is_fresh(item: dict[str, Any], since: datetime) -> bool:
    for key in ("finished_at", "updated_at", "created_at", "started_at"):
        dt = _parse_dt(item.get(key))
        if dt and dt >= since:
            return True
    # If timestamps missing, keep it (safe default for first runs)
    if not any(item.get(k) for k in ("finished_at", "updated_at", "created_at", "started_at")):
        return True
    return False
