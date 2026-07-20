# Week 7 — Diagnostic Methodology

**Sessions:** 1 (Theory) · 2 (Lab) · **Total:** 4 hours  
**Primary LOs:** LO-09  
**Hands-on target:** Session 2 ≈ 90% practical  
**Program spine week:** Full application of the 7-step process

---

## Instructor Preparation Guide (Complete Day Before)

### Pre-session setup
- [ ] Prepare 3–5 carts with distinct complaints (mix planted + real)
- [ ] Print `labs/W07_seven_step_checklist.md` and `labs/W07_diagnostic_report.md` (also Appendix-style)
- [ ] Print flowchart handout `common_fault_flowcharts.md`
- [ ] Assign pair teams; prepare “customer interview” cue cards for instructor role-play
- [ ] Ensure each cart has matching OEM diagram packet
- [ ] Timebox: each pair gets ~45–50 min on cart + documentation

### Suggested planted scenarios (label privately)
| Cart | Symptom card | Root cause |
|---|---|---|
| A | “Won’t move / clicks” | Weak solenoid contacts or open coil feed |
| B | “Slow / weak” | Marginal battery or high-R cable |
| C | “Dead / no power” | Main fuse/open connector / pack imbalance |
| D | “Charger won’t charge” | Interlock or AC supply issue |
| E | “Intermittent” | Loose pin / HPD sequence / throttle connector |

### Debrief wall
Whiteboard columns: Symptom → First tests → Decision → Actual root cause.

---

## Week 7 Learning Objectives

1. Apply the structured 7-step diagnostic process to any golf cart complaint.
2. Use simple troubleshooting flowcharts without skipping isolation.
3. Document findings professionally and present recommendations clearly.

---

# Session 1 — Theory & Demonstration (2 hours)

**Materials needed:** Posted 7-step banner; `handouts/common_fault_flowcharts.md`; good vs bad report examples; demo cart for think-aloud; customer interview cue cards; `labs/W07_diagnostic_report.md` blank.

### Timed Agenda

| Time | Min | Activity | Instructor Notes |
|---:|---:|---|---|
| 0:00 | 5 | Safety + “no parts roulette” culture | |
| 0:05 | 20 | Teach 7 steps in detail with examples | Post the 7 steps permanently |
| 0:25 | 15 | Cost of wrong diagnosis stories (anonymized) | Battery pack replaced for a $20 connector |
| 0:40 | 15 | Flowcharts: No Go / Slow / Charger / Intermittent | Walk one fully |
| 0:55 | 5 | Break | |
| 1:00 | 20 | Interview skills: history, when, weather, recent work | Role-play 2 minutes |
| 1:20 | 20 | Documentation standards: data, units, photos, torque | Show good vs bad report |
| 1:40 | 15 | Live instructor demo on one cart (compressed 7-step) | Think aloud |
| 1:55 | 5 | Lab pair assignments & scenario rules | No sharing answers across teams |

### The 7-Step Process (post in bay)

1. Verify the complaint  
2. Gather information & history  
3. Perform visual & safety inspection  
4. Isolate systems  
5. Test components  
6. Perform repair  
7. Verify repair & road test  

### Key Teaching Points
- Start with batteries and connections on electric “no go/slow” — highest probability, safest logic.
- Isolation means proving what still works, not randomly swapping.
- If you can’t explain why a part failed, you may not have the root cause.
- Verification is part of the job — not optional.

### Instructor say/do (high-stakes moments)
- **Say:** “If you can’t tell me what the last measurement proved, you’re not diagnosing yet.”  
- **Do:** During lab, interrupt once per team with: “What system did you just rule out?”  
- **Say:** “Your report is the product — the cart running is only half.”  
- **Do:** Show a one-page bad report vs good report side-by-side before pairs start.

### Common Misconceptions
| Misconception | Correction |
|---|---|
| “Experienced techs skip steps.” | Experts compress steps — they don’t skip evidence. |
| “Flowcharts are for beginners only.” | Pros use them under pressure and for training consistency. |
| “If the new controller fixed it, diagnosis was good.” | Intermittents and stacked faults fool parts-swappers. |

### Safety Reminders
- Still LOTO when required during isolation.
- Road test only after instructor clearance; designated route.
- Don’t defeat interlocks to “make it run” for a demo to customers.

---

# Session 2 — Hands-On Lab (2 hours)

**Materials needed:** `labs/W07_seven_step_checklist.md`, `labs/W07_diagnostic_report.md`; 3–5 faulted carts; OEM diagram packets; full tool/PPE sets; debrief whiteboard.

### Timed Agenda

| Time | Min | Activity | Instructor Notes |
|---:|---:|---|---|
| 0:00 | 5 | Safety; distribute symptom cards; start timers | |
| 0:05 | 10 | Step 1–2: Verify + interview instructor/customer | |
| 0:15 | 10 | Step 3: Visual & safety | |
| 0:25 | 35 | Steps 4–5: Isolate & test (pairs) | Instructor circulates; ask “what did that reading prove?” |
| 1:00 | 5 | Buffer | |
| 1:05 | 20 | Step 6–7: Repair (if authorized) + verify | Some teams stop at recommend if parts unavailable |
| 1:25 | 25 | Group debrief presentations (3–4 min/pair) | Score process quality, not only luck |
| 1:50 | 10 | Collect reports; cleanup; preview mechanical week | |

### Assessment Focus
Diagnostic process checklist completion + quality of presentation/documentation (use documentation rubric in Program Guide).

---

## Week 7 Quiz (8 questions)

1. Step 1 of the 7-step process is:  
   A) Order parts  
   B) Verify the complaint  
   C) Replace the controller  
   D) Skip to road test  

2. The best reason to gather history is:  
   A) Gossip  
   B) Recent work, conditions, and intermittency patterns guide testing  
   C) To avoid measuring anything  
   D) To justify skipping LOTO  

3. System isolation means:  
   A) Testing randomly  
   B) Narrowing which subsystem can produce the symptom using logic and measurements  
   C) Removing all fuses permanently  
   D) Painting the frame  

4. Professional documentation should include:  
   A) Only “fixed”  
   B) Tests, readings with units, diagnosis, actions, verification  
   C) Customer home address and SSN  
   D) Memes  

5. True or False: Verification/road test can be skipped if the tech is confident.

### Short Answer

6. Write the 7 steps in order.  
7. Why start many electric drivability diagnoses at the batteries/connections?  
8. Give one example of confirming a repair after replacing a solenoid.

### Answer Key

1. **B**  
2. **B**  
3. **B**  
4. **B**  
5. **False**  
6. Verify → Gather info → Visual/safety → Isolate → Test → Repair → Verify/road test  
7. High failure rate / foundation of voltage delivery; prevents mis-condemning controllers/motors  
8. Confirm pack voltage at controller under load, no excessive contact drop, cart accelerates normally, no codes, road test OK  
