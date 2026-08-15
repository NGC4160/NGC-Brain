# Golf Cart Rental Insurance — Rating Factor Catalog

**Status:** Planning only — NGC does **not** rent carts today  
**Last verified:** 2026-08-15  
**Use:** Build a *planning* quote calculator and a broker RFP. Not a bindable rate manual.

**NGC context:** Shop-only repair + lithium conversions at 71363 Thelma Ln, Suite E, Covington, LA 70433 (St. Tammany Parish, ZIP 70433). Rentals are deferred until the service shop is solid (`decision_log.md` 2026-06-28).

---

## What this is — and what it is not

U.S. carriers do **not** publish one public “golf-cart rental” rate page with official weights. Pricing is a stack of:

1. **ISO / AAIS / NCCI published loss costs** (class + territory + limits) where an admitted form exists
2. **Proprietary company deviations** (IRPM, schedule rating, package mods) — typically ±25–40% and **not public**
3. **Specialty / surplus-lines program rates** (most true *rental* fleets land here)
4. **Underwriter judgment** (refer / decline / debit) that can outweigh the math

**Do not treat the multipliers below as leaked carrier manuals.** They are **industry-typical ranges** used by specialty RV, LSV, and recreational-rental underwriters so you can build a calculator that is *directionally accurate* (usually within ~25–40% of a real quote *if* the risk is placeable). Always validate with 3 markets before budgeting.

**Hard truth for this class:** many admitted shop carriers **exclude rental**. Golf-cart *rental to the public* is a high-frequency BI/PD class (unfamiliar drivers, alcohol, roads, events). A clean shop account can become unplaceable or surplus-only the day rental starts.

---

## Coverage stack (what you actually buy)

| Line | Typical form | What it pays | Usual rating base |
|------|--------------|--------------|-------------------|
| **General liability (CGL)** | ISO CG 00 01 + rental / mobile-equipment endorsements | 3rd-party BI/PD, personal & advertising injury, products/completed ops | Gross receipts **or** # of carts **or** rental days |
| **Physical damage (comp / collision)** | Inland marine floater, RV/LSV physical damage, or auto physical damage | Your carts: collision, OTC (theft, vandalism, flood if bought, wind/hail) | ACV or stated amount × rate |
| **Hired & non-owned auto (HNOA)** | CA 00 01 hired/non-owned or CGL hired-auto endorsement | Employee in a personal/rental vehicle on company business; sometimes delivery | # drivers **or** cost-of-hire |
| **Garagekeepers / bailee** | Garagekeepers legal liability (GKLL) | **Customer** carts in your care (repair shop) — *not* your rental fleet | Limit + lot protection |
| **Umbrella / excess** | Commercial umbrella (follow-form) | Excess over CGL / auto / (sometimes) employer’s liability | Per $1M layer × attachment quality |
| **Workers’ compensation** | LA WC policy (competitive market; LWCC is a common market) | Employee injury; employer’s liability | Payroll / $100 × class × e-mod |
| **Inland marine / specialty** | Equipment floater, transit, dealers open lot, event, cyber | Scheduled gear, carts in transit, off-lot storage, events | TIV or receipts |

**Related policies NGC already needs as a shop** (separate from rental): tenant property, tools/equipment, commercial auto on the pickup/delivery truck, shop CGL, WC, GKLL for customer units. Adding rental often means a **second specialty policy**, not a cheap endorsement.

---

## Calculator engine (use this structure)

```
Line premium = max(Minimum premium, Exposure × Base rate × Π factors) × (1 + surplus tax/fees)

Total = GL + Physical damage + HNOA + GKLL increment + Umbrella + WC increment + taxes/fees
```

**Default planning bases (specialty rental programs):**

| Line | Exposure unit | Planning base rate (inland, clean, 25+ drivers, off-road/path use) |
|------|---------------|---------------------------------------------------------------------|
| GL | Per cart / year @ $1M occ / $2M agg | **$90 – $220** / cart |
| GL (alt) | Per $1,000 rental receipts | **$12 – $35** / $1k |
| GL (alt) | Per rental day | **$0.80 – $2.50** / day |
| Physical damage (combined OTC + collision) | % of ACV / year | **5% – 9%** inland; **8% – 14%** coastal wind |
| HNOA | Flat (incidental) or per driver | **$150 – $750** incidental; **$400 – $1,200** / delivery driver |
| GKLL | Per $1,000 of limit | **$2 – $8** / $1k (comp + collision, $1k ded) |
| Umbrella | Per $1M | **$900 – $2,500** clean; **$1,800 – $4,500** rental class |
| WC | Payroll / $100 | Class rate × e-mod (see WC section) |

**Louisiana surplus-lines load (if non-admitted):** surplus lines tax **4.85%** + stamping/filing fees (budget **~5.1–5.5%** on surplus premium). Admitted policies: no surplus tax; standard premium tax is usually inside the carrier rate.

**Minimum premiums (small fleet):** GL **$1,500–$5,000**; package **$3,500–$8,500**; coastal rental packages often **$7,500+**.

**Placeability gate (apply before math):** if any *decline* trigger is true, output `UNPLACEABLE / SURPLUS-ONLY — get a broker`, do not spit a fake low number.

---

## Universal account factors (hit every line)

These are the first fields in a calculator. They modify **all** lines unless noted.

