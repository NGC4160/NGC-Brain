# Week 1 — Safety, Tools & Electrical Fundamentals

**Sessions:** 1 (Theory) · 2 (Lab) · **Total:** 4 hours  
**Primary LOs:** LO-01, LO-02  
**Hands-on target:** Session 2 ≈ 85% practical

---

## PDF downloads (central library)

Printable PDFs live in the **[central downloads library](../../downloads.html#week-1)** (Command Center → Technician Training → PDF Downloads).

| Document | Download |
|---|---|
| Week 1 — Safety, Tools & Electrical (this week) | [PDF](../../pdfs/week-01-safety-tools-electrical.pdf) · [Library](../../downloads.html#week-01-safety-tools-electrical) |
| Program Guide | [PDF](../../pdfs/program-guide.pdf) · [Library](../../downloads.html#program-guide) |
| Instructor Master Checklist | [PDF](../../pdfs/instructor-master-checklist.pdf) · [Library](../../downloads.html#instructor-master-checklist) |
| W01 Pre-Assessment | [PDF](../../pdfs/w01-preassessment.pdf) · [Library](../../downloads.html#w01-preassessment) |
| W01 Multimeter Scavenger | [PDF](../../pdfs/w01-multimeter-scavenger.pdf) · [Library](../../downloads.html#w01-multimeter-scavenger) |
| W01 LOTO Competency | [PDF](../../pdfs/w01-loto-competency.pdf) · [Library](../../downloads.html#w01-loto-competency) |
| Wiring Symbol Glossary | [PDF](../../pdfs/wiring-symbol-glossary.pdf) · [Library](../../downloads.html#wiring-symbol-glossary) |
| Ohm’s Law Quick Reference | [PDF](../../pdfs/ohm-law-quick-reference.pdf) · [Library](../../downloads.html#ohm-law-quick-reference) |
| Safety Shop Poster | [PDF](../../pdfs/safety-shop-poster.pdf) · [Library](../../downloads.html#safety-shop-poster) |
| Recommended Tool List | [PDF](../../pdfs/recommended-tool-list.pdf) · [Library](../../downloads.html#recommended-tool-list) |

Full catalog: [training/downloads.html](../../downloads.html)

## Instructor Preparation Guide (Complete Day Before)

### Pre-session setup
- [ ] Print student binders: Week 1 handouts, pre-assessment, lab sheets (`labs/W01_*`)
- [ ] Post shop safety rules (see `handouts/safety_shop_poster.md`)
- [ ] Verify eyewash, spill kit, Class C/ABC extinguisher accessible and tagged
- [ ] Stage PPE rack: glasses, face shields, Class 00 gloves + leather over-gloves, aprons
- [ ] Prepare 2–3 training boards OR de-energized carts labeled “TRAINING — VERIFY ZERO ENERGY”
- [ ] Set up 4 tool stations (see Session 2)
- [ ] Cal-check or battery-check each DMM; replace blown mA fuses as needed
- [ ] Prepare LOTO kits: locks, tags, hasps; one pack designated for LOTO drill
- [ ] Whiteboard: Ohm’s Law triangle; series vs parallel battery sketch ready
- [ ] Pre-assessment answer key ready (instructor only)

### Carts / props / tools
| Item | Qty | Notes |
|---|---:|---|
| De-energized or training cart packs | 2+ | Main pack connector accessible |
| Digital multimeters (CAT III) | 1 per 2 students | Fluke 87V or equiv. |
| Low-voltage trainers / 6V practice batteries | 2–4 | For series/parallel build |
| Assorted hand tools | Full set | At identification stations |
| Insulated screwdrivers & pliers | Demo set | Contrast with non-insulated |
| LOTO kits | 1 per pair | |
| Jewelry bowl / “remove jewelry” sign | 1 | |

### Planted conditions (Session 2)
- One cable with intentional high resistance (corroded lug demo) — labeled after discovery
- One training board with open circuit for continuity hunt
- Do **not** plant live short hazards

### Instructor mindset notes
- Zero tolerance for jewelry or skipped PPE on Day 1 — model the culture.
- Praise “I don’t know / stop and ask” behavior publicly.

---

## Week 1 Learning Objectives

By end of Week 1, students will:

1. Demonstrate proper PPE selection for electrical and mechanical golf cart work.
2. Perform Lockout/Tagout on a battery pack and verify zero energy with a meter.
3. Explain Ohm’s Law and identify series vs parallel battery configurations (36V/48V).
4. Safely measure DC voltage, resistance, and continuity with a DMM.

---

# Session 1 — Theory & Demonstration (2 hours)

**Materials needed:** Projector/whiteboard; `labs/W01_preassessment.md`; PPE samples; DMM for demo; sample 6V batteries or diagram; LOTO kit; handouts `ohm_law_quick_reference.md`, `safety_shop_poster.md`, `recommended_tool_list.md`; syllabus/expectations sheet.

### Timed Agenda

| Time | Min | Activity | Instructor Notes |
|---:|---:|---|---|
| 0:00 | 5 | Welcome, roster, facility map, emergency exits | Point out eyewash, extinguishers, first aid |
| 0:05 | 10 | Program overview, schedule, grading, certificate criteria | Emphasize ≥60% hands-on; diagnose-before-replace |
| 0:15 | 15 | **Pre-assessment** (written, not graded for pass/fail) | 10 short items — baseline only; collect quietly |
| 0:30 | 5 | Debrief expectations & “no stupid safety questions” | Normalize stopping work |
| 0:35 | 15 | Shop hazard ID: arc flash/high current, H₂ explosion, acid, crush, pinch | Use photos if available; **[DIAGRAM PLACEHOLDER: hazard poster collage — arc, swollen battery, crushed foot zone]** |
| 0:50 | 10 | PPE selection walk-through | Pass around Class 00 gloves; explain leather over-gloves; steel-toe expectation |
| 1:00 | 15 | LOTO procedure lecture + demo on cart pack | Steps on whiteboard; one-hand rule; never assume pack is dead |
| 1:15 | 5 | Break / stretch | Keep students out of energized bays |
| 1:20 | 20 | Electrical fundamentals: V, I, R, Ohm’s Law, power | Work 3 example problems; series vs parallel for 36V (6×6V) & 48V |
| 1:40 | 15 | Multimeter orientation demo | Functions, CAT rating, probe discipline, never amps jack by accident |
| 1:55 | 5 | Preview Session 2 stations + assign pairs | Homework: skim Ohm’s Law handout |

### Key Teaching Points
- Golf cart packs are **high current** even at “only” 36/48V — arcs can melt tools and cause burns.
- Hydrogen from charging is explosive — ventilation is not optional.
- Series adds voltage; parallel adds capacity — wrong jumper = damage/fire risk.
- Meter in amps mode across a battery ≈ fused meter or worse.

### Common Student Misconceptions
| Misconception | Correction |
|---|---|
| “48V isn’t dangerous like house voltage.” | Current capability of packs is extreme; shorting with a wrench is a shop-ending event. |
| “If the key is off, the pack is safe.” | Pack remains energized; LOTO the pack connector / main positive as procedure requires. |
| “Continuity beeper proves a cable can carry 300A.” | Continuity ≠ low resistance under load; voltage drop testing comes later. |
| “Any meter is fine.” | Use adequately rated CAT meters; damaged leads are unsafe. |

### Safety Reminders (Session 1)
- Remove rings, watches, steel bracelets before any bay work.
- Safety glasses required in shop from this session forward.
- Never work alone on pack-connected systems during training.

### Instructor closing check
Confirm all students have PPE access plan for Session 2; collect pre-assessments.

---

# Session 2 — Hands-On Lab (2 hours)

**Materials needed:** Tool stations, DMMs, training boards/carts, LOTO kits, `labs/W01_multimeter_scavenger.md`, `labs/W01_loto_competency.md`, series/parallel kits, jewelry bowl.

### Timed Agenda

| Time | Min | Activity | Instructor Notes |
|---:|---:|---|---|
| 0:00 | 5 | Safety brief + jewelry check + PPE don | Instructor signs attendance only after PPE on |
| 0:05 | 10 | Station overview & rotation rules | 4 stations × ~20 min; pairs stay together |
| 0:15 | 20 | **Station A — Tool ID & inspection** | Identify torque wrench, crimper, insulated tools; reject damaged tools |
| 0:35 | 20 | **Station B — Multimeter scavenger** | Measure bank V, cell/battery V, continuity hunt; complete lab sheet |
| 0:55 | 5 | Water / rotate buffer | |
| 1:00 | 20 | **Station C — LOTO drill** | Isolate pack, tag, verify zero energy at main terminals, instructor sign-off |
| 1:20 | 20 | **Station D — Series/parallel build** | Build 12V from 2×6V series; discuss 36/48V pack math; measure |
| 1:40 | 10 | Group debrief: wrong meter mode near-miss stories | Invite student observations |
| 1:50 | 10 | Cleanup, pack restore, competency stamps, exit ticket | Exit: “One hazard I will never ignore” |

### Key Teaching Points (Lab)
- Verify meter on known source before trusting a “0V” reading.
- Tag ownership: person who locks is person who removes (training simplification of full OSHA LOTO — teach principle).
- Document readings with units every time.

### Common Lab Errors to Watch
- Probes in A jack while measuring voltage.
- Skipping zero-energy verify after disconnect.
- Calling a pack “dead” based on key switch alone.

### Safety Reminders (Session 2)
- Face shield + gloves when breaking pack connections if corrosion/arc risk.
- No jewelry. One-hand probing when any residual voltage possible.
- Spill kit location reviewed before any battery handling.

### Assessment Focus
- Safety quiz (end of week or start of Week 2) + practical LOTO/multimeter competency sign-off.
- Instructor observes safe meter use and PPE compliance continuously.

---

## Week 1 Quiz (8 questions) — Administer end of Session 2 or start of Week 2

**Name:** _________________ **Date:** _________

### Multiple Choice

1. Before working on a golf cart battery pack, the first electrical safety action is to:  
   A) Turn the key off and begin probing  
   B) Apply LOTO and verify zero energy with a meter  
   C) Remove the controller cover  
   D) Disconnect the charger only  

2. Class 00 insulated gloves are primarily intended to protect against:  
   A) Hot exhaust only  
   B) Electrical shock on low-voltage systems when used as rated  
   C) Sulfuric acid only  
   D) UV from welding  

3. In a series string of six 8V batteries, nominal pack voltage is approximately:  
   A) 8V  
   B) 24V  
   C) 48V  
   D) 96V  

