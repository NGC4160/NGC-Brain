# NGC Technician Hiring Templates

**Canonical copy.** Edit files in this folder. Command Center `docs/documents/hiring/` is publish output — do not maintain a second edited copy there.

## 1. Phone interview scorecard

**Printable HTML (use this):** [NGC_Technician_Phone_Interview_Scorecard.html](NGC_Technician_Phone_Interview_Scorecard.html) — open in browser → **Print / Save PDF** (fits **2 letter pages**)

**PDF copy:** [NGC_Technician_Phone_Interview_Scorecard.pdf](NGC_Technician_Phone_Interview_Scorecard.pdf)

**Command Center:** Documents → Technician Phone Interview Scorecard

**Regenerate PDF:** `python3 generate_phone_screen_pdf.py`

### How to use

1. Open the HTML scorecard (or print a blank copy) before the Indeed-cleared candidate call (15–20 min).
2. Skip hours/commute — already handled on the Indeed application.
3. Read the **Ask:** / **Say:** lines out loud — questions are in plain language for the candidate.
4. Score sections **A–G** (1–4). **E Safety is a gate** (must be ≥ 3).
5. Golf cart / lithium (**H**) is bonus only — not required.
6. Advance → schedule the hands-on shop evaluation (next scorecard).
7. After the call: **Print / Save PDF** and file the scored copy.

## 2. Written hiring quiz

**Candidate PDF:** [NGC_Technician_Hiring_Quiz.pdf](NGC_Technician_Hiring_Quiz.pdf)  
**Answer key (Ryan only):** [NGC_Technician_Hiring_Quiz_Answer_Key.pdf](NGC_Technician_Hiring_Quiz_Answer_Key.pdf)  
**Source / edit:** [NGC_Technician_Hiring_Quiz.md](NGC_Technician_Hiring_Quiz.md)  
**Loop log:** [ITERATION_LOG_hiring_quiz.md](ITERATION_LOG_hiring_quiz.md)

**Regenerate PDFs:** `python3 generate_hiring_quiz_pdf.py`

### Spec (locked after 8 critique loops)

| Item | Value |
|------|--------|
| Questions | 40 |
| Points | 120 (3 each) |
| Time | 45–60 min |
| Pass | 90/120 (75%) |
| Critical safety ★ | Q1–Q6 — miss **2+** = auto fail |
| Difficulty | Entry-level / Day-1 — no brand trivia |

## 3. Hands-on shop evaluation scorecard

**PDF (use this in the bay):** [NGC_Technician_Hands_On_Eval_Scorecard.pdf](NGC_Technician_Hands_On_Eval_Scorecard.pdf)

**Regenerate:** `python3 generate_hands_on_eval_pdf.py`

### How to use

1. Only for candidates who **ADVANCE** on the phone screen.
2. ~3–4 hours: live safety gate → **written quiz (above)** → hands-on stations → troubleshooting.
3. Score **S, W, H1–H4, D1–D3, F1–F2** on the same 1–4 scale as the phone screen.
4. **Safety (S) ≥ 3** required or stop the eval.
5. Transfer written % to scorecard **W** using the convert table on the quiz cover.
6. Decide Hire / Second look / Pass; compare to phone scores.

### Related

| Resource | Location |
|----------|----------|
| Team roles & hiring overview | `knowledge/05_team/roles.md` |
| Command Center Documents | `documents/index.html` (after deploy) |
| Training competencies (post-hire) | `docs/training/golf-cart-diagnostic-technician/` |

---

## 4. Administrative Assistant / Service Coordinator

Board-aligned pack (July 2026 CFO/CEO Boardroom Report). Recruit Admin to remove phone/estimate/approval/scheduling work from Ryan. Planning wage ~$15/hr. **New-hire packet / I-9 / tax / direct deposit → Gusto** (not duplicated here).

| Doc | File | Use |
|-----|------|-----|
| Ryan 2-week time log | [NGC_Admin_Ryan_Time_Log.html](NGC_Admin_Ryan_Time_Log.html) | Verify transferable admin ≥~6–8 hrs/wk |
| Job description + Indeed post | [NGC_Admin_Job_Description.md](NGC_Admin_Job_Description.md) | Posting + internal JD |
| Phone + desk eval scorecard | [NGC_Admin_Phone_and_Desk_Eval_Scorecard.html](NGC_Admin_Phone_and_Desk_Eval_Scorecard.html) | Part A phone → Part B desk tryout |
| Front-office SOPs | [NGC_Admin_Front_Office_SOPs.md](NGC_Admin_Front_Office_SOPs.md) | Wait codes, estimates, approvals, triage |
| Weekly KPI + 30/60/90 | [NGC_Admin_KPI_and_Review.html](NGC_Admin_KPI_and_Review.html) | Track so role doesn’t become overhead |

### How to use (Admin funnel)

1. Start Ryan time log (or run in parallel with recruiting).
2. Post from job description; Indeed questions clear logistics.
3. Phone scorecard (Part A) → ADVANCE only if policy gate (E) ≥ 3.
4. Desk eval (Part B) → Hire / Second look / Pass; offer then **Gusto** onboarding.
5. Train from Front Office SOPs; score weekly KPIs; formal 30/60/90 reviews.