| # | Factor (exact name) | How measured | Typical multiplier | Higher value does what | Common data sources |
|---|---------------------|--------------|--------------------|------------------------|---------------------|
| U1 | **Years in business (this legal entity)** | Full years; <2 = new venture | 0–1 yr: **1.25–1.75** or surplus; 2–4: **1.10–1.25**; 5+: **1.00**; 10+ clean: **0.90–0.95** | More years **lowers** premium (if clean) | SOS filings, ACORD 125, D&B |
| U2 | **Years in *rental* operations** | Years renting to public (shop years do **not** fully count) | New rental class: **1.15–1.50**; 3+ clean rental yrs: **1.00** | More rental years **lowers** | Loss runs, prior dec pages |
| U3 | **Prior insurance / lapse** | Days uninsured in last 3–5 yrs | Continuous: **1.00**; lapse <30d: **1.10–1.25**; lapse >30d or first-time: **1.20–1.50** or surplus | Lapse **raises** | Prior dec pages, LexisNexis, agent of record |
| U4 | **Claims / loss history (5 years)** | # claims, incurred $, loss ratio, large-loss count | 0 claims: **0.85–1.00**; 1 small: **1.00–1.15**; LR >60%: **1.25–1.75**; 1 large BI: **1.50–2.50** or **decline** | More/worse claims **raise** | Company loss runs, A-PLUS, C.L.U.E. Commercial, ISO ClaimSearch |
| U5 | **Experience mod / schedule rating (IRPM)** | Underwriter schedule of credits/debits (admitted) | Schedule typically **0.75–1.25** (some states cap ±25–40%) | Credits **lower** | Carrier IRPM worksheet |
| U6 | **Financial condition / credit** | Business credit + (sometimes) owner FICO; bankruptcy; collections | Strong: **0.90–1.00**; thin/new: **1.05–1.20**; poor/BK: **1.25–1.75** or **decline** | Worse credit **raises** | Experian Intelliscore, D&B PAYDEX, Equifax, owner credit (where legal) |
| U7 | **Management / owner experience** | Years in golf-cart, RV, or equipment rental | Owner-operator 5+ yrs in carts: **0.90–0.95**; no industry exp: **1.15–1.35** | More relevant experience **lowers** | Application, resume, website, GBP |
| U8 | **Gross receipts / revenue** | Annual rental revenue (and total entity revenue) | Used as **exposure** (not just a factor). Sudden growth >50% YoY: **1.10–1.25** audit load | Higher revenue **raises** (more exposure) | QBO P&L, tax returns, ACORD |
| U9 | **Payroll / employee count** | W-2 heads, 1099s, owner inclusion | More people = more WC + HNOA + EPLI. 1099-as-employees: **refer** | More staff **raises** WC/HNOA | QBO payroll, 941s, Gusto |
| U10 | **Additional insured / contractual** | # of AI endorsements, waiver of subrogation, primary/non-contributory | Each heavy contract: **+$50–$150** or **1.02–1.08**; blanket AI: **1.05–1.15** | More contract requirements **raise** | HOA/resort contracts, COI requests |
| U11 | **Package / multi-line** | Same carrier writes 3+ lines | **0.85–0.95** package credit (if they will write rental at all) | More lines with one carrier **lowers** | Broker submission |
| U12 | **Deductible (per line)** | $250 / $500 / $1,000 / $2,500 / $5,000 / % wind | See line tables. Higher deductible **lowers** premium, raises retained loss | Higher ded **lowers** premium | Quote specs |
| U13 | **Limits** | Per-occurrence / aggregate / excess | See ILF table below. Higher limits **raise** | Higher limits **raise** | Broker / contract minimums |
| U14 | **Admitted vs surplus** | Market type | Surplus: rate may be *lower or higher*; always add **~5.1–5.5%** tax/fees; fewer consumer protections | Surplus is a **placement** outcome, not a discount | Broker / SLA |
| U15 | **Seasonality / months operated** | Months/year open | 12-mo: **1.00**; 6–8 mo: **0.70–0.85** (not linear — storm season still counts in LA) | Fewer months **lowers** some, not wind | Application |
| U16 | **Safety program / risk control** | Written program, training logs, telematics, GPS/geofence, alcohol ban, MVR policy | Strong documented: **0.75–0.90**; verbal only: **1.00**; none: **1.10–1.25** | Stronger program **lowers** | Manuals, photos, vendor (Samsara, Verizon Connect) |
| U17 | **Telematics / GPS / geofence** | % of fleet with GPS + speed/geofence alerts | 100% GPS + geofence: **0.85–0.95** PD and sometimes GL; none: **1.00–1.10** | More monitoring **lowers** | Device invoices, platform login |
| U18 | **Rental agreement quality** | Written contract, hold harmless, damage waiver, age/license rules, alcohol clause, insurance requirement of renter | Attorney-reviewed + signed every rental: **0.85–0.95**; verbal/none: **1.25–1.75** or **decline** | Better contracts **lower** | Sample agreement (redact names) |
| U19 | **Damage waiver / renter insurance** | Whether renter buys CDW or provides personal auto/home | Required renter coverage + you verify: **0.90–0.95**; you are sole coverage: **1.00–1.15** | Shifting risk **lowers** your rate | Waiver form, vendor (e.g. rental-insure products) |
| U20 | **Website / advertising risk** | Claims of “street legal,” “insurance included,” alcohol/event marketing | Aggressive on-road/party ads: **1.15–1.50** or **decline** | Riskier marketing **raises** | Website, GBP, social (underwriter will look) |

### Increased Limit Factors (ILF) — CGL / umbrella planning

Relative to **$1M occurrence / $2M aggregate** = **1.00**:

| Limit | Typical ILF |
|-------|-------------|
| $300k / $600k | 0.70–0.80 |
| $500k / $1M | 0.80–0.90 |
| **$1M / $2M** | **1.00** |
| $2M / $4M | 1.20–1.40 |
| $1M umbrella over $1M primary | see Umbrella section (not a simple ILF) |
| $2M–$5M umbrella | 1.7–3.0× the first $1M umbrella layer |

---

## 1) General liability

**ISO-ish class names you will see on apps:** *Equipment rented to others — mobile equipment*; *Recreational vehicle rental*; *Golfmobile / golf cart rental*; sometimes *Hotels/resorts* if you are a concession. Specialty programs often **ignore ISO class** and rate **per cart** or **per $1,000 receipts**.

