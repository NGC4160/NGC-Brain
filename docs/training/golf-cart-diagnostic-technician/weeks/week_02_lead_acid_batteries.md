# Week 2 — Lead-Acid Battery Systems

**Sessions:** 1 (Theory) · 2 (Lab) · **Total:** 4 hours  
**Primary LOs:** LO-03  
**Hands-on target:** Session 2 ≈ 90% practical

---

## PDF downloads (central library)

Printable PDFs live in the **[central downloads library](../../downloads.html#week-2)** (Command Center → Technician Training → PDF Downloads).

| Document | Download |
|---|---|
| Week 2 — Lead-Acid Batteries (this week) | [PDF](../../pdfs/week-02-lead-acid-batteries.pdf) · [Library](../../downloads.html#week-02-lead-acid-batteries) |
| Program Guide | [PDF](../../pdfs/program-guide.pdf) · [Library](../../downloads.html#program-guide) |
| Instructor Master Checklist | [PDF](../../pdfs/instructor-master-checklist.pdf) · [Library](../../downloads.html#instructor-master-checklist) |
| W02 Battery Diagnostic Log | [PDF](../../pdfs/w02-battery-diagnostic-log.pdf) · [Library](../../downloads.html#w02-battery-diagnostic-log) |

Full catalog: [training/downloads.html](../../downloads.html)

## Instructor Preparation Guide (Complete Day Before)

### Pre-session setup
- [ ] Assign teams of 2 to battery banks (4–6 batteries each)
- [ ] Ensure packs have been **rested ≥4 hours** if possible for OCV validity (label rest status)
- [ ] Stage hydrometers/refractometers, temp compensation charts, thermometers
- [ ] Stage load tester; verify clamps clean; review carbon-pile duty cycle limits
- [ ] Spill kit, baking soda solution, eyewash verified
- [ ] Print `labs/W02_battery_diagnostic_log.md` (one per team + extras)
- [ ] Tag batteries for tracking (A1–A6, etc.)
- [ ] PPE: acid-rated apron/face shield available at station

### Planted faults (choose 1–2 per class)
| Fault | How to plant | Expected student finding |
|---|---|---|
| Weak/sulfated battery | Use known weak battery in bank | Low load-test voltage / poor SG recovery |
| Low SG cell | Partially discharged or known bad cell | SG spread >0.050 (or shop threshold) |
| High-resistance terminal | Light corrosion left on one terminal (safe level) | Voltage drop / visual fail; OCV may look OK |
| Wrong water level | One cell low (do not overfill) | Visual inspection catch |

### Carts / props / tools
| Item | Qty |
|---|---:|
| Flooded LA carts or bench banks (36V or 48V) | 2–3 |
| Hydrometer or refractometer | 1 per team |
| Load tester 100A+ | 1–2 |
| Infrared or probe thermometer | 1–2 |
| Distilled water (for demo of watering technique only if appropriate) | As needed |
| Battery carrier / lift assist | As available |

### Safety staging
- Neutralize tray ready; no smoking/sparks zone taped; charge room closed during load tests if gassing risk.

---

## Week 2 Learning Objectives

1. Describe flooded lead-acid construction, chemistry, and major failure modes.
2. Perform visual inspection and identify safety hazards on battery banks.
3. Execute and interpret OCV, temperature-compensated specific gravity, and load tests.
4. Recommend replace vs maintain/equalize based on data — not guesswork.

---

# Session 1 — Theory & Demonstration (2 hours)

**Materials needed:** Sample cutaway battery or photos; corrosion samples (sealed bag); SG chart; load tester for demo; whiteboard; PPE for demo; `handouts/common_fault_flowcharts.md` (slow/no-go battery branch preview).

### Instructor say/do (high-stakes moments)
- **Say:** “OCV tells you resting state — load and SG tell you if it can work for a living.”  
- **Do:** Live-demo one hydrometer draw with face shield; narrate temperature compensation.  
- **Say:** “One bad battery cooks the pack — we tag the unit, not our feelings.”

### Timed Agenda

| Time | Min | Activity | Instructor Notes |
|---:|---:|---|---|
| 0:00 | 5 | Safety opener: acid + hydrogen + jewelry | Quiz return from Week 1 if administered |
| 0:05 | 10 | Battery types: 6V/8V/12V; 36V & 48V pack math | Club Car/EZ-GO/Yamaha common configs |
| 0:15 | 15 | Construction & chemistry: plates, separators, H₂SO₄ | **[DIAGRAM PLACEHOLDER: flooded cell cross-section with +/− plates, electrolyte, vent]** |
| 0:30 | 10 | Failure modes: sulfation, shorted cell, dry-out, corrosion, imbalance | Tie each to test method later |
| 0:40 | 15 | Visual inspection criteria walk-through | Live demo on a dirty pack if available |
| 0:55 | 5 | Break | |
| 1:00 | 15 | OCV interpretation & resting requirements | Stress: testing while charging invalidates |
| 1:15 | 15 | Specific gravity + temperature compensation | Demo hydrometer technique; never drink/siphon by mouth |
| 1:30 | 15 | Load testing principles & pass/fail thinking | ~½ CCA / mfr method; 15 sec typical teaching standard — use mfr when available |
| 1:45 | 10 | Replace vs equalize decision tree | Introduce flowchart handout preview |
| 1:55 | 5 | Lab roles for Session 2; PPE reminder | |

### Key Teaching Points
- Weakest battery limits the pack — one bad unit kills range and cooks neighbors.
- SG variation across cells is as important as absolute values.
- Clean, tight, protected terminals are half of “battery diagnostics.”
- Never add acid to top off — distilled water only on flooded cells after charging per SOP.

### Common Student Misconceptions
| Misconception | Correction |
|---|---|
| “All batteries in the pack read similar OCV so they’re fine.” | Load test and SG reveal weaknesses OCV misses. |
| “Green corrosion is cosmetic.” | It creates high resistance and heat under load. |
| “Equalizing fixes a shorted cell.” | Shorted/dead cells need replacement; equalize only when appropriate for flooded sets. |
| “Lithium rules apply to flooded watering.” | Different chemistry — do not mix procedures. |

### Safety Reminders
- Face shield + gloves when opening caps; goggles under shield preferred.
- No sparks near charging or recently charged packs.
- Neutralize spills immediately; know eyewash path.

---

# Session 2 — Hands-On Lab (2 hours)

**Materials needed:** Battery banks; hydrometers/refractometers; load tester; thermometer; `labs/W02_battery_diagnostic_log.md`; Good/Marginal/Replace tags; spill kit; face shields.

### Timed Agenda

| Time | Min | Activity | Instructor Notes |
|---:|---:|---|---|
| 0:00 | 5 | PPE + spill briefing; assign banks | Confirm rest status on labels |
| 0:05 | 10 | Team plan: who records / who measures | Instructor checks meter setup |
| 0:15 | 15 | Step 1–2: Safety setup + visual inspection | Photos optional; complete visual section of log |
| 0:30 | 15 | Step 3: OCV each battery | Record to 0.01V if meter allows |
| 0:45 | 20 | Step 4: SG every cell + temperature | Apply compensation; flag outliers |
| 1:05 | 5 | Break / compare mid-data | |
| 1:10 | 20 | Step 5: Load test (supervised) | Enforce time limits; watch clamp discipline |
| 1:30 | 15 | Step 6: Interpret, tag, recommend | Team consensus then instructor challenge |
| 1:45 | 10 | Debrief planted faults; compare team tags | Reveal planted faults after teams commit |
| 1:55 | 5 | Cleanup neutralize; wash hands; exit | Restore caps; return testers |

### Key Teaching Points
- Write the **condition of test** (rested? recently charged? ambient temp).
- Tag physically on battery AND on paperwork.
- If results conflict, retest before condemning a battery.

### Assessment Focus
Completed battery test log with accurate readings and correct disposition tags; continuous safety compliance.

---

## Week 2 Quiz (8 questions)

1. A 48V flooded pack commonly uses how many 8V batteries in series?  
   A) 4  
   B) 6  
   C) 8  
   D) 12  

2. Specific gravity primarily indicates:  
   A) Tire pressure  
   B) State of charge / electrolyte condition of a flooded cell  
   C) Controller PWM %  
   D) Motor brush length  

3. Which visual finding is an immediate safety concern?  
   A) Light dust on seat  
   B) Cracked case with wet electrolyte trail  
   C) Faded decal  
   D) Older tire date code alone  

4. Open circuit voltage is most meaningful when batteries have:  
   A) Just finished a 50A discharge  
   B) Rested after charge/discharge (ideally several hours)  
   C) Caps removed for 2 days  
   D) Been jumpered to a car battery  

5. True or False: One consistently weak battery can overwork the rest of a series pack.

### Short Answer

6. List the six-step battery diagnostic sequence used in lab.  
7. Why do we temperature-compensate specific gravity readings?  
8. A battery passes OCV but fails load test. What does that suggest?

### Answer Key

1. **B**  
2. **B**  
3. **B**  
4. **B**  
5. **True**  
6. Safety/PPE → Visual → OCV → SG (temp compensated) → Load test → Interpret/tag  
7. SG changes with temperature; compensation allows comparison to standard charts  
8. High internal resistance / sulfation / inability to deliver current under load — candidate for replace (confirm with SG/history)  
