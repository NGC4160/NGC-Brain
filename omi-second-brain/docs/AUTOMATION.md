# Automation examples

## Nightly pipeline

`scripts/scheduler/nightly_run.sh` runs:

1. `ingest_omi.py` — pull conversations / memories / tasks → Markdown  
2. `embed_vault.py` — refresh local Chroma index  
3. `daily_reflect.py` — Ollama reflection note  

macOS: `install_launchd.sh`  
Linux: `cron.example`

## Cursor agent loops

| Goal | Prompt file |
|------|-------------|
| Ground coding in recordings | [`prompts/cursor_query_brain.md`](../prompts/cursor_query_brain.md) |
| Distill a day into memories | [`prompts/daily_distill.md`](../prompts/daily_distill.md) |
| Weekly review | [`prompts/weekly_reflection.md`](../prompts/weekly_reflection.md) |

## Suggested agent workflow (daily)

```text
[Evening]
  launchd/cron → ingest → embed → reflect
[Next morning in Cursor]
  "Summarize yesterday's reflection and open tasks; propose today's top 3."
  Use Omi MCP search_memories for anything missing from the vault.
[After a decision]
  create_memory via Omi MCP with title "[project] decision — ..."
  Optionally write the same into Projects/<name>.md
```

## Task → calendar

```bash
PYTHONPATH=src python scripts/extract_tasks.py --ics ./data/omi_tasks.ics
```

Import the ICS into Apple Calendar, or subscribe if you host the file locally via a private path.

## Searching Cursor history

Cursor chat history is separate from Omi. Options:

1. Point filesystem MCP at your Cursor project logs **only if** you accept that sensitivity.
2. Manually paste decisions into Obsidian / Omi `create_memory`.
3. Use this vault as the system of record: after important Cursor sessions, run the distill prompt and save outcomes under `Projects/`.

## Extending

- Webhook path: Omi Apps can push on memory-created events — add `scripts/webhook_server.py` later if you want near-real-time instead of nightly.
- Self-hosted Omi: set `OMI_API_BASE` / `OMI_API_BASE_URL` per Omi docs.
