# Week 5 — Motor Controllers, Throttle & Solenoids

**Sessions:** 1 (Theory) · 2 (Lab) · **Total:** 4 hours  
**Primary LOs:** LO-07  
**Hands-on target:** Session 2 ≈ 80% practical

---

## PDF downloads (central library)

Printable PDFs live in the **[central downloads library](../../downloads.html#week-5)** (Command Center → Technician Training → PDF Downloads).

| Document | Download |
|---|---|
| Week 5 — Controllers, Throttle & Solenoids (this week) | [PDF](../../pdfs/week-05-controllers-throttle-solenoids.pdf) · [Library](../../downloads.html#week-05-controllers-throttle-solenoids) |
| Program Guide | [PDF](../../pdfs/program-guide.pdf) · [Library](../../downloads.html#program-guide) |
| Instructor Master Checklist | [PDF](../../pdfs/instructor-master-checklist.pdf) · [Library](../../downloads.html#instructor-master-checklist) |
| W05 Fault Code / Throttle / Solenoid | [PDF](../../pdfs/w05-fault-code-throttle-solenoid.pdf) · [Library](../../downloads.html#w05-fault-code-throttle-solenoid) |
| Curtis Fault Codes Reference | [PDF](../../pdfs/curtis-fault-codes-reference.pdf) · [Library](../../downloads.html#curtis-fault-codes-reference) |

Full catalog: [training/downloads.html](../../downloads.html)

## Instructor Preparation Guide (Complete Day Before)

### Pre-session setup
- [ ] Carts with Curtis (1204/1205/1268 family or similar) and/or Alltrax if available
- [ ] Print Curtis flash-code reference sheets; bookmark https://faultcodes.curtisinstruments.com/
- [ ] Identify throttle type on each cart (pot vs inductive/Hall)
- [ ] Prepare solenoid with known good coil Ω range card
- [ ] Plant: throttle signal issue OR HPD trip OR solenoid contact drop scenario
- [ ] Print `labs/W05_fault_code_throttle_solenoid.md`
- [ ] Status LED visibility — clean covers / use mirror

### Planted faults
| Fault | Method | Expected path |
|---|---|---|
| HPD / sequence fault | Depress pedal then turn key (demonstrate) | Teach correct key-then-pedal |
| Weak throttle signal | Partial connector backout (labeled training) | Measure input vs sweep |
| Solenoid high contact drop | Aged solenoid in circuit | Coil OK, contact drop fails under load |
| Stored flash code | Use cart with known code or simulator sheet | Interpret → confirm with tests |

### Tools
DMM, wiring diagram for each cart, insulated probes, optional Curtis programmer.

---

## Week 5 Learning Objectives

1. Explain controller, throttle, and main solenoid/contactor functions.
2. Read/interpret LED flash fault codes (Curtis and similar).
3. Test throttle signals and solenoid coil/contacts with a multimeter.

---

# Session 1 — Theory & Demonstration (2 hours)

**Materials needed:** Curtis (or similar) controller on cart; flash-code charts; `handouts/curtis_fault_codes_reference.md`; pot vs Hall throttle samples if available; solenoid cutaway/photo; block-diagram whiteboard; DMM.

### Timed Agenda

| Time | Min | Activity | Instructor Notes |
|---:|---:|---|---|
| 0:00 | 5 | Safety: controllers can present pack voltage; no jewelry | |
| 0:05 | 20 | Controller roles: PWM, current limit, regen, thermal, faults | **[DIAGRAM PLACEHOLDER: pack → solenoid → controller → motor block diagram]** |
| 0:25 | 15 | Curtis families overview (1204/1205/1268) + Alltrax mention | Stress model-specific manuals |
| 0:40 | 15 | Throttle types: potentiometer vs inductive/Hall | Failure modes differ |
| 0:55 | 5 | Break | |
| 1:00 | 15 | Solenoid: coil vs contacts; welded/burned failures | Voltage drop under load > coil Ω alone |
| 1:15 | 20 | Fault code reading methods; HPD / SRO interlocks | Live LED demo if possible |
| 1:35 | 15 | Symptom mapping: click-no-go, surge, limp, dead | Tie to Week 7 flowcharts |
| 1:50 | 10 | Lab preview; assign code lookup homework | |

### Key Teaching Points
- Flash codes are a starting point, not a parts list.
- HPD (High Pedal Disable) prevents run-away if pedal pressed at power-up — do not defeat.
- Solenoid contacts fail under load; always check voltage drop when current flows.
- Pinouts differ by model-year — diagram first.

### Instructor say/do (high-stakes moments)
- **Say:** “A click is the coil talking — the contacts still have to carry hundreds of amps.”  
- **Do:** Demonstrate HPD trip, then correct sequence; students must verbalize the sequence.  
- **Say:** “Write the controller model before you trust any flash-code chart.”  
- **Do:** Show Curtis translator lookup live if internet available; otherwise binder chart.

### Common Misconceptions
| Misconception | Correction |
|---|---|
| “Code 1-1 means replace controller.” | Confirm power, throttle, wiring, sequencer first. |
| “Solenoid clicks so contacts are fine.” | Click proves coil/pull-in, not contact health. |
| “Inductive throttles are tested like pots.” | Expect voltage signal patterns per OEM, not 0–5kΩ necessarily. |

### Safety Reminders
- Never bypass HPD/SRO for customer delivery.
- Probe carefully; accidental pack-to-signal shorts destroy controllers.
- Discharge wait times per OEM before unplugging controller if specified.

---

# Session 2 — Hands-On Lab (2 hours)

**Materials needed:** `labs/W05_fault_code_throttle_solenoid.md`; planted HPD/throttle/solenoid scenarios; matching OEM pinouts; insulated probes; optional programmer.

### Timed Agenda

| Time | Min | Activity | Instructor Notes |
|---:|---:|---|---|
| 0:00 | 5 | Safety + identify controller model/label | Photo label into notes |
| 0:05 | 20 | Observe LED; record flash code; look up meaning | Use Curtis translator/printout |
| 0:25 | 25 | Throttle test at controller input (0%→100%) | Record V or Ω per type |
| 0:50 | 5 | Break | |
| 0:55 | 25 | Solenoid: coil Ω, coil voltage when commanded, contact drop under load | Supervised drive wheels elevated if needed |
| 1:20 | 20 | HPD verification drill | Document pass/fail sequence |
| 1:40 | 15 | Worksheet completion + peer review | |
| 1:55 | 5 | Cleanup | |

### Assessment Focus
Fault code interpretation exercise + throttle/solenoid test sheet.

---

## Week 5 Quiz (9 questions)

1. PWM in a golf cart controller primarily:  
   A) Waters batteries  
   B) Controls effective power to the motor for speed/torque management  
   C) Aligns toe  
   D) Measures SG  

2. High Pedal Disable (HPD) is designed to:  
   A) Increase top speed  
   B) Prevent operation if throttle is applied at improper power-up sequence  
   C) Equalize cells  
   D) Bypass the solenoid forever  

