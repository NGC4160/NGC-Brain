"""Write Omi-derived Markdown into an Obsidian PARA vault."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from omi_brain.config import Settings


class VaultWriter:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.vault = settings.vault_path

    def write_conversation(
        self,
        conversation: dict[str, Any],
        enriched: dict[str, Any],
        transcript: str,
    ) -> Path:
        cid = str(conversation.get("id") or "unknown")
        started = _parse_dt(conversation.get("started_at") or conversation.get("created_at"))
        day = (started or datetime.now(timezone.utc)).strftime("%Y-%m-%d")
        slug = _slug(enriched.get("title") or cid)[:60]
        filename = f"{day}-{slug}-{cid[-8:]}.md"
        rel_dir = self.settings.conversations_dir
        path = self.vault / rel_dir / filename
        path.parent.mkdir(parents=True, exist_ok=True)

        tags = enriched.get("tags") or list(self.settings.default_tags)
        tag_line = " ".join(f"#{t}" for t in tags)
        key_points = enriched.get("key_points") or []
        actions = enriched.get("action_items") or []
        people = enriched.get("people") or []
        projects = enriched.get("projects") or []

        banner = ""
        if self.settings.consent_banner:
            banner = (
                "> [!warning] Privacy\n"
                "> Auto-ingested from Omi. Review before sharing. "
                "Do not paste secrets, passwords, or others' private data without consent.\n\n"
            )

        body_parts = [
            "---",
            f"id: {cid}",
            "source: omi",
            f"created: {conversation.get('created_at') or ''}",
            f"started: {conversation.get('started_at') or ''}",
            f"finished: {conversation.get('finished_at') or ''}",
            f"category: {(conversation.get('structured') or {}).get('category') or ''}",
            f"enrichment: {enriched.get('source') or ''}",
            f"tags: [{', '.join(tags)}]",
            "---",
            "",
            banner + f"# {enriched.get('title') or 'Conversation'}",
            "",
            tag_line,
            "",
            "## Summary",
            "",
            enriched.get("summary") or "_No summary_",
            "",
        ]

        if key_points:
            body_parts += ["## Key points", ""]
            body_parts += [f"- {p}" for p in key_points]
            body_parts.append("")

        if actions:
            body_parts += ["## Action items", ""]
            for a in actions:
                if isinstance(a, dict):
                    task = a.get("task") or a.get("description") or ""
                    due = a.get("due_hint") or ""
                    suffix = f" _(due: {due})_" if due else ""
                    body_parts.append(f"- [ ] {task}{suffix}")
                else:
                    body_parts.append(f"- [ ] {a}")
            body_parts.append("")

        if people:
            body_parts += ["## People", "", ", ".join(str(p) for p in people), ""]
        if projects:
            body_parts += ["## Related projects / topics", ""]
            body_parts += [f"- [[{p}]]" for p in projects]
            body_parts.append("")

        if self.settings.save_transcripts and transcript:
            body_parts += ["## Transcript", "", transcript, ""]
        elif not self.settings.save_transcripts:
            body_parts += [
                "## Transcript",
                "",
                "_Transcript omitted (INGEST_SAVE_TRANSCRIPTS=false). "
                f"Retrieve via Omi MCP `get_conversation_by_id` with id `{cid}`._",
                "",
            ]

        if not self.settings.omit_geolocation and conversation.get("geolocation"):
            geo = conversation["geolocation"]
            body_parts += [
                "## Location",
                "",
                f"- lat: {geo.get('latitude')}",
                f"- lon: {geo.get('longitude')}",
                "",
            ]

        body_parts += [
            "---",
            f"_Ingested by omi-second-brain at {datetime.now(timezone.utc).isoformat()}_",
            "",
        ]
        path.write_text("\n".join(body_parts), encoding="utf-8")
        return path

    def write_memory(self, memory: dict[str, Any]) -> Path:
        mid = str(memory.get("id") or "mem")
        content = (
            memory.get("content")
            or memory.get("text")
            or memory.get("memory")
            or memory.get("description")
            or ""
        )
        category = memory.get("category") or "general"
        created = _parse_dt(memory.get("created_at") or memory.get("updated_at"))
        day = (created or datetime.now(timezone.utc)).strftime("%Y-%m-%d")
        slug = _slug(content[:50] or mid)
        path = self.vault / self.settings.memories_dir / f"{day}-{slug}-{mid[-8:]}.md"
        path.parent.mkdir(parents=True, exist_ok=True)
        tags = list(self.settings.default_tags) + ["memory", str(category).lower()]
        body = "\n".join(
            [
                "---",
                f"id: {mid}",
                "source: omi-memory",
                f"category: {category}",
                f"created: {memory.get('created_at') or ''}",
                f"tags: [{', '.join(tags)}]",
                "---",
                "",
                f"# Memory — {category}",
                "",
                " ".join(f"#{t}" for t in tags),
                "",
                str(content).strip(),
                "",
            ]
        )
        path.write_text(body, encoding="utf-8")
        return path

    def write_task_note(self, items: list[dict[str, Any]], day: str | None = None) -> Path | None:
        if not items:
            return None
        day = day or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        path = self.vault / self.settings.tasks_dir / f"{day}-omi-tasks.md"
        path.parent.mkdir(parents=True, exist_ok=True)
        lines = [
            "---",
            "source: omi-action-items",
            f"date: {day}",
            "tags: [omi, tasks]",
            "---",
            "",
            f"# Omi tasks — {day}",
            "",
        ]
        for item in items:
            desc = item.get("description") or item.get("task") or item.get("content") or ""
            due = item.get("due_at") or item.get("due_hint") or ""
            iid = item.get("id") or ""
            suffix = f" ⏳ {due}" if due else ""
            lines.append(f"- [ ] {desc}{suffix} <!-- omi:{iid} -->")
        lines.append("")
        # Append if file exists (dedupe by omi id comment)
        existing = path.read_text(encoding="utf-8") if path.exists() else ""
        new_lines = [ln for ln in lines if ln.startswith("- [ ]")]
        to_add = [ln for ln in new_lines if ln not in existing]
        if path.exists() and to_add:
            with path.open("a", encoding="utf-8") as f:
                f.write("\n".join(to_add) + "\n")
        elif not path.exists():
            path.write_text("\n".join(lines), encoding="utf-8")
        return path

    def write_daily_reflection(self, day: str, content: str) -> Path:
        path = self.vault / self.settings.reflections_dir / f"{day}-reflection.md"
        path.parent.mkdir(parents=True, exist_ok=True)
        body = "\n".join(
            [
                "---",
                f"date: {day}",
                "source: omi-second-brain",
                "tags: [omi, reflection, daily]",
                "---",
                "",
                f"# Daily reflection — {day}",
                "",
                content.strip(),
                "",
            ]
        )
        path.write_text(body, encoding="utf-8")
        return path

    def append_daily_index(self, day: str, note_paths: list[Path]) -> Path:
        """Maintain Daily/YYYY-MM-DD.md linking to ingested conversations."""
        path = self.vault / self.settings.daily_dir / f"{day}.md"
        path.parent.mkdir(parents=True, exist_ok=True)
        links = []
        for p in note_paths:
            rel = p.relative_to(self.vault).as_posix()
            wikilink = rel[:-3] if rel.endswith(".md") else rel
            links.append(f"- [[{wikilink}]]")
        header = [
            "---",
            f"date: {day}",
            "tags: [daily, omi]",
            "---",
            "",
            f"# {day}",
            "",
            "## Omi conversations",
            "",
        ]
        if not path.exists():
            path.write_text("\n".join(header + links + [""]), encoding="utf-8")
        else:
            text = path.read_text(encoding="utf-8")
            additions = [ln for ln in links if ln not in text]
            if additions:
                with path.open("a", encoding="utf-8") as f:
                    if "## Omi conversations" not in text:
                        f.write("\n## Omi conversations\n\n")
                    f.write("\n".join(additions) + "\n")
        return path


def _slug(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "note"


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt
