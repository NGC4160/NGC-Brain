# Omi Second Brain

Local-first **second brain** that pulls all-day [Omi](https://www.omi.me/) transcripts/memories into an **Obsidian** PARA vault, indexes them with **Ollama + Chroma**, and exposes everything to **Cursor / Claude / Grok** via **MCP**.

```text
Omi pendant → Omi cloud
                 ├─ MCP (omi_mcp_...)  → Cursor / Claude live search
                 └─ Dev API (omi_dev_...) → nightly ingest → Obsidian
                                              → Ollama enrich
                                              → Chroma RAG MCP
```

> This folder is a **standalone starter** inside the NGC-Brain monorepo. Copy `omi-second-brain/` anywhere and treat it as its own project if you prefer.

## Quick start

1. **Omi app** — create both keys (`omi_mcp_...` and `omi_dev_...`). See [docs/SETUP.md](docs/SETUP.md).
2. **Python 3.11+**

   ```bash
   cd omi-second-brain
   python3 -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   # edit .env → OMI_DEV_API_KEY, OBSIDIAN_VAULT_PATH
   ```

3. **Vault** — copy `vault_template/` to your Obsidian path (PARA folders included).
4. **Ollama** — `ollama pull llama3.2 && ollama pull nomic-embed-text`
5. **Ingest**

   ```bash
   export PYTHONPATH=src
   python scripts/ingest_omi.py --dry-run
   python scripts/ingest_omi.py
   python scripts/embed_vault.py -q "what did I decide this week"
   ```

6. **MCP** — wire [config/cursor_mcp.json](config/cursor_mcp.json) and [config/claude_desktop_config.json](config/claude_desktop_config.json). Details: [docs/MCP.md](docs/MCP.md).
7. **Nightly** — `./scripts/scheduler/install_launchd.sh` (macOS) or [cron.example](scripts/scheduler/cron.example).

## Project layout

```text
omi-second-brain/
├── README.md
├── PRIVACY.md
├── .env.example
├── requirements.txt
├── config/                 # Claude/Cursor MCP snippets + settings.example.yaml
├── src/omi_brain/          # Client, processor, vault writer, embeddings
├── scripts/
│   ├── ingest_omi.py       # Main nightly pull
│   ├── embed_vault.py
│   ├── daily_reflect.py
│   ├── extract_tasks.py
│   └── scheduler/          # launchd + cron
├── servers/second_brain_server/  # Custom MCP (vault RAG + Dev API)
├── vault_template/         # PARA Obsidian starter
├── prompts/                # Cursor / agent prompt templates
└── docs/                   # SETUP, MCP, AUTOMATION
```

## Core scripts

| Script | Role |
|--------|------|
| `scripts/ingest_omi.py` | Pull conversations (+ memories, action items), enrich, write Markdown |
| `scripts/embed_vault.py` | Index / query vault with Ollama embeddings + Chroma |
| `scripts/daily_reflect.py` | Distill a day into `Daily/Reflections/` |
| `scripts/extract_tasks.py` | Sync open action items → Inbox (+ optional ICS) |

## MCP strategy (2025–2026)

| Server | Use when |
|--------|----------|
| Official Omi MCP (SSE or Docker) | Live semantic search of memories & transcripts |
| Filesystem MCP on vault | Raw note read/write |
| `second-brain-local` | Local RAG over vault + Dev API helpers in one place |

**Do not** send `omi_mcp_` keys to REST `/v1/dev/...`, or `omi_dev_` keys to `/v1/mcp/sse`.

## Obsidian PARA

| Folder | Purpose |
|--------|---------|
| `Inbox/` | Unprocessed captures & task dumps |
| `Daily/` | Daily notes + `Conversations/` + `Reflections/` |
| `Projects/` | Active outcomes with deadlines |
| `Areas/` | Ongoing standards (health, finance, business) |
| `Resources/` | Reference + `Omi Memories/` |
| `Archive/` | Cold storage |

Plugins: Templater, Dataview, Tasks, Calendar, Smart Connections, Copilot (see vault template).

## Prompt pack

- [prompts/cursor_query_brain.md](prompts/cursor_query_brain.md) — search recordings, ground code changes  
- [prompts/daily_distill.md](prompts/daily_distill.md) — day → durable memories  
- [prompts/weekly_reflection.md](prompts/weekly_reflection.md) — weekly review  

## Privacy

Read **[PRIVACY.md](PRIVACY.md)** before enabling always-on capture. Defaults favor local models, omit geolocation, and banner every auto-note.

## Cross-platform

| | macOS | Linux | Windows |
|--|-------|-------|---------|
| Ingest / embed | ✅ | ✅ | ✅ (WSL recommended) |
| launchd | ✅ | use cron | Task Scheduler / WSL cron |
| Claude Docker MCP | ✅ | ✅ | ✅ Docker Desktop |
| Paths in configs | `/Users/...` | `/home/...` | WSL paths |

## Assumptions (change anytime)

- Preferred language: **Python 3.11+** (MCP ecosystem + Ollama SDKs)
- OS: **macOS**-first docs; scripts are bash-friendly on Linux
- You will paste your own API keys into `.env` (not committed)

## References

- Omi Developer API: https://docs.omi.me/doc/developer/api/overview  
- Omi MCP: https://docs.omi.me/doc/developer/mcp/introduction  
- MCP spec: https://modelcontextprotocol.io/  