| # | Factor | How measured | Typical weight / multiplier | Direction | Data sources |
|---|--------|--------------|-----------------------------|-----------|--------------|
| G1 | **Exposure base — fleet size** | # of rental units (owned + leased) at peak | Linear-ish; 1–5 carts: min prem dominates; 6–25: per-cart; 25+: volume credit **0.90–0.95** | More carts **raise** total, slightly **lower** per-cart | Fleet schedule |
| G2 | **Exposure base — rental volume** | Rental days / year **or** # of contracts | Days × per-day rate. High utilization (>180 days/cart): **1.10–1.25** on top of receipts | More days **raise** | Rental software, QBO |
| G3 | **Gross rental receipts** | $ / year (exclude sales tax) | $12–$35 per $1k (clean inland) × other factors | Higher receipts **raise** | P&L, tax return |
| G4 | **Territory — state** | State of operations | LA vs Midwest inland: **1.20–1.80** on GL (tort + weather + jury) | LA **raises** vs inland | ISO territory, carrier state pages |
| G5 | **Territory — county / parish** | Parish | St. Tammany vs rural north LA: **1.05–1.20**; vs Orleans/Jefferson core: St. Tammany often **slightly better** than NOLA | Worse parish **raises** | ISO, carrier territory codes |
| G6 | **Territory — ZIP** | 5-digit (and sometimes 9) | 70433 is suburban Northshore — usually **better than 701xx**, still **coastal-influenced** | Hot ZIPs **raise** | ISO Location, Verisk, carrier ZIP tables |
| G7 | **Use class — operating environment** | Categories: golf-course only; gated community paths; public roads / LSV; beach/boardwalk; hunting/off-road; special events | Course/gated: **0.75–1.00**; mixed community: **1.00–1.25**; public roads/LSV: **1.25–2.00**; beach/resort party: **1.75–3.00**; events: **2.00–4.00** or **decline** | More public/road/party **raises** | Application, photos, ordinances |
| G8 | **Street-legal / LSV status** | % of fleet that is FMVSS 500 LSV or titled for road | 0% (private property): **0.85–1.00**; mixed: **1.15–1.40**; 100% on-road: **1.40–2.00** + possible **auto** form instead of CGL | More road use **raises** | Titles, VIN, NHTSA LSV specs |
| G9 | **Radius of operation** | Miles from lot (and parishes entered) | <5 mi campus: **0.90–1.00**; <25 mi: **1.00–1.15**; multi-parish / Southshore: **1.20–1.60** | Wider radius **raises** | Rental rules, GPS geofence |
| G10 | **Driver age minimum** | Youngest allowed renter | 25+: **0.85–1.00**; 21–24: **1.15–1.45**; 18–20: **1.50–2.50** or **decline**; 16–17: usually **decline** | Younger min age **raises** | Rental agreement |
| G11 | **Driver screening** | License check, MVR, age verify, credit card, selfie/ID scan | License + age + card every time: **0.90–1.00**; MVR on file for frequent renters: **0.85–0.95**; no ID check: **1.50+** or **decline** | Stricter screening **lowers** | MVR vendors (LexisNexis, SambaSafety, DMV) |
| G12 | **Alcohol / impairment policy** | Written ban + enforcement + no coolers / no bar delivery | Strict ban + staff trained: **0.90–1.00**; “don’t ask”: **1.35–2.00**; party/bachelor/bar crawls: **2.00–4.00** or **decline** | Alcohol use **raises** sharply | Agreement, ads, incident logs |
| G13 | **Passenger / occupancy** | Max seats; lifted 6- and 8-seat; trailers | 2–4 seat: **1.00**; 6-seat: **1.10–1.25**; 8+ or stretch: **1.25–1.60**; people-hauling events: **refer** | More seats **raise** | Fleet schedule |
| G14 | **Speed capability** | Governor setting; stock vs lifted/performance | ≤15 mph: **0.85–1.00**; 15–20: **1.00–1.15**; 20–25 LSV: **1.20–1.50**; de-governed / 25+ off-spec: **1.50–2.50** or **decline** | Faster **raises** | Spec sheets, tech inspection |
| G15 | **Night / 24-hour rental** | Overnight allowed? | Daylight only: **0.90–1.00**; overnight: **1.10–1.30**; 24/7 unmanned: **1.25–1.60** | Overnight **raises** | Hours policy |
| G16 | **Unattended / key drop / lockbox** | Staffed checkout vs honor system | Staffed: **1.00**; lockbox/app unlock: **1.15–1.40** | Less control **raises** | Ops description |
| G17 | **Delivery / pickup of rental carts** | You deliver to customer or HOA | No delivery: **1.00**; staffed delivery: **1.10–1.25** + HNOA/auto; roadside drop on public street: **1.25–1.50** | Delivery **raises** | Ops, Roy’s truck exposure |
| G18 | **Sub-rental / third-party operators** | HOA or resort re-rents your carts | None: **1.00**; allowed: **1.25–1.75** + AI | Sub-rental **raises** | Contracts |
| G19 | **Products / completed ops** | You also convert/repair (NGC does) | Dual shop+rental: **1.10–1.30** on GL or **two policies**; lithium work: **refer** for products | Combining ops **raises** | ACORD 126, lithium SOP |
| G20 | **Abuse / molestation / event** | Kids’ camps, weddings, festivals | Standard rental: n/a; youth/event: separate **+$500–$2,000** or exclusion | Events **raise** | Event applications |
| G21 | **Liquor liability** | You sell/serve alcohol (usually you don’t) | If yes: separate liquor policy; rental + BYOB still hits G12 | Serving alcohol **raises / separate line** | TTB/parish permit |
| G22 | **Medical payments / legal** | Med-pay limit $1k–$10k | Small add-on **+$50–$200**; not a big lever | Higher med-pay **raises** slightly | Quote |
| G23 | **GL deductible / SIR** | $0 / $1,000 / $2,500 / $5,000 / $10,000 | $0: 1.00; $2,500: **0.90–0.95**; $5,000: **0.80–0.90**; $10k SIR: **0.70–0.85** (if allowed) | Higher ded **lowers** | Quote |
| G24 | **Assault / punitive / expected injury** | Exclusions | Standard; “party cart” risks may get **absolute alcohol exclusion** (price looks cheap, coverage is hollow) | Exclusions **lower** premium, **raise** retained risk | Form review |

**GL calculator default for NGC-style Northshore rental (planning):**

```
GL = max(2500, carts × 150 × terr_LA(1.40) × use × age_min × screening × alcohol × claims × new_venture × safety)
```

