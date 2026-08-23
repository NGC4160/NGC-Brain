# MCP configuration

You need **two Omi key types**:

| Key prefix | Where | Used for |
|------------|--------|----------|
| `omi_mcp_...` | Settings → Developer → **MCP** | Hosted SSE / Docker MCP server |
| `omi_dev_...` | Settings → Developer → **Create Key** | REST ingest + `second-brain-local` tools |

Mixing them up → `401 Unauthorized`.

## Cursor

1. Open **Cursor Settings → MCP** (or project `.cursor/mcp.json`).
2. Merge servers from [`config/cursor_mcp.json`](../config/cursor_mcp.json):
   - `omi` — hosted SSE + `Authorization: Bearer omi_mcp_...`
   - `obsidian-vault` — filesystem MCP rooted at your vault
   - `second-brain-local` — optional custom server (vault RAG + Dev API)
3. Restart Cursor; confirm tools like `search_memories`, `get_conversation_by_id` appear.
4. Trust check: *“List my 5 most recent Omi memories with categories.”*

## Claude Desktop

Config path (macOS):

`~/Library/Application Support/Claude/claude_desktop_config.json`

Start from [`config/claude_desktop_config.json`](../config/claude_desktop_config.json).

**Recommended (Docker):**

```json
{
  "mcpServers": {
    "omi": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-e", "OMI_API_KEY=omi_mcp_YOUR_KEY",
        "omiai/mcp-server"
      ]
    }
  }
}
```

Requires Docker Desktop running. Logs: `~/Library/Logs/Claude/`.

Debug:

```bash
npx @modelcontextprotocol/inspector uvx mcp-server-omi
curl https://api.omi.me/v1/mcp/sse/info
```

## Official Omi MCP tools

- `get_memories` / `search_memories` / `create_memory` / `edit_memory` / `delete_memory`
- `get_conversations` / `search_conversations` / `get_conversation_by_id`

## Custom `second-brain-local` tools

See [`servers/second_brain_server/README.md`](../servers/second_brain_server/README.md).

## Grok / other MCP clients

Any client that supports MCP SSE or stdio can use the same endpoints. Point SSE at `https://api.omi.me/v1/mcp/sse` with the MCP bearer key, and/or run `servers/second_brain_server/server.py` as a stdio server.
