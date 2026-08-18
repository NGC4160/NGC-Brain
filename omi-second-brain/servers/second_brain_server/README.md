# second-brain-local MCP server

Combines:

| Tool | Purpose |
|------|---------|
| `search_vault` | Local Chroma semantic search over Obsidian |
| `read_vault_note` / `write_vault_note` | Safe vault file IO |
| `list_recent_omi_conversations` | Dev API metadata |
| `get_omi_conversation` | Dev API + optional transcript |
| `brain_status` | Config sanity check (no secrets) |

## When to use what

- **Official Omi MCP** (`https://api.omi.me/v1/mcp/sse` + `omi_mcp_...`): best for live semantic search of memories/conversations inside Cursor/Claude.
- **This server**: local vault RAG, writing distilled notes, batch Dev API helpers without leaving the agent loop.
- **Filesystem MCP**: simple raw file access if you do not need embeddings.

## Run manually

```bash
cd omi-second-brain
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH=src
export OMI_DEV_API_KEY=omi_dev_...
export OBSIDIAN_VAULT_PATH="$HOME/Documents/Obsidian/SecondBrain"
python servers/second_brain_server/server.py
```

Wire into Cursor via `config/cursor_mcp.json` (copy entries into `.cursor/mcp.json` or Cursor Settings → MCP).
