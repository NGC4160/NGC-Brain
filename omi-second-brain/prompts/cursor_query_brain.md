# Cursor prompt — search Omi + vault, apply to code

Copy into Cursor Agent / Composer:

---

Search my Omi recordings and Obsidian vault for anything related to: **{{TOPIC}}**.

Steps:
1. Use Omi MCP (`search_conversations` / `search_memories`) for the last 30 days.
2. Use `search_vault` (second-brain-local) or filesystem MCP for matching notes under `Daily/` and `Projects/`.
3. Summarize: decisions, constraints, open action items, and exact quotes that matter.
4. Propose concrete code/docs changes in **this repo** grounded in those findings.
5. If a durable decision emerges, draft a short Obsidian note for `Inbox/` (do not write secrets or customer PII).

Do not invent memories. If tools return nothing, say so and ask what to capture next.

---

## Shorter variant

> Pull Omi conversations about {{TOPIC}} from the last 2 weeks, then open the matching vault notes and list decisions + open loops before we edit code.
