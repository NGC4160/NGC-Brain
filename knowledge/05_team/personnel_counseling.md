# Personnel Counseling

**Last verified:** 2026-07-05  
**Primary user:** Ryan (service manager) · Christine (office / HR support)  
**Template:** [`external_docs/templates/personnel_counseling/NGC_Personnel_Counseling_Form.html`](../../external_docs/templates/personnel_counseling/NGC_Personnel_Counseling_Form.html)

---

## Purpose

Standard form for **documented employee counseling** at Neighborhood Golf Carts — coaching, policy reminders, verbal warnings, and written warnings. Uses NGC branding and references company policy areas.

**Not stored in `knowledge/` after use** — completed forms are confidential personnel files.

---

## When to use

| Situation | Form type to check |
|-----------|-------------------|
| First-time minor issue | Coaching / policy reminder |
| Repeated issue after verbal talk | Written warning |
| Serious safety or policy violation | Written or final written warning |
| Documented positive coaching | Positive recognition |

**Always document** when:
- The same issue has been discussed before
- Safety is involved
- Customer impact is significant
- You may need a paper trail for progressive discipline

---

## How to run a counseling session

### Before (5 min)

1. Open the HTML form (see below) or print a blank copy
2. Identify the **specific policy area** — see [Policy reference](#policy-reference)
3. Gather facts: dates, job #s, witnesses — **no unnecessary customer names** in archived copy if avoidable
4. Choose a **private** location (office, not shop floor)

### During (15–20 min)

1. State the purpose — this is counseling, not casual chat
2. Describe **observed behavior** (facts), not personality
3. Reference the **policy or procedure**
4. Explain **impact** on safety, customers, or team
5. State **clear expectations** and timeline
6. Offer **support** (SOP review, retraining, shadowing)
7. State **consequences** if behavior continues
8. Allow employee to respond — note their comments on the form

### After

1. Both sign; employee gets a copy
2. File original in **Management / Personnel** (Drive API or Desktop). Cloud agents: connect Drive per [`google_drive_setup.md`](../10_automation/google_drive_setup.md)
3. Name file: `YYYY-MM-DD_LastName_Counseling_[topic].pdf`
4. Log only that counseling occurred in your private tracker — **not** in `knowledge/` or customer systems

---

## Open & print the form

**Google Docs (Management folder):**  
`My Drive / Management / NGC Personnel Counseling Form.docx`  
Open in Google Drive → **Open with Google Docs** (or double-click; Drive converts automatically).

**Browser / PDF:**
```bash
open "external_docs/templates/personnel_counseling/NGC_Personnel_Counseling_Form.html"
```

Regenerate the Word/Google Docs file after template changes:
```bash
.venv/bin/python3 scripts/generate_personnel_counseling_docx.py
```

**Logo asset:** `external_docs/templates/personnel_counseling/assets/ngc-logo.png`  
(Source: `My Drive/PNG Transparent 3.png`)

---

## Policy reference

Primary source: **`NGC Document Repository / Procedures / NGC Policies & Procedures`** (Google Drive)

| Policy area | Also see |
|-------------|----------|
| Shop safety & PPE | Mobile/shop SOPs in Document Repository; 7-point inspection on every job |
| Diagnostics | `NGC_Technician_Standard_Diagnosing_Test_Process_and_Procedure` |
| Lithium safety | [lithium_conversions.md](../02_products/lithium_conversions.md) — care guide, charging rules |
| Deposits / parts | [shop_services.md](../03_services/shop_services.md) |
| Job documentation | [shop_workflow.md](../04_operations/shop_workflow.md) |
| Roles & expectations | [roles.md](roles.md) |
| Shop throughput / assignments | [shop_throughput.md](../04_operations/shop_throughput.md) |

---

## Who conducts counseling

| Employee | Primary counselor | Backup |
|----------|-------------------|--------|
| Taylor, Marlon, Peyton | Ryan | Christine (witness if needed) |
| Roy | Ryan | Christine |
| Christine | Ryan or Christine (co-owner) | — |
| Ryan | Christine (co-owner) | — |

---

## Progressive discipline (typical pattern)

Not mandatory for every issue — use judgment:

1. Verbal coaching (document if recurring)
2. Written warning (this form)
3. Final written warning
4. Suspension or termination (consult counsel if unsure)

Louisiana is **at-will** — document fairly and consistently, but this form does not change at-will status.

---

## Privacy rules

**Do not:**
- Store completed forms in `knowledge/` or Git
- Paste employee counseling details into Cursor chat long-term
- Share forms with customers or unrelated staff

**Do:**
- Restrict Drive folder to owners + designated management
- Use job # instead of customer name when possible
- Keep a simple log (date, employee, topic, form filed Y/N)

---

## Copy to Google Drive (optional)

Uploaded to **`My Drive / Management / NGC Personnel Counseling Form.docx`** — open with Google Docs.

Regenerate: `.venv/bin/python3 scripts/generate_personnel_counseling_docx.py`

Keep the HTML template in this repo as the master for updates.

---

## Related

- [roles.md](roles.md) — team roster
- [01_company/profile.md](../01_company/profile.md) — legal entity, contact
- `external_docs/My Drive/Management/NGC Accident Report.gdoc` — incident documentation (separate from counseling)
