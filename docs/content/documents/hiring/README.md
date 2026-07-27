# NGC Technician Hiring Templates

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
