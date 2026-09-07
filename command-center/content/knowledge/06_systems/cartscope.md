# CartScope — Tech diagnostic checklist UI

**Last verified:** 2026-09-07  
**Live shop / test URL:** https://cart-scope.vercel.app  
**Source of truth (app code):** [NGC4160/CartScope](https://github.com/NGC4160/CartScope)

Neighborhood Golf Carts’ step-by-step golf cart diagnostic checklist web app: brand → cart → what’s wrong → factory-style checks, meter numbers, wire pictures.

App code lives in the GitHub repo. Shop and CartScope Tester use the live Vercel URL. **Do not put CartScope app source in this brain.**

Do **not** treat Grok Build / grok.me as the primary workflow unless Chief explicitly says otherwise. Those are backup only.

## How it relates to Diagnostics bot

**Diagnostics** owns evidence-first diagnostic support and the [`../diagnostics/`](../diagnostics/README.md) library. **CartScope** is the tech-facing checklist UI. They work together. CartScope is **not** the same as the Diagnostics bot.

## Ownership and change workflow

- **CartScope Tester** owns iterative bay QA against https://cart-scope.vercel.app and reports to **Chief only**. Roster: [`../05_team/roles.md`](../05_team/roles.md).
- **Propose-only UX / app changes.** CartScope Tester presents a change plan and gets Ryan’s yes **through Chief** before implementing any CartScope app change.
- **GitHub PRs.** Code changes go through pull requests on `NGC4160/CartScope`. **Chief can merge CartScope PRs.**
- Do not invent other product features.

## Shop tablet setup

Jobs save on **that tablet** (device/browser storage). They do not sync across tablets.

1. Android tablet
2. Shop Wi-Fi
3. Chrome
4. Open https://cart-scope.vercel.app
5. Add to home screen

## Standing product rules

Brief standing rules so bots and staff do not invent a different product. This is **not** a rebuild prompt.

**Confirmed 2026-09-05 by Ryan White** (workflow pointers updated 2026-09-07 to match live GitHub + Vercel practice).

- **Change plan first.** CartScope Tester must present a change plan and get Ryan’s yes **through Chief** before implementing any CartScope app change.
- **Goal.** A technician can diagnose any issue on any golf cart (any brand / edge cases).
- **Tech observations redirect the path.** The tech’s free-text observations redirect the diagnostic path.
- **Helper is integral.** The in-app **Helper** (AI) is part of the app flow — not merely a secondary bottom window. Helper uses the Library (service manuals + parts manuals + diagrams) on file first, then legitimate reliable online sources.
- **No manual on file.** If there is no Library item on file for a cart: source a candidate and add it to the Library **only with approval**.

Also standing (do not invent other features):

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
- GitHub secrets or leftover Grok Build credentials
