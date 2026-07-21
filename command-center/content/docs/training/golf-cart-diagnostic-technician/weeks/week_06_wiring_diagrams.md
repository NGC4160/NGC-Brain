# Week 6 — Wiring Diagrams & Schematics

**Sessions:** 1 (Theory) · 2 (Lab) · **Total:** 4 hours  
**Primary LOs:** LO-08  
**Hands-on target:** Session 2 ≈ 85% practical

---

## Instructor Preparation Guide (Complete Day Before)

### Pre-session setup
- [ ] Print or display **correct model-year** diagrams for each training cart (Club Car, EZ-GO, Yamaha)
- [ ] Large schematic on screen/poster for group tracing
- [ ] Prepare planted faults: open, short-to-ground training lead, high-resistance crimp
- [ ] Crimping station: ratcheting crimper, terminals, heat shrink, dielectric grease, soldering iron
- [ ] Print `labs/W06_harness_fault_isolation.md` and handout `wiring_symbol_glossary.md`
- [ ] Fuse/relay assortment for testing practice

### Planted faults (label carts after lab for reset)
| Fault type | Safe planting method |
|---|---|
| Open | Inline training fuse removed / connector pin backed out (logged) |
| High resistance | Intentionally poor training splice in non-critical lamp circuit preferred; or documented high-R jumper |
| Short | Use fused short box on low-energy circuit — **never** uncontrolled pack short |

### Tools
DMM, wiring diagrams, pin probes, mirror, contact cleaner, crimp tools.

---

## Week 6 Learning Objectives

1. Read and navigate OEM golf cart wiring diagrams.
2. Identify standard schematic symbols; distinguish power vs signal circuits.
3. Trace systematically to locate opens, shorts, and high-resistance connections.
4. Perform basic connector repair to shop standard.

---

# Session 1 — Theory & Demonstration (2 hours)

**Materials needed:** `handouts/wiring_symbol_glossary.md`; large schematic display; printed model-year diagrams for demo cart; bad-crimp vs good-crimp samples; voltage-drop demo leads; whiteboard.

### Timed Agenda

| Time | Min | Activity | Instructor Notes |
|---:|---:|---|---|
| 0:00 | 5 | Safety: probing live circuits; one-hand rule | |
| 0:05 | 15 | Symbol literacy drill | Use glossary handout; **[DIAGRAM PLACEHOLDER: symbol sheet poster]** |
| 0:20 | 15 | Power vs signal: cable gauge & expectations | Thick pack cables vs throttle sense wires |
| 0:35 | 15 | Brand harness notes: color codes vary — verify diagram | Club Car vs EZ-GO vs Yamaha examples |
| 0:50 | 5 | Break | |
| 0:55 | 20 | Guided group trace: battery+ → solenoid → controller → motor | Everyone points on printed diagram |
| 1:15 | 15 | Common failure points: chafe, water, rodents, bad grounds | Photos |
| 1:30 | 20 | Method: voltage drop vs continuity for high R | Teach when each is valid |
| 1:50 | 10 | Lab preview; wrong-year diagram caution story | |

### Key Teaching Points
- Wrong model-year diagram is worse than no diagram.
- Continuity with power disconnected; voltage drop with controlled power applied.
- Grounds are suspects — measure them.
- Dielectric grease after proper clean/crimp — not a substitute for metal-to-metal contact.

### Common Misconceptions
| Misconception | Correction |
|---|---|
| “Same color wire means same function across brands.” | Colors are OEM-specific. |
| “Beep = good cable for 200A.” | Use voltage drop under load for power cables. |
| “Twisting wires is a fine repair.” | Use proper terminals, crimp height, strain relief, seal. |

### Safety Reminders
- Pull fuses / isolate before cutting or splicing.
- Protect circuits with proper fuse rating after repair — never copper-slug.
- Soldering irons: burn/fire awareness; stand required.

---

# Session 2 — Hands-On Lab (2 hours)

**Materials needed:** `labs/W06_harness_fault_isolation.md`; planted open/high-R faults (fused short box if used); crimp station consumables; DMM; dielectric grease; heat shrink; matching diagrams.

### Timed Agenda

| Time | Min | Activity | Instructor Notes |
|---:|---:|---|---|
| 0:00 | 5 | Assign carts + diagrams; PPE | Confirm diagram matches cart tag |
| 0:05 | 20 | Trace main power path on cart while marking diagram | Checkpoint with instructor |
| 0:25 | 20 | Test key switch, direction, throttle enable, solenoid coil feed | Record findings |
| 0:45 | 5 | Break | |
| 0:50 | 30 | Locate planted fault using DMM + diagram | Complete isolation form |
| 1:20 | 25 | Connector repair practice: cut, strip, crimp, seal | Instructor QC crimps |
| 1:45 | 15 | Debrief faults; restore training circuits; cleanup | |

### Assessment Focus
Diagram navigation quiz + successful location/repair of planted wiring fault.

---

## Week 6 Quiz (8 questions)

1. Before tracing a cart, you must confirm the diagram matches:  
   A) Only paint color  
   B) Make, model, and year/configuration  
   C) Tire brand  
   D) Owner’s favorite radio station  

2. A solenoid coil circuit is typically a:  
   A) Very high current traction cable  
   B) Control/signal-level circuit relative to motor cables  
   C) Fuel line  
   D) Shock absorber  

3. Best method to evaluate a main battery cable under load:  
   A) Smell test  
   B) Voltage drop measurement while current flows  
   C) Paint thickness  
   D) Horn volume  

4. Standard schematic symbols should be learned because:  
   A) They are identical to tire codes  
   B) They allow rapid identification of components across diagrams  
   C) They replace OEM manuals entirely  
   D) They are unused in golf carts  

5. True or False: Water intrusion at connectors can cause intermittent high resistance and corrosion.

### Short Answer

6. List three common physical harness failure points.  
7. Describe the difference between an open and a short.  
8. Why apply dielectric grease after a quality crimp on exposed connectors?

### Answer Key

1. **B**  
2. **B**  
3. **B**  
4. **B**  
5. **True**  
6. Chafe points, grommets, under-seat moisture zones, rodent areas, ground lugs, etc.  
7. Open = broken path / infinite resistance; short = unintended low-resistance path to another circuit/ground  
8. Moisture exclusion / corrosion slow-down — does not fix a bad crimp  