4. Which meter function is appropriate to check if a fuse is open (power removed)?  
   A) ACA  
   B) Continuity / resistance  
   C) Hz  
   D) Capacitance  

5. Hydrogen gas hazard is greatest when:  
   A) Tires are inflated  
   B) Batteries are charging without ventilation  
   C) The cart is in reverse  
   D) The radio is on  

### Short Answer

6. State Ohm’s Law in formula form and solve for current if V = 48V and R = 16Ω.  
7. List three PPE items required for battery pack work in this program.  
8. Why is “key off” not sufficient proof that a pack is safe to work on?

### Answer Key (Instructor)

1. **B**  
2. **B**  
3. **C** (6 × 8V = 48V)  
4. **B**  
5. **B**  
6. **V = I × R** (or I = V/R). **I = 48/16 = 3A**  
7. Accept any three: safety glasses, face shield, Class 00 gloves, leather over-gloves, apron, steel-toe boots  
8. Pack remains energized; key only opens control circuits — must isolate pack and meter-verify zero energy  

---

## Competency Sign-Off Box (copy to student record)

| Skill | Pass/Fail | Instructor Initials | Date |
|---|---|---|---|
| PPE selection & donning | | | |
| DMM voltage measurement | | | |
| DMM continuity/resistance | | | |
| LOTO + zero-energy verify | | | |