Example: 12 carts × $150 × 1.40 × 1.20 (community + some roads) × 1.00 (age 25+) × 0.90 (ID+MVR rules) × 1.00 (alcohol ban) × 1.20 (new rental class) × 0.90 (GPS+agreement) ≈ **$2,940** → bind to **min $2,500–$3,500**, planning **$3,500–$6,500** with taxes if surplus.

---

## 2) Physical damage / collision / comprehensive (your carts)

Usually **inland marine** or specialty RV/LSV PD — not personal auto. Rated on **ACV** or **stated amount**. Flood and named-storm are the traps in St. Tammany.

| # | Factor | How measured | Typical weight | Direction | Data sources |
|---|--------|--------------|----------------|-----------|--------------|
| P1 | **Average cart value / TIV** | ACV per unit; total insured value | Rate × ACV. Combined OTC+coll planning: inland **5–9%**; LA coastal **8–14%** of ACV | Higher value **raises** $; rate % may fall slightly above ~$12k/unit | Purchase invoices, NADA/guide, lithium invoices |
| P2 | **Fleet size** | Unit count | 1–5: **1.05–1.15**; 6–20: **1.00**; 25+: **0.90–0.95** | Larger fleet slight **credit** | Schedule |
| P3 | **Age of unit** | Model year / years since conversion | 0–3 yrs: **0.90–1.00**; 4–8: **1.00–1.10**; 9+: **1.10–1.30** or ACV cap | Older **raises** rate or **lowers** payout | VIN decode, titles |
| P4 | **Powertrain** | Gas vs lead-acid vs lithium (LiFePO4) | Gas: **1.00–1.10** (fire/fuel); lead-acid: **1.00**; lithium: **1.10–1.30** (thermal/fire) or **refer**; some forms **exclude** lithium fire | Lithium **raises** or restricts | Battery spec, NGC conversion records |
| P5 | **Customization / lift / aftermarket** | Lifted, stereo, custom body, $ of extras | Stock: **1.00**; lifted/custom: **1.15–1.40**; stated-amount required above ~$15k | More custom **raises** | Photos, build sheets |
| P6 | **Collision vs OTC split** | Two rates or combined | Collision **3–7%** ACV; OTC **2–6%** inland; OTC wind/hail/theft **4–10%** coastal | Buying both **raises** | Quote structure |
| P7 | **Comprehensive / OTC perils** | Named-peril vs special form | Special form costs more; cheap policies **exclude flood, named storm, mysterious disappearance** | Broader form **raises** | Form (read it) |
| P8 | **Wind / hail / named storm** | County wind tier; % deductible | St. Tammany is **hurricane-exposed**. Wind factor **1.25–2.00** on OTC vs inland. Deductible often **2–5% of TIV** (not $500) | Worse wind zone **raises**; % ded **lowers** prem, **raises** retention | Verisk, CoreLogic, RiskMeter, HazardHub, NOAA, carrier coastal guidelines |
| P9 | **Flood / storm surge** | FEMA NFHL zone (A, AE, VE, X); BFE; prior flood | Zone X: **1.00** (flood still often **excluded**); AE/A: **1.15–1.40** + **separate flood**; VE: **1.50+** or **decline** for lot | Worse flood zone **raises** / **excludes** | FEMA Map Service Center, parish GIS, CoreLogic Flood |
| P10 | **Theft / crime** | ZIP crime score; lot security | High-theft ZIP: **1.15–1.50** OTC; fenced+lit+camera+locked: **0.80–0.95** | Worse crime **raises**; better security **lowers** | CAP Index, CrimeGrade/carrier crime, PD reports, photos |
| P11 | **Storage / lot protection** | Categories: building, fenced lighted, open lot, street, customer site | Inside building: **0.75–0.90**; fenced+camera: **0.85–1.00**; open lot: **1.10–1.30**; at renter’s house overnight: **1.20–1.50** | Worse storage **raises** | Photos, alarm cert, lease |
| P12 | **Utilization** | Rental days per cart per year | <60: **0.85–1.00**; 60–150: **1.00**; 150–250: **1.10–1.25**; 250+: **1.25–1.45** | More use **raises** collision | Rental software |
| P13 | **Operator quality** (same as G10–G12) | Age min, screening, alcohol | Apply **0.85–1.50** to collision side | Riskier operators **raise** collision | Agreement |
| P14 | **Deductible (all other perils)** | $500 / $1,000 / $2,500 / $5,000 | $500: **1.00–1.10**; $1,000: **1.00**; $2,500: **0.80–0.90**; $5,000: **0.70–0.82** | Higher ded **lowers** | Quote |
| P15 | **Named-storm deductible** | 1% / 2% / 3% / 5% of TIV or per unit | 1%: **1.10–1.20**; 2%: **1.00**; 5%: **0.80–0.90** | Higher % **lowers** prem | Coastal form |
| P16 | **Valuation** | ACV vs replacement cost vs stated amount | ACV: **1.00**; RC (rare on used carts): **1.15–1.35**; stated: **1.00–1.10** + appraisal | RC **raises** | Appraisal |
| P17 | **Transit / delivery PD** | Carts on trailer or rollback | On-lot only: **1.00**; frequent haul: **1.10–1.25** + cargo/trailer | More transit **raises** | Ops, truck policy |
| P18 | **Maintenance program** | Hours/miles logs, brake/tire/steering checks, documented PM | Written PM + logs: **0.85–0.95**; none: **1.10–1.25** | Better PM **lowers** | Shop records (NGC advantage) |
| P19 | **Prior PD losses** | Theft rings, flood, hail, rollovers | 1 theft: **1.20–1.50**; flood unrepaired lot: **refer**; pattern: **decline** | More PD losses **raise** | Loss runs |
| P20 | **Coinsurance / insurance-to-value** | % of TIV scheduled | Underinsured: penalty at claim **and** underwriter debit **1.10–1.25** | Underinsuring **hurts** | Schedule vs invoices |

**PD calculator default (Covington lot):**

```
PD = TIV × 0.10 × storage × security × utilization × deductible × lithium × maintenance
```

Example: 12 × $9,000 = $108,000 TIV × 10% × 0.90 (fenced cameras) × 1.10 (moderate use) × 0.90 ($1k ded) × 1.15 (mostly lithium) × 0.90 (NGC PM) ≈ **$10,000**. Planning band **$8,500–$15,000** plus a **2–5% named-storm deductible** (that is a *retention*, not a rate).

