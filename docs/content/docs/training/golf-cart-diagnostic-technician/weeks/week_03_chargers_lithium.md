# Week 3 — Battery Maintenance, Chargers & Lithium

**Sessions:** 1 (Theory) · 2 (Lab) · **Total:** 4 hours  
**Primary LOs:** LO-04, LO-05  
**Hands-on target:** Session 2 ≈ 80% practical

---

## PDF downloads (central library)

Printable PDFs live in the **[central downloads library](../../downloads.html#week-3)** (Command Center → Technician Training → PDF Downloads).

| Document | Download |
|---|---|
| Week 3 — Chargers & Lithium (this week) | [PDF](../../pdfs/week-03-chargers-lithium.pdf) · [Library](../../downloads.html#week-03-chargers-lithium) |
| Program Guide | [PDF](../../pdfs/program-guide.pdf) · [Library](../../downloads.html#program-guide) |
| Instructor Master Checklist | [PDF](../../pdfs/instructor-master-checklist.pdf) · [Library](../../downloads.html#instructor-master-checklist) |
| W03 Charger Troubleshooting | [PDF](../../pdfs/w03-charger-troubleshoot.pdf) · [Library](../../downloads.html#w03-charger-troubleshoot) |
| W03 Lithium Comparison | [PDF](../../pdfs/w03-lithium-comparison.pdf) · [Library](../../downloads.html#w03-lithium-comparison) |

Full catalog: [training/downloads.html](../../downloads.html)

## Instructor Preparation Guide (Complete Day Before)

### Pre-session setup
- [ ] Stage ferro-resonant and/or HF charger examples (onboard + portable if available)
- [ ] Prepare “no charge” training scenario (open AC, blown DC fuse, bad interlock, wrong pack voltage — pick 1–2)
- [ ] Lithium cart or bench pack ready with OEM app/tool if available; label chemistry (e.g., LiFePO4)
- [ ] Print `labs/W03_charger_troubleshoot.md` and `labs/W03_lithium_comparison.md`
- [ ] Confirm AC circuits for charger testing are GFCI-protected where required
- [ ] Post reminder: **never charge lithium with a lead-acid charger**

### Planted faults
| Scenario | Setup | Teachable point |
|---|---|---|
| No DC output | Open DC fuse or disconnected DC plug | Measure AC in, DC out systematically |
| Won’t finish charge | Sulfated bank or failed charge-complete sense (simulate) | Stages & sensing |
| Interlock open | Seat/charger interlock defeated training switch | Safety circuits matter |
| Wrong charger chemistry | Label-only demo (do not actually misuse) | Chemistry mismatch risk |

### Tools
DMM, clamp DC ammeter if available, IR thermometer, OEM lithium tool/app, charger manuals.

---

## Week 3 Learning Objectives

1. Explain charger operating principles and stages (bulk, absorption, float/equalization).
2. Troubleshoot common charger failures: no output, low output, overcharge symptoms.
3. Describe key differences between lead-acid and lithium-ion golf cart systems.
4. Perform basic lithium diagnostics and explain BMS protective roles.

---

# Session 1 — Theory & Demonstration (2 hours)

**Materials needed:** Ferro-resonant and/or HF charger samples; onboard vs portable examples; whiteboard for charge-stage curve; lithium pack or screenshot set; BMS app/tool if available; handout preview of charger isolation steps; PPE; DMM for demos; “never LA charger on lithium” poster note.

### Timed Agenda

| Time | Min | Activity | Instructor Notes |
|---:|---:|---|---|
| 0:00 | 5 | Safety: charging hydrogen + lithium thermal awareness | No smoking; ventilated charge area |
| 0:05 | 15 | Charger types: ferro-resonant taper vs HF multi-stage | Pros/cons for fleets |
| 0:20 | 15 | Charge stages & equalization purpose (flooded only) | **[DIAGRAM PLACEHOLDER: V/I vs time curve — bulk/absorption/float]** |
| 0:35 | 10 | Onboard vs portable; interlocks & inhibit circuits | Key/seat/charger plug logic varies by brand |
| 0:45 | 5 | Break | |
| 0:50 | 20 | Lithium advantages, risks, LiFePO4 vs generic “lithium” talk | Emphasize correct charger & BMS dependency |
| 1:10 | 20 | BMS functions: balance, OV/UV, temp, fault comms | Show sample SOC/cell screenshots if no live pack |
| 1:30 | 15 | Lead-acid maintenance review: watering, cleaning, torque | Tie to PM Week 10 |
| 1:45 | 10 | Brand notes: Club Car / EZ-GO / Yamaha charger quirks overview | Always use model-year manual |
| 1:55 | 5 | Lab preview | |

### Key Teaching Points
- Charging algorithm must match chemistry — lead-acid EQ will damage lithium.
- “No charge” is a system problem: AC power, DC path, interlocks, pack acceptance, charger brain.
- BMS may disconnect for protection — treat as data, not a defective pack by default.
- DC-DC converters on lithium conversions power 12V accessories — separate from traction pack diagnostics.

### Common Misconceptions
| Misconception | Correction |
|---|---|
| “If the charger fan runs, it’s charging.” | Verify DC current into the pack. |
| “Lithium needs watering monthly.” | No watering; monitor SOC and use lithium charger only. |
| “Any 48V charger works on any 48V pack.” | Voltage class ≠ chemistry profile or connector/interlock logic. |
| “BMS faults mean replace the whole pack immediately.” | Read codes/history; check cell imbalance, temp, harness first. |

### Safety Reminders
- Disconnect power before opening charger cases (instructor-only internals unless designed for student access).
- Lithium thermal events: evacuate, extinguisher awareness, no water flood assumptions — follow shop EAP.
- Never bypass charger interlocks permanently.

---

# Session 2 — Hands-On Lab (2 hours)

**Materials needed:** `labs/W03_charger_troubleshoot.md`, `labs/W03_lithium_comparison.md`; planted no-charge scenario; DMM (+ clamp if available); lithium demo cart/tool or data sheets; GFCI-protected AC as required.

### Timed Agenda

| Time | Min | Activity | Instructor Notes |
|---:|---:|---|---|
| 0:00 | 5 | Safety brief; assign charger vs lithium rotations | |
| 0:05 | 25 | **Station 1:** Measure AC input, DC output V, estimate/measure current | Complete charger worksheet Section A |
| 0:30 | 25 | **Station 2:** Diagnose planted “no charge / won’t finish” | Require written isolation path |
| 0:55 | 5 | Rotate / break | |
| 1:00 | 25 | **Station 3:** Lithium demo — cell voltages, SOC, fault history | If no lithium: structured video + data sheet exercise |
| 1:25 | 20 | Lead-acid vs lithium voltage profile comparison table | Teams fill comparison lab |
| 1:45 | 15 | Debrief + quiz preview; cleanup | |

### Assessment Focus
Charger troubleshooting worksheet + lithium vs lead-acid comparison quiz.

---

## Week 3 Quiz (9 questions)

1. Bulk charge stage is best described as:  
   A) Maintaining float only  
   B) High current delivery until voltage setpoint approaches  
   C) Equalizing tires  
   D) Disabling the BMS  

2. Equalization charges are appropriate for:  
   A) All lithium packs weekly  
   B) Flooded lead-acid when indicated by procedure  
   C) AGM every night indefinitely  
   D) Controllers  

3. A common first measurement on a “no charge” complaint is:  
   A) Transaxle oil  
   B) AC power present at charger input  
   C) Toe alignment  
   D) Brush length  

4. BMS cell balancing primarily helps:  
   A) Keep cells within similar voltages for pack health  
   B) Increase tire life  
   C) Bypass HPD forever  
   D) Replace the solenoid  

5. True or False: Using a lead-acid charger on a lithium golf cart pack is acceptable if voltages match nominally.

### Short Answer

6. Name three BMS protective functions.  
7. List two differences between ferro-resonant and HF chargers.  
8. Why do charger interlock circuits exist?  
9. A lithium pack shows 0V at the main plug but the app shows SOC 55%. What is a likely explanation?

### Answer Key

1. **B**  
2. **B**  
3. **B**  
4. **A**  
5. **False**  
6. Any three: OV protection, UV protection, over-temp, under-temp charge inhibit, over-current, short protection, balancing, fault logging/comms  
7. Examples: ferro = simpler taper/heavy; HF = multi-stage, lighter, smarter sensing / fault detection  
8. Prevent drive-away while charging; ensure safe charge enable conditions  
9. BMS contactor/MOSFET open due to protection or enable logic — pack not presenting voltage externally  
