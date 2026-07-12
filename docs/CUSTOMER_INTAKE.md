# Customer Intake SOP (DMS)

Implements the Neighborhood Golf Carts **Customer Intake SOP** in the dashboard.

**Path:** `#/intake`  
**Roles:** Front desk, Service manager, Owner (technicians do not use Intake)

## Pipeline

| Stage | Meaning |
|-------|---------|
| New lead | Send initial text immediately |
| Awaiting reply | Waiting up to 24 hours |
| Follow-up sent | One check-back text; then stop outreach |
| On the phone / Collecting info | Quote diagnostic $179 + tax; set pickup zone |
| Awaiting photos | Diagnostic or estimate photo checklist |
| Awaiting diagnostic terms | Office Coordinator sent terms |
| Waitlist | Terms approved → Service Manager schedules |
| Estimate queue | Estimate for Office or Service Manager |
| Converted | Became a shop job (Received) |

## Scripts (copy buttons in app)

**Initial:**  
“Hi, this is with Neighborhood Golf Carts. We've just received your request about your golf cart. Do you have time for a quick call so we can get you an accurate estimate?”

**Follow-up (24h):**  
“Just checking back on your request. Still a good time to chat?”

## Pickup & delivery

- Free within 40 miles of North Shore shop, or anywhere on the South Shore of Lake Pontchartrain  
- $99 outside that area  

## Photos

- **Diagnostic:** front, whole battery compartment, whole dashboard, data tags  
- **Estimate:** front, battery compartment, data tags, repair/upgrade area, optional inspiration  

Leads are stored in browser `localStorage` (`ngc-customer-intake-v1`) on GitHub Pages.
