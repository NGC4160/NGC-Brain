# Diagnostics library

**Last verified:** 2026-09-04  
**Owner:** **Diagnostics** bot (reports to Chief). Techs file evidence here. Shop still owns Housecall Pro jobs.

This folder is the shop’s **evidence library** for Neighborhood Golf Carts diagnostics. It starts empty on purpose. Do **not** invent case data, waveforms, customer PII, secrets, or “typical” traces to fill it.

## Standing rules

- **TEST BEFORE REPLACEMENT.** Prove the failed part with measurements before ordering or swapping.
- **Evidence-first.** A complaint plus a guess is not a diagnosis. Record what you tested, what you measured, and what still does not fit.
- **No parts-cannon.** Do not shotgun solenoids, controllers, throttles, or motors to “see if it fixes it.”
- **AI supports the tech.** Diagnostics bot compares captures, points at OEM manuals, and helps write the case. It does **not** replace hands-on tests, a meter, or a scope on the cart.
- **No customer PII in this repo.** No names, phones, addresses, or Housecall Pro job numbers. Vehicle year / make / model / serial is enough to file a case.

Fee and billing rules for diagnostic work stay in [`../03_services/shop_services.md`](../03_services/shop_services.md). This library is how we **file the work**, not how we price it.

## Lithium shop rule (internal)

A cart that **runs is not a finished lithium conversion.** Inspect, test, and tune still have to happen. Do not close the conversion on “it moved.”

**Customer warranty language stays 5-year full replacement on battery + BMS only.** Do not claim UL listing, 10-year coverage, or any extra warranty in case notes, bot replies, or customer copy. Facts: [`../02_products/lithium_conversions.md`](../02_products/lithium_conversions.md) · [`../07_customers_marketing/customer_reply_standard.md`](../07_customers_marketing/customer_reply_standard.md).

## How Diagnostics bot + techs file a case

Copy [`cases/_TEMPLATE.md`](cases/_TEMPLATE.md) into `cases/` using the naming rule in [`cases/README.md`](cases/README.md). Fill every section you actually ran. Leave blank what you did not test. Never invent a number to make the form look complete.

| Section | What to capture |
|---------|-----------------|
| **Vehicle** | Year, make, model, serial (and voltage / motor type if known). No customer name, phone, or HCP job number. |
| **Symptoms** | What the cart does / does not do, when, and under what conditions (key on, pedal, direction, temperature, load). |
| **Tests performed** | The actual tests, in order, with test points and meter/scope setup. |
| **Measurements / waveforms** | Readings with units. If you attach a capture, say which folder it lives in (`known-good/` or `known-faulted/`) and the known-good criteria you used: **voltage, timing, shape, stability, frequency, load response, signal relationships**. |
| **Conflicting evidence** | Anything that does **not** fit the leading theory. Write it down. Do not delete it. |
| **Outcome / repair verification** | What was repaired, then the **re-test** that proves the complaint is gone (same tests as before, plus a road test when safe). |

Chief routes diagnostic-library work to **Diagnostics**. Diagnostics brings the write-up back in Chief’s thread. Shop updates the HCP job. Parts orders only after the test proves the part.

## Library layout

| Path | What belongs here |
|------|-------------------|
| [`known-good/`](known-good/README.md) | Confirmed-healthy captures (motors, solenoids, controller I/O, throttles, control circuits) |
| [`known-faulted/`](known-faulted/README.md) | Confirmed-fault captures in the same subfolders |
| [`cases/`](cases/README.md) | Dated case write-ups (template only until real jobs are filed) |

Each component subfolder has a one-paragraph README. Do not drop unlabeled screenshots into the folder root.

## OEM manuals (read these; do not guess pinouts)

Use OEM diagrams and service manuals **before** interpreting a waveform or calling a pin.

| Source | What it is |
|--------|------------|
| **Drive — Manuals** | [Google Drive folder](https://drive.google.com/drive/folders/1-1QqJQh4UojQEERawwpfEjKYOor2VMuR) (`1-1QqJQh4UojQEERawwpfEjKYOor2VMuR`) — brand folders **EZGO**, **Club Car**, **Yamaha**, **Other** |
| **NGC Manuals board** | Shop manuals board (same brand split). Use it with Drive; do not treat this brain as a substitute for the OEM PDF. |
| **Drive — Procedures** | [Procedures folder](https://drive.google.com/drive/folders/1-NjzSQxTsbXqlOhbK7ptZzg1H5G2ntdh) — includes `NGC_Technician_Standard_Diagnosing_Test_Process_and_Procedure` |

Live Drive **content** is the Google Drive connector (NGC985). This repo does not clone manuals. Catalog only: [`../.generated/drive_catalog.md`](../.generated/drive_catalog.md).

The 10-week pack under `docs/training/` is training material, **not** this library and **not** shop policy.

## What not to put here

- Customer names, phones, emails, addresses, invoice numbers, HCP job numbers
- Passwords, API keys, or other secrets
- Invented “example” waveforms, voltages, or repaired-case stories
- Parts lists used as a substitute for a test
