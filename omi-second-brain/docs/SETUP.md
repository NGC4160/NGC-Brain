# Setup guide

Assumes **macOS** first; Linux notes in brackets.

## 1. Hardware & Omi app

1. Get an [Omi pendant](https://www.omi.me/) and pair via the Omi app.
2. Wear it for a day; confirm transcripts appear in the app.
3. Enable Developer features:
   - **MCP key** (`omi_mcp_...`): Settings → Developer → MCP  
     Used by Claude Desktop / Cursor MCP.
   - **Developer API key** (`omi_dev_...`): Settings → Developer → Create Key  
     Used by `scripts/ingest_omi.py`. Grant scopes for conversations, memories, action items.
4. Never reuse keys across tools; never commit them.

## 2. Clone / copy this project

```bash
cd ~/Projects
# If living inside NGC-Brain:
cp -R /path/to/NGC-Brain/omi-second-brain ~/Projects/omi-second-brain
cd ~/Projects/omi-second-brain

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
cp config/settings.example.yaml config/settings.yaml
```

## 3. Obsidian vault (PARA)

```bash
# Create vault (or point at an existing one)
cp -R vault_template ~/Documents/Obsidian/SecondBrain
# Open that folder as a vault in Obsidian
```

In `.env`:

```bash
OBSIDIAN_VAULT_PATH=/Users/YOU/Documents/Obsidian/SecondBrain
OMI_DEV_API_KEY=omi_dev_...
OMI_MCP_API_KEY=omi_mcp_...
```

Recommended community plugins (see `vault_template/.obsidian/community-plugins.json`):

| Plugin | Why |
|--------|-----|
| Templater | Daily / weekly templates |
| Dataview | Query tasks & notes |
| Tasks | Action-item GTD |
| Calendar | Daily note navigation |
| Smart Connections | Local-ish related notes |
| Copilot | In-vault AI (point at Ollama if desired) |

## 4. Local AI (Ollama)

```bash
# macOS
brew install ollama
ollama serve
ollama pull llama3.2
ollama pull nomic-embed-text
```

[Linux: install from https://ollama.com ]

## 5. First ingest

```bash
export PYTHONPATH=src
python scripts/ingest_omi.py --dry-run
python scripts/ingest_omi.py
python scripts/embed_vault.py
python scripts/daily_reflect.py
```

## 6. Nightly automation

**macOS launchd:**

```bash
./scripts/scheduler/install_launchd.sh
```

**Linux cron:** see `scripts/scheduler/cron.example`.

## 7. MCP into Cursor & Claude

See [MCP.md](./MCP.md).

## 8. Optional: Whisper fallback

Omi already produces cloud/device transcripts. For pure-local audio files you drop into `Inbox/Audio/`, add a later script using `whisper.cpp` or `faster-whisper` — not required for the default Omi pipeline.