**Flood:** assume **excluded** on the rental floater unless you buy NFIP/private flood on the building/contents and a separate flood endorsement on the fleet (often unavailable or very expensive on open-lot carts). Budget flood as **retained risk** or a separate quote.

---

## 3) Hired and non-owned auto (HNOA)

This is **not** coverage on the golf carts. It is BI/PD from an **automobile** (car/truck) hired or borrowed, or an employee’s personal auto used for work (bank, parts run, meeting).

If NGC **delivers rental carts on a company truck**, that truck needs **owned auto** (primary), not HNOA.

| # | Factor | How measured | Typical weight | Direction | Data sources |
|---|--------|--------------|----------------|-----------|--------------|
| H1 | **Number of employees who drive** | Headcount that may use personal auto | 0–2 incidental: flat **$150–$400**; 3–10: **$75–$200** / driver | More drivers **raise** | Org chart, Gusto |
| H2 | **Cost of hire** | $ spent on rented/borrowed autos / year | ISO-style: rate per $100 cost-of-hire (planning **$1.50–$4.00** / $100) | Higher hire spend **raises** | QBO auto/rental |
| H3 | **Radius** | Local vs statewide | Local: **1.00**; statewide: **1.15–1.35** | Wider **raises** | Application |
| H4 | **Delivery of carts as a service** | Yes/no; frequency | Incidental: **1.00**; regular delivery: move to **owned auto**; if forced on HNOA: **1.50–2.50** or **decline** | Delivery **raises** | Ops |
| H5 | **MVR / driver list** | Named drivers, violations, DUI | Clean: **1.00**; minor: **1.10–1.25**; DUI/major: **exclude driver** or **1.50+** | Worse MVRs **raise** | MVR, SambaSafety |
| H6 | **Personal auto limits required** | Employee must carry $100k/$300k or $1M | Required + certificates: **0.90–1.00**; none: **1.15–1.30** | Requiring personal limits **lowers** | Handbook |
| H7 | **HNOA limit** | $1M typical | ILF similar to auto liability | Higher **raises** | Quote |
| H8 | **State auto environment** | LA liability / UM | LA **1.15–1.40** vs a quiet Midwest state | LA **raises** | ISO auto territory |

**NGC planning:** keep **owned auto** on Roy’s truck; add HNOA **$250–$600** for incidental employee errands. Do **not** try to insure cart delivery on HNOA.

---

## 4) Garagekeepers / bailee (customer carts)

GKLL covers **property of others** in your care — the repair-shop exposure NGC **already has**. Your **owned rental fleet** is *not* a GKLL exposure; it belongs on the PD floater.

| # | Factor | How measured | Typical weight | Direction | Data sources |
|---|--------|--------------|----------------|-----------|--------------|
| K1 | **Limit** | $25k / $50k / $100k / $250k / $500k | Planning **$2–$8** per $1,000 limit (comp+coll) | Higher limit **raises** | Peak # customer carts × avg ACV |
| K2 | **# of customer units at peak** | Count on lot / in bays | Used to set limit (e.g. 8 carts × $8k = $64k → buy $100k) | More units **raise** needed limit | Shop board |
| K3 | **Coverage type** | Legal liability vs direct primary | Legal liability: **1.00**; direct primary: **1.15–1.35** | Broader **raises** | Form |
| K4 | **Perils** | Comprehensive only vs comp+collision | Comp only: **0.70–0.85**; both: **1.00** | Adding collision **raises** | Quote |
| K5 | **Lot protection** | Same categories as P11 | Building: **0.75–0.90**; fenced+camera: **0.85–1.00**; open: **1.15–1.40** | Worse lot **raises** | Photos |
| K6 | **Location / ZIP / flood / crime** | Same as P8–P10 | Coastal wind/crime apply to *customers’* units too | Worse location **raises** | FEMA, crime scores |
| K7 | **Deductible** | Per cart or per occurrence | $500: 1.05; $1,000: 1.00; $2,500: 0.85 | Higher **lowers** | Quote |
| K8 | **Valet / test drive / road test** | Techs drive customer carts on road | On-site only: **1.00**; public-road test: **1.10–1.25** | Road test **raises** | SOP |
| K9 | **Rental of *customer* units** (courtesy cart) | You lend a cart while theirs is in shop | Courtesy fleet should be on **your PD + GL**, not GKLL; if mixed: **1.15–1.30** | Courtesy **raises** | Policy |

**NGC planning:** size GKLL to peak WIP × average customer ACV (lithium jobs can be $8k–$15k+). Adding a rental fleet does **not** replace GKLL.

---

## 5) Umbrella / excess liability

| # | Factor | How measured | Typical weight | Direction | Data sources |
|---|--------|--------------|----------------|-----------|--------------|
| E1 | **Layer size** | $1M / $2M / $5M | First $1M: **$900–$4,500** depending on class; each next $1M: **0.55–0.80×** prior layer | More limit **raises** | Quote |
| E2 | **Attachment / underlying limits** | Must usually sit over $1M CGL and $1M auto | Underlying $1M: **1.00**; underlying $500k: **1.25–1.75** or **won’t attach** | Weaker underlying **raises** or blocks | Dec pages |
| E3 | **Underlying quality** | Admitted A-rated vs surplus / new venture | A/X+ admitted: **1.00**; surplus underlying: **1.25–2.00** or **decline** umbrella | Weaker underlying **raises** | AM Best, dec pages |
| E4 | **Class / use** (G7–G12 again) | Road + alcohol + events | Clean gated: **1.00**; public LSV rental: **1.50–2.50**; party/beach: **2.50–5.00** or **decline** | Riskier use **raises** | Same as GL |
| E5 | **Auto inclusion** | Umbrella over owned auto + HNOA | Auto included: **1.15–1.40** vs GL-only excess | Including auto **raises** | Schedule of underlying |
| E6 | **Employer’s liability** | Follows WC | Included often; high EL claims: debit | Worse WC **raises** | WC loss runs |
| E7 | **Claims / severity** | Any prior BI suit | One BI suit: **1.50–3.00** or **decline** | Suits **raise** | Loss runs, PACER |
| E8 | **Contracts requiring $2M–$5M** | HOA / parish / venue | Forces higher layer; may be the whole reason you buy it | Contract min **raises** spend | Contracts |