3. A solenoid that clicks but cart doesn’t move — best next electrical check among these:  
   A) Paint color  
   B) Contact voltage drop / pack voltage at controller under attempt-to-run  
   C) Radio volume  
   D) Tire date only  

4. Curtis LED flash codes should be interpreted using:  
   A) Guesswork  
   B) Model-correct code chart / Curtis fault code resources  
   C) Tire pressure chart  
   D) Gasoline octane  

5. Potentiometer throttles are typically checked by measuring:  
   A) Resistance or voltage change through pedal travel  
   B) Compression psi  
   C) Transaxle backlash only  
   D) AC line frequency  

### Short Answer

6. Name three controller protection/features besides basic speed control.  
7. Why is contact voltage drop tested under load?  
8. List the correct operator sequence taught to avoid HPD trips (general).  
9. What information on the controller label must be recorded before diagnostics?

### Answer Key

1. **B**  
2. **B**  
3. **B**  
4. **B**  
5. **A**  
6. Current limit, regen, thermal protection, fault logging, undervoltage/overvoltage cutbacks, etc.  
7. Contacts can show continuity yet drop excessive voltage (heat/power loss) when carrying current  
8. Typically: pedal up → key on / enable → then apply throttle (confirm OEM procedure)  
9. Model number, voltage, and any software/revision identifiers available  
