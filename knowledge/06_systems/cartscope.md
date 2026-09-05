# CartScope — Tech diagnostic checklist UI

**Last verified:** 2026-09-05  
**Live app:** https://giant-apex-light-wave.grok.me  
**Source repo:** [NGC4160/CartScope](https://github.com/NGC4160/CartScope) (public; empty until Grok Build syncs)

Neighborhood Golf Carts’ step-by-step golf cart diagnostic checklist web app: brand → cart → what’s wrong → factory-style checks, meter numbers, wire pictures.

Built in **Grok Build**. Long-term code access is the GitHub repo once it is connected from Grok Build. **Do not put CartScope app source in this brain.**

## How it relates to Diagnostics bot

**Diagnostics** owns evidence-first diagnostic support and the [`../diagnostics/`](../diagnostics/README.md) library. **CartScope** is the tech-facing checklist UI. They work together. CartScope is **not** the same as the Diagnostics bot.

## Standing product rules

Brief standing rules so bots and staff do not invent a different product. This is **not** a rebuild prompt.

- **Any cart / any condition** — not TXT-only.
- **Job header:** customer last name + Housecall Pro job number (and battery type if electric).
- **Terms:** controller (not “speed box”); solenoid (not “big clicker”).
- **Handheld:** Program file (present + history codes) and Log file only when a logger was used. Standard names on the device: `YYYY-MM-DD_LastName_JobNumber_Program` or `_Log`. Brain copies use redacted `Make_Model_Symptom` names.
- **Pack:** per-battery voltage, internal resistance (IR meter), age as month/year. If the pack fails, test-battery continue is allowed with a required note.
- **Controller readings when shown:** fault counters, odometer, fault odometer.
- **Final report:** plain language. Repair recommendation only after proof.
- **PII split:** full case stays on the device. Auto brain copy redacts last name and job number. No GitHub secrets in the web app.
- **Public repo:** do not commit customer last names, job numbers, or real case PII into CartScope git.

## Do not store here

- CartScope app source
- Customer last names, HCP job numbers, or other case PII
- GitHub secrets or Grok Build credentials