**NGC planning:** if you rent, budget **$2,000–$4,000** for $1M umbrella over a $1M rental GL, *if* a market will offer it. Many surplus rental programs have **no umbrella** — you buy excess separately or stop at $1M.

---

## 6) Workers’ compensation (employees involved)

Louisiana is a **competitive** WC market (not monopolistic). LWCC is a frequent market; private carriers also write. Rating is **NCCI-style**: `payroll/100 × class rate × experience mod × schedule × LCM`.

Class codes are **assigned by the carrier/NCCI**, not by you. Split payroll correctly or you will get audited.

| Likely class (confirm) | Who | Planning rate per $100 payroll (LA ballpark) |
|------------------------|-----|-----------------------------------------------|
| **8810** Clerical | Jesse / office | **$0.15 – $0.45** |
| **8742** Sales | Outside sales (if any) | **$0.30 – $0.70** |
| **8380** Auto / vehicle repair | Techs (current shop) | **$3.00 – $6.50** |
| **8380 / 8391** mix | Shop + storage | Similar to 8380 |
| **7380** Drivers / chauffeurs | Roy / delivery | **$6.00 – $12.00** |
| **8017 / 8018** Store / rental counter | If a distinct rental desk | **$1.50 – $3.50** |
| **9102 / 9015** | Lot / building ops (sometimes) | **$3.00 – $7.00** |

**Do not use these rates as official LWCC filings** — they move every year. Pull the current LA loss cost + carrier LCM from the broker.

| # | Factor | How measured | Typical weight | Direction | Data sources |
|---|--------|--------------|----------------|-----------|--------------|
| W1 | **Class code mix** | Payroll split by duty | Wrongly dumping drivers into clerical is an **audit bomb** (back premium) | Higher-hazard class **raises** | Job descriptions, time logs |
| W2 | **Payroll** | Remuneration (includes OT rules, owner may elect) | Linear exposure | Higher payroll **raises** | Gusto, 941, QBO |
| W3 | **Experience modifier** | NCCI e-mod (if eligible) | 0.75: **−25%**; 1.00: base; 1.25: **+25%**; 1.50+: **refer** | Higher e-mod **raises** | NCCI, LWCC, loss runs |
| W4 | **Schedule / safety credit** | Drug-free, safety committee, PPE | **0.90–1.00** typical credits | Programs **lower** | Safety manual, drug-test vendor |
| W5 | **Loss history** | Frequency of strains, lifts, battery acid, road accidents | Frequency **raises** e-mod with a lag | More injuries **raise** | OSHA 300, loss runs |
| W6 | **Owner inclusion / exclusion** | LA officer election | Including officers **raises** premium, **adds** coverage | Including owners **raises** | Policy elections |
| W7 | **1099 / leased labor** | If “contractors” are employees | Misclass: audit + **1.00–1.50** debit | More misclass risk **raises** | 1099s, contracts |
| W8 | **Delivery / road exposure** | Techs or Roy on public roads | Moves $ to **7380** | More road work **raises** | Roles.md (Roy is driver) |
| W9 | **Lithium / battery handling** | Chemical, lift, thermal | Usually still 8380; poor practices → injuries → future e-mod | Worse safety **raises** later | SOP, OSHA |
| W10 | **Go-forward rental duties** | Counter staff, lot attendants, after-hours | New class split; small $ if existing staff absorb it | New rental labor **raises** | Org plan |

**NGC planning:** rental probably does **not** need a new WC policy — it **reclassifies a slice of payroll**. Budget a **10–25% WC increase** if someone is full-time on rental/delivery, or **~$500–$2,000** if existing staff absorb it. Confirm officer inclusion with Jill / the WC agent.

---

## 7) Inland marine and specialty forms

| Form / coverage | When used | Rating base | Typical planning cost | Factors that move price |
|-----------------|-----------|-------------|----------------------|-------------------------|
| **Rental equipment floater** | Owned carts off-premises in renter’s custody | TIV × rate (this *is* the PD line) | See §2 | Same as PD + off-premises load **1.10–1.30** |
| **Dealers open lot** | If you also **sell** carts (future) | Inventory TIV; reporting form | **1.5–4%** of inventory inland; **higher** coastal | Inventory swing, lot security, wind |
| **Motor truck cargo / transit** | Carts on trailer | Limit per load | **$400–$1,500** / yr small | Radius, theft, tiedown SOP, truck PD |
| **Tools & equipment** | Shop tools, diagnostics (current) | Scheduled TIV | **$1–$3** / $100 | Theft, location |
| **Installation floater** | Lithium installs at *customer site* — NGC is **shop-only**, so usually **N/A** | — | — | Do not add mobile installation |
| **Event liability** | Festivals, weddings, bachelor packages | Receipts or attendance × days | **$250–$1,500** / event or **2–4×** GL | Alcohol, crowd, road closures |
| **Liquor** | You serve | Sales | Separate | Usually **don’t** |
| **Cyber / privacy** | Online booking, cards, IDs | Revenue + records count | **$400–$1,500** small | PCI, MFA, ID photos of renters |
| **Crime / employee dishonesty** | Cash deposits, theft of carts | Limit | **$200–$600** | Controls, dual custody |
| **Equipment breakdown** | Chargers, shop compressors | TIV | **$150–$500** | Age of equipment |
| **Business interruption / extra expense** | Storm shuts rental | Indemnity period × values | **$300–$1,200** or % of property | Named-storm waiting period |
| **Flood (NFIP or private)** | Building/contents; rarely the fleet | Building TIV, zone | Zone-driven; AE can be **thousands** | FEMA zone, elevation cert |
| **Louisiana Citizens / residual wind** | When admitted property declines | Property TIV | Last-resort, **expensive** | Coastal guidelines |

---

## Location risk — ZIP, parish, flood, hurricane (calculator block)

**Fixed NGC inputs (unless you open a second lot):**

