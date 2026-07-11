# Shop access — passcodes & roles

Sign-in uses **4–6 digit passcodes** (shop-floor PINs stored on the device). This is not internet-grade security; change PINs in **Settings** after first login.

## Default passcodes

| Person | Role | Passcode |
|--------|------|----------|
| Ryan White | Service manager | `2468` |
| Christine White | Front desk | `1357` |
| Owner | Owner | `0416` |
| Taylor | Technician (slot 1) | `1111` |
| Marlon | Technician (slot 2) | `2222` |
| Peyton | Technician (slot 3) | `3333` |
| Slot 4–5 | Technician | inactive until named + PIN set |

## What each role can do

| Area | Owner | Service manager | Technician | Front desk |
|------|:-----:|:---------------:|:----------:|:----------:|
| Dashboard / Board / Jobs | ✓ | ✓ | assigned only | ✓ |
| Assign technicians | ✓ | ✓ | — | — |
| QC form | ✓ | ✓ | assigned jobs | — |
| Agent Input | ✓ | ✓ | assigned jobs | ✓ |
| Manuals | ✓ | ✓ | ✓ | ✓ |
| Invoicing | ✓ | ✓ | — | ✓ |
| Settings / passcodes | ✓ | ✓ | — | — |

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

## Notes

- Session is stored in `sessionStorage` (clears when the browser tab closes)  
- Roster/passcodes persist in `localStorage` on that phone/computer  
- Match **assigned tech** names exactly to roster names (Taylor, Marlon, Peyton, …)
