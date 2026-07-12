# Shop access — passcodes & roles

Sign-in uses **4–6 digit passcodes** (shop-floor PINs stored on the device). This is not internet-grade security; change PINs in **Settings** after first login.

## Default passcodes

| Person | Role | Passcode |
|--------|------|----------|
| Ryan White | Service manager | `2468` |
| Christine White | Office | `1357` |
| Owner | Owner | `0416` |
| Roy | Driver | `4444` |
| Taylor | Technician (slot 1) | `1111` |
| Marlon | Technician (slot 2) | `2222` |
| Peyton | Technician (slot 3) | `3333` |
| Slot 4–5 | Technician | inactive until named + PIN set |

## What each role can do

| Area | Owner | Service manager | Office | Technician | Driver |
|------|:-----:|:---------------:|:------:|:----------:|:------:|
| Dashboard / Board | ✓ | ✓ | ✓ | assigned jobs | ✓ (board) |
| Assign technicians | ✓ | ✓ | — | — | — |
| QC form | ✓ | ✓ | — | assigned jobs | — |
| Customer Intake | ✓ | ✓ | ✓ | — | — |
| **SOPs hub** | full | full | full | QC / workflow / board | driver SOPs |
| Agent Input | ✓ | ✓ | ✓ | assigned jobs | — |
| Manuals | ✓ | ✓ | ✓ | ✓ | ✓ |
| Invoicing | ✓ | ✓ | ✓ | — | — |
| Settings / passcodes | ✓ | ✓ | — | — | — |

## SOP library (Ryan & Christine)

Open **SOPs** anytime from the bottom nav, sidebar, or dashboard. The hub lists every procedure on file, grouped Office / Shop / Driver / Shared. Technicians and Roy see only the SOPs for their work.

## Service manager workflow

1. Sign in with manager passcode  
2. Open **Board** or **Jobs**  
3. Use **Assign tech** on each cart  
4. Techs only see jobs assigned to their name  

## Technician workflow

1. Sign in with tech passcode  
2. Board / Jobs show **only your carts**  
3. Update status and log work in **Input**  
4. Open **QC** when the cart is in In Repair / QA — save checklist, optionally move to **Ready**  

## Driver workflow

1. Sign in with Roy’s passcode  
2. Open **SOPs → Driver route** for the day’s checklist  
3. Use **Board** for Out Today context  

## Notes

- Session is stored in `sessionStorage` (clears when the browser tab closes)  
- Roster/passcodes persist in `localStorage` on that phone/computer  
- Match **assigned tech** names exactly to roster names (Taylor, Marlon, Peyton, …)
