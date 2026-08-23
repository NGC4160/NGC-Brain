"""Clean transcripts, summarize with local Ollama, extract tags/tasks."""

from __future__ import annotations

import json
import re
from typing import Any

import httpx

from omi_brain.config import Settings


SUMMARIZE_PROMPT = """You are a personal knowledge assistant. Summarize this Omi wearable conversation
for an Obsidian second-brain note. Be concise and factual.

Return ONLY valid JSON with keys:
- title: short title (max 80 chars)
- summary: 3-6 sentence overview
- key_points: array of bullet strings (max 8)
- tags: array of short lowercase tags (max 8, no #)
- action_items: array of objects {{"task": "...", "due_hint": "optional"}}
- people: array of names mentioned (if any)
- projects: array of project/topic names if inferable

Conversation metadata:
Title: {title}
Category: {category}
Overview from Omi: {overview}

Transcript:
{transcript}
"""


class Processor:
    def __init__(self, settings: Settings):
        self.settings = settings

    def transcript_text(self, conversation: dict[str, Any]) -> str:
        segments = (
            conversation.get("transcript_segments")
            or conversation.get("transcript")
            or conversation.get("segments")
            or []
        )
        if isinstance(segments, str):
            return segments.strip()
        lines: list[str] = []
        for seg in segments:
            if not isinstance(seg, dict):
                continue
            speaker = seg.get("speaker") or seg.get("speaker_id") or "Speaker"
            text = (seg.get("text") or seg.get("content") or "").strip()
            if text:
                lines.append(f"**{speaker}:** {text}")
        return "\n\n".join(lines)

    def segment_count(self, conversation: dict[str, Any]) -> int:
        segments = conversation.get("transcript_segments") or conversation.get("segments") or []
        if isinstance(segments, str):
            return 1 if segments.strip() else 0
        return len(segments) if isinstance(segments, list) else 0

    def redact(self, text: str) -> str:
        out = text
        for pattern in self.settings.redact_patterns:
            try:
                out = re.sub(pattern, "[REDACTED]", out)
            except re.error:
                continue
        return out

    def structured_from_omi(self, conversation: dict[str, Any]) -> dict[str, Any]:
        structured = conversation.get("structured") or {}
        action_items = structured.get("action_items") or []
        tasks = []
        for item in action_items:
            if isinstance(item, dict):
                desc = item.get("description") or item.get("task") or ""
                if desc:
                    tasks.append({"task": desc, "due_hint": item.get("due_at") or ""})
            elif isinstance(item, str):
                tasks.append({"task": item, "due_hint": ""})
        tags = list(self.settings.default_tags)
        category = structured.get("category")
        if category:
            tags.append(str(category).lower().replace(" ", "-"))
        return {
            "title": structured.get("title") or conversation.get("id") or "Untitled conversation",
            "summary": structured.get("overview") or "",
            "key_points": [],
            "tags": tags,
            "action_items": tasks,
            "people": [],
            "projects": [],
            "source": "omi_structured",
        }

    def enrich_with_llm(self, conversation: dict[str, Any], transcript: str) -> dict[str, Any]:
        """Prefer Ollama local LLM; fall back to Omi structured fields."""
        base = self.structured_from_omi(conversation)
        if not transcript or not self.settings.local_only and not self._ollama_up():
            # Still try Ollama when local_only; if down, return structured
            pass
        if not self._ollama_up():
            base["source"] = "omi_structured_fallback"
            return base

        structured = conversation.get("structured") or {}
        prompt = SUMMARIZE_PROMPT.format(
            title=structured.get("title") or "",
            category=structured.get("category") or "",
            overview=structured.get("overview") or "",
            transcript=transcript[:12000],
        )
        try:
            raw = self._ollama_chat(prompt)
            parsed = _extract_json(raw)
            if not parsed:
                return base
            # Merge: LLM fills gaps; keep Omi action items if LLM empty
            merged = {
                "title": parsed.get("title") or base["title"],
                "summary": parsed.get("summary") or base["summary"],
                "key_points": parsed.get("key_points") or [],
                "tags": _uniq(list(self.settings.default_tags) + list(parsed.get("tags") or [])),
                "action_items": parsed.get("action_items") or base["action_items"],
                "people": parsed.get("people") or [],
                "projects": parsed.get("projects") or [],
                "source": "ollama",
            }
            return merged
        except Exception:
            base["source"] = "omi_structured_error_fallback"
            return base

    def _ollama_up(self) -> bool:
        try:
            with httpx.Client(base_url=self.settings.ollama_base_url, timeout=3.0) as client:
                r = client.get("/api/tags")
                return r.status_code == 200
        except Exception:
            return False

    def _ollama_chat(self, prompt: str) -> str:
        with httpx.Client(base_url=self.settings.ollama_base_url, timeout=120.0) as client:
            r = client.post(
                "/api/chat",
                json={
                    "model": self.settings.llm_model,
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                    "format": "json",
                },
            )
            r.raise_for_status()
            data = r.json()
            return (data.get("message") or {}).get("content") or ""


def _extract_json(text: str) -> dict[str, Any] | None:
    text = text.strip()
    try:
        obj = json.loads(text)
        return obj if isinstance(obj, dict) else None
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", text)
        if not match:
            return None
        try:
            obj = json.loads(match.group(0))
            return obj if isinstance(obj, dict) else None
        except json.JSONDecodeError:
            return None


def _uniq(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for item in items:
        key = str(item).strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(key)
    return out
