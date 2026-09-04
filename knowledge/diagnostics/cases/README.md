# Diagnostic cases

Dated write-ups for real NGC diagnostic jobs. This folder starts with a template only. Do **not** invent example cases, waveforms, or outcomes.

**Diagnostics bot** helps the tech fill the form. The tech still runs the tests. **TEST BEFORE REPLACEMENT.**

## How to file

1. Copy [`_TEMPLATE.md`](_TEMPLATE.md).
2. Name the file `YYYY-MM-DD-<symptom-or-system>.md` (example pattern: `2026-09-04-no-move-solenoid.md`). Use date + vehicle class + symptom. **Never** put a customer name, phone, or Housecall Pro job number in the filename or body.
3. Fill **vehicle** (year / make / model / serial), **symptoms**, **tests performed**, **measurements / waveforms**, **conflicting evidence**, and **outcome / repair verification**.
4. Leave blank anything you did not test. Do not invent a reading.
5. If you saved a capture, put it in [`../known-good/`](../known-good/README.md) or [`../known-faulted/`](../known-faulted/README.md) and link the path from the case. Judge traces on **voltage, timing, shape, stability, frequency, load response, and signal relationships**.
6. Re-test after the repair. A cart that runs is not verification by itself — same tests, then a road test when safe. On lithium conversions, running still does **not** mean the conversion is complete (inspect, test, and tune).

OEM pinouts and procedures: Drive Manuals (EZGO / Club Car / Yamaha / Other) and the **NGC Manuals board** — see [`../README.md`](../README.md).

## Privacy

This is a public repo. Vehicle serial is allowed. Customer identity and HCP job numbers stay in Housecall Pro.
