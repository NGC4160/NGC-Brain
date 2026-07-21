# Week 4 — Electric Motors

**Sessions:** 1 (Theory) · 2 (Lab) · **Total:** 4 hours  
**Primary LOs:** LO-06  
**Hands-on target:** Session 2 ≈ 85% practical

---

## Instructor Preparation Guide (Complete Day Before)

### Pre-session setup
- [ ] Training cart with accessible motor OR bench motor with labeled terminals
- [ ] Brush length spec sheet for that motor (OEM or training card)
- [ ] Micrometer/caliper, mirror, flashlight, feeler tools
- [ ] DMM; megger or high-ohm insulation check method card
- [ ] Print `labs/W04_motor_inspection_report.md`
- [ ] Torque specs for reinstall if students remove motor cover/motor
- [ ] Confirm F&R contactor location for demo

### Planted / selected conditions
| Condition | Notes |
|---|---|
| Worn brushes (near limit) | Ideal for measurement practice |
| Scored commutator photos if live not available | Use photo set |
| Motor with elevated no-load current (if safe) | Instructor-supervised dynamic test only |

### Safety
- Dynamic tests: jack stands/wheel chocks; no bystanders in arc of wheels; pack LOTO when probing internals.

---

## Week 4 Learning Objectives

1. Identify series, SepEx, and PM/BLDC motor types and operating characteristics.
2. Perform thorough visual and electrical inspection of DC motors.
3. Diagnose worn brushes, commutator issues, armature/field faults, bearing failure.

---

# Session 1 — Theory & Demonstration (2 hours)

**Materials needed:** Sample motor or cutaway photos; brush samples (new vs worn); F&R contactor for demo; whiteboard PWM sketch; OEM brush-length specs; PPE discussion for rotating parts.

### Timed Agenda

| Time | Min | Activity | Instructor Notes |
|---:|---:|---|---|
| 0:00 | 5 | Safety: rotating parts, high current at A1/A2/S1/S2 | |
| 0:05 | 20 | Motor types: Series, SepEx, PM/BLDC | Map to cart generations (Club Car/EZ-GO/Yamaha examples) |
| 0:25 | 15 | Components: armature, field, commutator, brushes, bearings, fan | **[DIAGRAM PLACEHOLDER: series DC motor cutaway with brush gear]** |
| 0:40 | 15 | Torque/speed vs controller PWM relationship | Conceptual; no deep control theory |
| 0:55 | 5 | Break | |
| 1:00 | 15 | F&R contactor / reverse logic interaction | Wrong reverse diagnosis often blamed on motor |
| 1:15 | 20 | Wear patterns & service life (brushes 500–2000+ hrs typical range) | Replace criteria: <½ original or OEM spec |
| 1:35 | 15 | Electrical test theory: resistance, shorts to ground | Megger caution on sensitive electronics — isolate motor |
| 1:50 | 10 | Lab plan & lift points review | |

### Key Teaching Points
- Many “bad motors” are bad cables, solenoids, or controllers — test before condemning.
- Brush dust + moisture → ground faults.
- Commutator mica condition matters; do not file aggressively without training.
- Isolate motor from controller before insulation tests that could damage electronics.

### Common Misconceptions
| Misconception | Correction |
|---|---|
| “If it spins by hand it’s electrically fine.” | Opens/shorts may still exist under load. |
| “Any low ohms reading means good.” | Compare to OEM specs; look for shorts to ground. |
| “BLDC service is identical to brushed.” | Different diagnostics; often module/sensor related. |

### Safety Reminders
- Chock wheels; support cart properly before underbody work.
- Pack isolated when fingers are near commutator/brush gear.
- Hot motors after run — burn hazard.

---

# Session 2 — Hands-On Lab (2 hours)

**Materials needed:** `labs/W04_motor_inspection_report.md`; training cart/bench motor; calipers; DMM; megger or high-ohm method card; torque specs; wheel chocks; LOTO kit.

### Timed Agenda

| Time | Min | Activity | Instructor Notes |
|---:|---:|---|---|
| 0:00 | 5 | LOTO verify; PPE; assign motors | |
| 0:05 | 15 | Access motor; visual exterior + cable condition | |
| 0:20 | 20 | Brush length measurement & commutator inspection | Record against spec |
| 0:40 | 10 | Bearing play/noise check | |
| 0:50 | 5 | Break | |
| 0:55 | 25 | Electrical: armature/field resistance; insulation-to-ground | Instructor approves megger use |
| 1:20 | 20 | Dynamic no-load / direction check (supervised) | Record current if clamp available |
| 1:40 | 15 | Complete inspection report + recommend rebuild/replace/OK | |
| 1:55 | 5 | Reassemble critical covers; cleanup | |

### Assessment Focus
Motor inspection & test report with notes and recommended action.

---

## Week 4 Quiz (8 questions)

1. Separately excited (SepEx) motors differ from series motors primarily in:  
   A) Tire size  
   B) How the field is powered/controlled relative to the armature  
   C) Fuel octane  
   D) Number of solenoids only  

2. Brushes are typically replaced when:  
   A) They look shiny  
   B) Length is below OEM minimum or ~½ original (per training rule/spec)  
   C) The cart is washed  
   D) SG is low  

3. A short from winding to motor case is detected by:  
   A) Tire pressure  
   B) Insulation resistance / continuity-to-ground checks (power isolated)  
   C) Hydrometer  
   D) Toe plates  

4. Forward/Reverse contactors:  
   A) Only affect headlights  
   B) Change motor field/armature polarity relationships for direction  
   C) Replace the BMS  
   D) Are never used on Club Car  

5. True or False: You should megger a motor while it is still connected to a sensitive controller.

### Short Answer

6. List four motor components inspected visually in lab.  
7. What does excessive no-load current possibly indicate?  
8. Why measure brush length with a real tool instead of “eyeballing”?

### Answer Key

1. **B**  
2. **B**  
3. **B**  
4. **B**  
5. **False** — isolate first  
6. Brushes, commutator, cables/terminals, cooling fan, bearings/housing, mounting, etc.  
7. Dragging bearings, partial shorts, incorrect wiring, mechanical bind  
8. Specs are quantitative; eyeballing misses marginal wear and creates inconsistent replace decisions
