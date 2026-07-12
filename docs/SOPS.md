# DMS SOP operating system

The dashboard is driven by registered **Standard Operating Procedures**.

- **Hub:** https://ngc4160.github.io/NGC-Brain/#/sops  
- **How to add more:** [ADDING_SOPS.md](./ADDING_SOPS.md)

## Who can read what

| Role | Access |
|------|--------|
| **Ryan** (service manager) | Full SOP library anytime — Office, Shop, Driver, Shared |
| **Christine** (office) | Full SOP library anytime — same as Ryan |
| **Owner** | Full SOP library |
| **Technicians** | QC, deposit gates, shop workflow, whiteboard |
| **Drivers (Roy)** | Pickup zones, driver route checklist, workflow & whiteboard |
| **Office staff** | Same full library as Christine when signed in as front-desk/office |

Ryan and Christine get a dedicated **SOPs** entry in the bottom nav and a **SOP library** block on the dashboard.

## Active SOPs

### Office
1. **Customer Intake** — live module (`#/intake`)  
2. **Repair Intake Checklist** — runnable checklist  

### Pickup & delivery
3. **Pickup & Delivery Zones** — policy  
4. **Driver Route & Cart Handling** — runnable checklist for Roy  

### Shop floor
5. **Deposit Gates** — enforced on Jobs/Board  
6. **Job Assignment** — Service Manager assigns techs on Board  
7. **Shop QC** — live module (`#/qc`)  

### Shop-wide
8. **Shop Workflow** — end-to-end reference  
9. **Shop Whiteboard** — physical board lanes / WIP caps  

Custom checklist SOPs can also be added on-device from Settings (owner / service manager). Permanent SOPs belong in `src/sops/catalog/`.

Knowledge sources live under `knowledge/04_operations/` (imported from NGC ops docs).