| Input | Value | Underwriting read |
|-------|-------|-------------------|
| Address | 71363 Thelma Ln, Suite E, Covington, LA 70433 | Tenant in a commercial suite (lessor’s risk is landlord’s) |
| Parish | St. Tammany | Hurricane / tropical storm, hail, tornado secondary; flood by lot elevation |
| Metro | Northshore / GNO | Jury/venue better than Orleans for many carriers, still **LA** |
| Pickup policy | Free 40 mi Northshore; $99 Southshore / >40 mi | If rentals follow the same radius, **Southshore and multi-parish** widen auto + GL |

| # | Factor | How measured | Typical multiplier (vs inland US base 1.00) | Direction | Data sources |
|---|--------|--------------|---------------------------------------------|-----------|--------------|
| L1 | **State** | LA | GL **1.20–1.80**; auto **1.15–1.40**; WC (own table) | LA **raises** vs many states | ISO, NCCI, carrier |
| L2 | **Parish / county** | St. Tammany | Wind **1.25–2.00** on property/OTC; GL **1.05–1.20** vs north LA | Coastal parish **raises** | Carrier coastal list |
| L3 | **ZIP territory** | 70433 | Usually **better than 70112–70130**; still not “Midwest inland” | Worse ZIP **raises** | ISO ZIP, Verisk |
| L4 | **Hurricane / wind tier** | Carrier tier 1–4 or “tiered county” | Comp/OTC **1.25–2.00**; property **1.50–3.00**; some **won’t write** | Higher tier **raises** or **declines** | Verisk, RMS/AIR models (via carrier), NOAA |
| L5 | **Distance to coast / lake** | Miles to Gulf / Lake Pontchartrain | Closer = worse wind/surge | Closer **raises** | GIS, HazardHub |
| L6 | **FEMA flood zone** | A / AE / VE / X / shaded X | X: flood still **excluded** on most floaters; AE/VE: **debit + separate flood** or **decline** open-lot fleet | Worse zone **raises** | FEMA MSC, parish GIS, elevation certificate |
| L7 | **Storm surge / SLOSH** | Surge category | Material for lot storage | Higher surge **raises** | NOAA SLOSH, CoreLogic |
| L8 | **Hail** | Hail score / frequency | LA moderate: **1.00–1.15** OTC | Worse hail **raises** | Verisk hail, NOAA Storm Events |
| L9 | **Tornado / convectives** | Score | Modest in this parish: **1.00–1.10** | Higher **raises** | SPC, Verisk |
| L10 | **Crime / theft** | CAP Index or carrier crime | Suburban industrial: often **0.90–1.10** vs NOLA core **1.20–1.60** | Higher crime **raises** OTC | CAP Index, local PD |
| L11 | **Brush / wildfire** | WUI score | Usually **minor** here: **1.00–1.05** | Higher **raises** | Verisk FireLine |
| L12 | **Sinkhole / soil** (rare) | Geological | Usually **1.00** | — | USGS |
| L13 | **Protection class (ISO PPC)** | 1–10 fire protection | Better hydrant/FD: **0.85–1.00** on property (weak on cart floater) | Worse PPC **raises** property | ISO PPC, fire dept |
| L14 | **Building construction / sprinklers** | ISO construction, alarms | Matters for **tenant property + carts stored inside** | Better construction **lowers** | COPE worksheet, landlord |
| L15 | **Secondary locations** | Extra lots, HOA corrals, Southshore staging | Each loc gets its own territory; unscheduled loc = **claim fight** | More locs **raise** | Schedule of locations |

**Calculator defaults for 70433 (planning):** `terr_gl = 1.40` · `terr_pd_wind = 1.35` · `flood_form = excluded` · `named_storm_deductible = 2% of TIV`.

---

## Fleet, volume, drivers, safety — the levers that actually move price

Ranked by **how much they change a bindable number** for this class:

| Rank | Lever | Why it matters | If you do this, premium… |
|------|-------|----------------|--------------------------|
| 1 | **Allow under-21 or no license check** | Highest BI frequency | **+50% to unplaceable** |
| 2 | **Alcohol / party / beach / festival use** | Severity | **+75% to decline** |
| 3 | **Public-road / LSV / no geofence** | Auto-like liability | **+25–100%** |
| 4 | **Coastal wind + open-lot storage** | PD and CAT | **+25–80%** on PD; % storm deductible |
| 5 | **Claims (especially BI)** | Experience + judgment | **+15% to decline** |
| 6 | **New rental class / no loss runs** | Unknown frequency | **+15–50%** or surplus only |
| 7 | **Fleet TIV (count × ACV)** | PD is often *the* biggest $ line | Roughly **linear** in TIV |
| 8 | **Utilization / receipts** | More days = more crashes | **+10–45%** at high use |
| 9 | **Lithium + charging on lot** | Fire (emerging) | **+10–30%** PD or exclusion |
| 10 | **Written agreement + GPS + 25+ age + MVR** | Controllable credits | **−10–25%** if documented |
| 11 | **Shop+rental on one admitted policy** | Class contamination | Often **not offered**; two policies cost more *admin* but may be the only way |
| 12 | **Umbrella requirement in HOA contracts** | Extra layer | **+$2k–$8k** or cannot bid the HOA |

---

## Quote calculator — input sheet (build this first)

Use these fields. Types: `number`, `category`, `yes/no`.

### Account
- Legal name, FEIN, years in entity, years in rental, current GL/auto/WC carriers, lapse days
- Total revenue, **rental revenue**, payroll by role
- 5-year loss runs (or “none — new class”)
- Broker / incumbent

### Location
- Lot address, ZIP, parish, FEMA zone, inside building? fenced? cameras? alarm?
- Other locations / HOA corrals
- Max radius (mi), Southshore? (yes/no)

### Fleet
- Unit count (peak), make/model/year, VIN, gas/lead-acid/lithium, seats, governed mph, ACV, stated amount
- TIV, % customized/lifted, % LSV/street-titled
- Storage overnight: building / fenced lot / renter keeps it

### Volume
- Rental days / year, peak-season months, average rental length
- Annual rental receipts
- Delivery of carts? (count/week)

