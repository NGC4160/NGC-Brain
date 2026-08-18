# Agent workflow — distill today's Omi day into memories

Run after `scripts/ingest_omi.py` (or ask the agent to run it).

---

You are my second-brain editor. For date **{{YYYY-MM-DD}}**:

1. Read `Daily/{{YYYY-MM-DD}}.md` and all linked notes under `Daily/Conversations/`.
2. Extract only durable truths:
   - Decisions (with why)
   - Commitments / action items (owner + due if known)
   - Risks / open questions
   - People + context worth remembering
3. Write:
   - `Daily/Reflections/{{YYYY-MM-DD}}-reflection.md` (narrative)
   - Optionally create Omi memories via MCP `create_memory` for 1–5 high-signal items using titles like `[project] decision — …`
4. Update any matching `Projects/` note with a “Log” bullet for today.
5. Leave noisy chatter out. Prefer fewer, sharper memories.

Privacy: strip passwords, account numbers, health details of others, and anything said in confidence.

---

CLI alternative (local LLM):

```bash
PYTHONPATH=src python scripts/daily_reflect.py --date {{YYYY-MM-DD}}
```
