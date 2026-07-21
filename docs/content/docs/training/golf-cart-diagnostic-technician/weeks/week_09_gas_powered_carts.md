# Week 9 — Gas-Powered Carts & Special Systems

**Sessions:** 1 (Theory) · 2 (Lab) · **Total:** 4 hours  
**Primary LOs:** LO-11  
**Hands-on target:** Session 2 ≈ 75% practical (+ strong safety brief)

---

## PDF downloads (central library)

Printable PDFs live in the **[central downloads library](../../downloads.html#week-9)** (Command Center → Technician Training → PDF Downloads).

| Document | Download |
|---|---|
| Week 9 — Gas-Powered Carts (this week) | [PDF](../../pdfs/week-09-gas-powered-carts.pdf) · [Library](../../downloads.html#week-09-gas-powered-carts) |
| Program Guide | [PDF](../../pdfs/program-guide.pdf) · [Library](../../downloads.html#program-guide) |
| Instructor Master Checklist | [PDF](../../pdfs/instructor-master-checklist.pdf) · [Library](../../downloads.html#instructor-master-checklist) |
| W09 Gas Diagnostic Checklist | [PDF](../../pdfs/w09-gas-diagnostic-checklist.pdf) · [Library](../../downloads.html#w09-gas-diagnostic-checklist) |

Full catalog: [training/downloads.html](../../downloads.html)

## Instructor Preparation Guide (Complete Day Before)

### Pre-session setup
- [ ] Stage 1–2 gas carts or engine stand (Subaru/Kohler/typical single-cylinder 4-stroke)
- [ ] Fire extinguisher at station; no smoking zone; fuel handling SOP posted
- [ ] Compression tester, spark tester (inline/safe type), plug socket, feeler gauge
- [ ] Fresh spark plugs for demo; sample fouled plugs
- [ ] Print `labs/W09_gas_diagnostic_checklist.md`
- [ ] Verify kill switch / seat switch operation before student work
- [ ] If EFI cart available: demo only unless instructor EFI-qualified

### Planted / selected conditions
| Condition | Notes |
|---|---|
| Fouled plug | Classic no-start teaching aid |
| Restricted fuel filter | If safely recreatable |
| Low compression engine (known) | For comparison readings |
| Misadjusted governor (instructor demo only) | Do not let students set unsafe high RPM |

### Safety staging
- Cool engines before plug removal when possible; hot exhaust warning.
- Carbon monoxide: doors/ventilation; never run indoors without exhaust plan.
- Fuel spills: stop, absorb, ventilate — no starting.

---

## Week 9 Learning Objectives

1. Explain basic 4-stroke operation in gas golf carts.
2. Perform basic diagnostics: compression, spark, fuel delivery checks.
3. Recognize when issues need engine-specialty expertise vs electrical-style isolation.

---

# Session 1 — Theory & Demonstration (2 hours)

**Materials needed:** Gas cart or engine stand; sample plugs (good/fouled); fuel filter cutaway if available; extinguisher at instructor station; 4-stroke diagram; ventilation confirmation.

### Timed Agenda

| Time | Min | Activity | Instructor Notes |
|---:|---:|---|---|
| 0:00 | 10 | Gasoline safety deep-dive | Fire, fumes, hot surfaces, spill response |
| 0:10 | 15 | 4-stroke basics: intake/compression/power/exhaust | **[DIAGRAM PLACEHOLDER: 4-stroke cycle for single-cylinder cart engine]** |
| 0:25 | 15 | Fuel system: tank, filter, pump, carb/EFI, governor | |
| 0:40 | 15 | Ignition: plug, coil, kill/safety interlocks | Seat/brake switches common |
| 0:55 | 5 | Break | |
| 1:00 | 20 | Symptom map: no-start, surge, power loss, overheat, smoke | |
| 1:20 | 15 | Electric vs gas diagnostic mindsets compared | Different tools; same 7 steps |
| 1:35 | 15 | Fleet trend note: gas → electric/lithium conversions | Maintenance cost/emissions context |
| 1:50 | 10 | Lab PPE & extinguisher locations check | |

### Key Teaching Points
- Same 7-step process — different subsystem tests (compression/spark/fuel).
- Safety interlocks on gas carts strand “good engines.”
- Governor mistakes can overspeed and destroy engines — instructor-controlled adjustments only.
- EFI requires different tooling; know your limits.

### Common Misconceptions
| Misconception | Correction |
|---|---|
| “No-start = bad engine.” | Kill switch, empty tank, fouled plug, safety switch often guilty. |
| “More fuel = better.” | Flooding and mixture issues cause misfire/smoke. |
| “Gas cart electrical doesn’t matter.” | Charging/lighting/solenoids/safety circuits still critical. |

### Safety Reminders
- Extinguisher within reach before cranking after fuel work.
- No open containers of gasoline in bay.
- Disconnect spark lead properly when pulling compression if procedure requires.

---

# Session 2 — Hands-On Lab (2 hours)

**Materials needed:** `labs/W09_gas_diagnostic_checklist.md`; compression tester; safe spark tester; plug tools; rags/absorbent; extinguisher; PPE; instructor EFI demo only if equipped.

### Timed Agenda

| Time | Min | Activity | Instructor Notes |
|---:|---:|---|---|
| 0:00 | 10 | Safety brief + extinguisher + ventilation check | Sign safety acknowledgment on checklist |
| 0:10 | 20 | Compression test (training cart/stand) | Record psi; discuss dry/wet if taught |
| 0:30 | 20 | Spark test (safe method) + plug inspection/gap | Compare fouled vs new |
| 0:50 | 5 | Break | |
| 0:55 | 20 | Fuel system basics: filter condition, fuel present, bowl check if accessible | No smoking; rags ready |
| 1:15 | 15 | Safety interlock quick checks (seat/brake/kill) | |
| 1:30 | 15 | Side-by-side: write how 7-step differed from electric cart | |
| 1:45 | 15 | Cleanup; quiz; secure fuel caps | |

### Assessment Focus
Gas diagnostic checklist + short quiz on engine fundamentals vs electric systems.

---

## Week 9 Quiz (8 questions)

1. A typical golf cart gas engine in this curriculum is described as:  
   A) V8 diesel  
   B) Single-cylinder 4-stroke (common OEM families)  
   C) Turbine  
   D) Two-stroke outboard only  

2. Before diagnosing a no-start gas cart, verify:  
   A) Only tire brand  
   B) Fuel present, spark potential, compression path, and safety interlocks  
   C) Lithium cell balance  
   D) PWM percent  

3. Running a gas cart engine indoors without exhaust control risks:  
   A) Better fuel economy  
   B) Carbon monoxide exposure  
   C) Higher SG  
   D) Stronger regen  

4. Governor systems primarily:  
   A) Control maximum engine speed / load response  
   B) Charge lithium packs  
   C) Replace brakes  
   D) Read Curtis codes  

5. True or False: The 7-step diagnostic process still applies to gas carts.

### Short Answer

6. List the three classic no-start pillars checked in lab (spark/fuel/compression concept).  
7. Name two gas-cart safety interlocks commonly found.  
8. Why might a fleet convert gas carts to electric/lithium?

### Answer Key

1. **B**  
2. **B**  
3. **B**  
4. **A**  
5. **True**  
6. Spark, fuel delivery, compression (plus air & interlocks as taught)  
7. Seat switch, kill switch, brake/pedal switch, neutral start — any two valid  
8. Lower operating cost, less emissions/maintenance, shop standardization, customer preference, etc.  