### Drivers / renters
- Min age, max age, license required, MVR vendor, card required
- Alcohol policy (ban / tolerate / promote)
- Night rentals, unattended checkout
- Employee drivers list + MVRs (for auto/HNOA)

### Contracts / risk control
- Sample rental agreement (yes/no), damage waiver, renter-provided insurance
- GPS/geofence % of fleet
- PM checklist frequency (NGC 7-point is a plus)
- Additional insureds required (list *types*, not customer names)
- Requested limits / deductibles / umbrella

### Employees
- Headcount, payroll by class, officer inclusion, delivery driver hours

---

## Worked planning example (not a quote)

**Hypothetical future NGC rental** — 12 carts, $9,000 ACV, $108k TIV, ~$150k rental receipts, 1,200 rental days, 25+ licensed drivers, written agreement, GPS, alcohol ban, community + limited road, fenced camera lot in 70433, new rental class, existing shop experience, lithium-heavy fleet, $1M/$2M GL, $1,000 PD ded, 2% named-storm ded, $1M HNOA incidental, $100k GKLL already exists, $1M umbrella *if available*.

| Line | Planning low | Planning mid | Planning high | Notes |
|------|-------------:|-------------:|-------------:|-------|
| GL | $3,500 | $5,500 | $9,000 | Surplus likely; min prem |
| Physical damage | $8,500 | $11,000 | $16,000 | Wind + lithium |
| HNOA | $250 | $400 | $750 | Incidental only |
| GKLL increment | $0 | $250 | $800 | If limit must rise for more WIP |
| Umbrella $1M | $0 | $2,500 | $4,500 | $0 = not offered |
| WC increment | $400 | $1,000 | $2,500 | If rental labor is real |
| Surplus tax/fees (~5.3% on surplus lines) | $650 | $1,000 | $1,600 | On non-admitted portion |
| **Total planning** | **~$13k** | **~$22k** | **~$35k** | Mid is the budget number |

If you allow **21-year-olds**, **overnight party rentals**, or **Southshore beach/event** use, jump to the **high** column or **unplaceable**.

---

## Third-party reports carriers actually pull

| Report | What it tells them | Who provides it |
|--------|--------------------|-----------------|
| **ACORD 125/126/127/131/137/160** | Application facts | You / broker |
| **5-year currently-valued loss runs** | Frequency, severity, reserves | Incumbent carriers |
| **A-PLUS / ISO ClaimSearch / C.L.U.E. Commercial** | Prior claims, undisclosed losses | LexisNexis, ISO |
| **MVR** | Employee (and sometimes frequent renter) driving record | State DMV, SambaSafety, LexisNexis |
| **Business credit** | Failure / moral hazard | Experian, D&B, Equifax |
| **Secretary of State / FEIN** | Entity age, status, owners | LA SOS, IRS |
| **ISO Location / PPC / territory** | Fire, GL, auto territory | Verisk / ISO |
| **HazardHub / CoreLogic / RiskMeter** | Flood, crime, hail, wind, brush, distance to coast | Those vendors |
| **FEMA NFHL + elevation cert** | Flood zone, BFE | FEMA, surveyor |
| **Aerial / Street View / site photos** | Lot security, storage, neighborhood | Google, broker inspection |
| **NCCI / LWCC experience rating** | WC e-mod | NCCI, LWCC |
| **AM Best on underlying** | Umbrella eligibility | AM Best |
| **VIN / NADA / build invoices** | ACV, LSV, theft | NICB, NADA, your invoices |
| **OSHA 300 / citations** | Injury culture | OSHA |
| **Website / social / GBP** | Use class vs what you claimed | Underwriter manual search |
| **Contracts / COI requirements** | AI, waiver, limit minimums | HOA/venue (redact customer PII in the brain) |
| **Telematics export** | Speed, geofence breaches | Samsara, Verizon, etc. |

**Never put customer PII, bank account numbers, or passwords in this repo.** Loss runs and MVRs stay with the broker.

---

## Placement notes (who even writes this)

| Market type | Examples of *where brokers look* (not endorsements) | Typical appetite |
|-------------|-----------------------------------------------------|------------------|
| Admitted package (shop) | Hartford, Travelers, CNA, Cincinnati, Nationwide, Progressive Commercial | Shop + GKLL + auto — **often exclude public rental** |
| Specialty / MGAs | Markel, K&K, Sadler, USLI, Scottsdale, Philadelphia, Distinguised, Hiscox, RV/LSV programs | **Primary markets** for rental |
| Surplus | Various via LA surplus broker | When admitted says no |
| WC | LWCC + private | Continues regardless |
| Flood | NFIP / private | Building; fleet often uncovered |

**Broker RFP ask:** “Golf cart *rental to the public*, St. Tammany Parish, schedule of units, sample agreement, geofence rules, alcohol ban, 25+ age, shop+rental split, $1M/$2M, PD ACV, named-storm deductible options, umbrella if available.” Get **admitted and surplus** numbers.

---

## NGC policy conflicts to watch

- **Do not** describe NGC as offering rentals in customer-facing quotes today.
- **Do not** put rental on the shop CGL and assume you are covered — many shop forms have a **rental exclusion** or “mobile equipment rented to others” limitation.
- Pickup/delivery of *customer* carts for repair is **auto + GKLL**, not rental GL.
- Lithium conversions are a **products** story on the shop policy; on a rental fleet they are a **PD fire** story. Keep them separate in the submission.
- Decision log still says **no rentals until the shop is solid**. This file is pre-work, not a launch.

---

## Sources / confidence

- ISO CGL / commercial auto / inland marine *structure* (class, territory, ILF, COPE) — high confidence
- NCCI-style WC math — high confidence; **LA dollar rates change** — confirm annually
- Specialty golf-cart / LSV / RV **rental program** per-cart and % of ACV ranges — medium-high (from how those programs are commonly built, not a scraped rate manual)
- Exact carrier IRPM weights — **unknowable**; that is why ranges are wide
- FEMA / coastal wind treatment for St. Tammany — high confidence on *direction*, not on a specific carrier tier

Refresh this file when you have **real quotes** (bind the mid column to reality, keep PII out).
