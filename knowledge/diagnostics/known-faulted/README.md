# Known-faulted captures

Store **confirmed-fault** traces only — taken on a cart where the failure mode was proven by test, then (when possible) matched against a known-good in the same component folder. Subfolders: [motors](motors/README.md), [solenoids](solenoids/README.md), [controller-io](controller-io/README.md), [throttles](throttles/README.md), [control-circuits](control-circuits/README.md).

Name the proven fault on the file (open, short, drop-out, noise, wrong timing, etc.). Document the same known-good criteria you used to call it bad: **voltage, timing, shape, stability, frequency, load response, and signal relationships**. Link the matching case in `cases/` when one exists. No customer PII, no HCP job numbers, no invented traces. This folder is empty until a tech files a real known-faulted.
