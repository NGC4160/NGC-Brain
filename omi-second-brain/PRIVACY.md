# Privacy & security

Omi + a second brain is powerful — treat it like always-on context, not a toy.

## Consent & recording hygiene

- Tell people when you are recording (legal requirements vary by jurisdiction; Louisiana and many US states are one-party consent, but courtesy and workplace policy still matter).
- Mute or pause Omi in bathrooms, medical settings, attorney calls, and private conversations you did not disclose.
- Do not use ingested notes as a surveillance log for employees or family.

## Local-first defaults

This project defaults to:

- `LOCAL_ONLY=true` — summarization via **Ollama** on your machine
- Embeddings via **Ollama** (`nomic-embed-text`) + **Chroma** on disk
- Vault as plain Markdown you control

Omi’s own cloud still processes wearable audio unless you use a self-hosted Omi backend. The ingest pipeline only *pulls* what Omi already stored.

## Keys

| Do | Don’t |
|----|-------|
| Store keys in `.env` (gitignored) | Commit keys or paste into public chats |
| Use separate `omi_mcp_` and `omi_dev_` keys | Share one key across every laptop forever |
| Rotate / revoke in Omi → Settings → Developer | Leave old keys active after a leak |
| Scope Dev API keys to needed resources | Give write scopes to read-only automation |

## What we omit by default

- Geolocation is **not** written to Markdown (`omit_geolocation: true`)
- Ingested notes include a privacy callout banner
- Optional `redact_patterns` in `settings.yaml` for regex scrubbing (phones, etc.)

## Sensitive data policy (suggested)

Never leave in the vault (delete or redact):

- Passwords, API keys, bank / card numbers
- Government IDs, full medical records
- Customer PII from your business beyond what you already store in approved systems
- Others’ private disclosures without a clear need

## Cloud AI tools (Cursor, Claude, Grok)

When MCP pulls transcripts into an agent:

- Prefer **retrieval → summarize → edit code** over dumping full-day transcripts into every prompt
- Turn off training / retention options in each vendor’s privacy settings where available
- For highly sensitive days, run `ingest_omi.py --skip-llm` and keep enrichment offline

## Backups

- Back up the Obsidian vault (Syncthing, Time Machine, encrypted git remote — your choice)
- Do **not** back up `.env` to a public remote
- Chroma under `data/chroma/` is regenerable via `embed_vault.py`

## Incident response

1. Revoke compromised Omi keys in the app  
2. Rotate any secrets that appeared in transcripts  
3. Delete sensitive Markdown notes from the vault and re-index (`embed_vault.py`)  
4. Review Cursor/Claude MCP logs if a bad tool call wrote data elsewhere  
