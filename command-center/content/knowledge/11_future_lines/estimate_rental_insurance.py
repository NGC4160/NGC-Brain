#!/usr/bin/env python3
"""NGC planning estimator — golf cart RENTAL insurance.

Not a bindable quote. Specialty-program ranges for a Covington, LA (70433)
rental fleet that does not exist yet. Validate with a licensed surplus/specialty
broker before budgeting a launch.

Usage:
  python3 knowledge/11_future_lines/estimate_rental_insurance.py
  python3 knowledge/11_future_lines/estimate_rental_insurance.py --carts 12 --acv 9000
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass


DECLINE = "UNPLACEABLE / SURPLUS-ONLY — get a broker; do not trust the math"


@dataclass
class Inputs:
    carts: int = 12
    acv: float = 9000.0
    rental_receipts: float = 150_000.0
    rental_days: int = 1200
    min_age: int = 25
    alcohol: str = "ban"  # ban | dont_ask | party
    use: str = "community"  # course | gated | community | public_road | beach_event
    screening: str = "license_card_mvr"
    gps: bool = True
    written_agreement: bool = True
    lithium_share: float = 0.80
    storage: str = "fenced_camera"  # building | fenced_camera | open | renter_site
    named_storm_ded_pct: float = 0.02
    pd_deductible: int = 1000
    gl_limit_ilf: float = 1.00  # vs $1M / $2M
    new_rental_class: bool = True
    shop_experience_years: int = 5
    deliver_carts: bool = True
    southshore: bool = False
    umbrella_wanted: bool = True
    gkll_limit: int = 100_000
    gkll_already_on_shop: bool = True
    wc_rental_payroll: float = 25_000.0
    surplus: bool = True


def _clamp_placeability(inp: Inputs) -> list[str]:
    flags: list[str] = []
    if inp.min_age < 18:
        flags.append(DECLINE + " (under-18 renters)")
    if inp.alcohol == "party":
        flags.append(DECLINE + " (party / promoted alcohol use)")
    if inp.use == "beach_event" and inp.alcohol != "ban":
        flags.append(DECLINE + " (beach/event + alcohol)")
    if not inp.written_agreement:
        flags.append("REFER: no written rental agreement — many markets decline")
    if inp.screening == "none":
        flags.append(DECLINE + " (no driver screening)")
    return flags


def _age_mult(min_age: int) -> float:
    if min_age >= 25:
        return 0.95
    if min_age >= 21:
        return 1.30
    if min_age >= 18:
        return 1.90
    return 2.50


def _alcohol_mult(alcohol: str) -> float:
    return {"ban": 0.95, "dont_ask": 1.60, "party": 3.00}.get(alcohol, 1.60)


def _use_mult(use: str) -> float:
    return {
        "course": 0.85,
        "gated": 0.95,
        "community": 1.20,
        "public_road": 1.55,
        "beach_event": 2.40,
    }.get(use, 1.20)


def _screening_mult(screening: str) -> float:
    return {
        "none": 1.50,
        "license_only": 1.10,
        "license_card": 1.00,
        "license_card_mvr": 0.90,
    }.get(screening, 1.00)


def _storage_mult(storage: str) -> float:
    return {
        "building": 0.80,
        "fenced_camera": 0.90,
        "open": 1.20,
        "renter_site": 1.35,
    }.get(storage, 1.00)


def _pd_ded_mult(ded: int) -> float:
    if ded >= 5000:
        return 0.75
    if ded >= 2500:
        return 0.85
    if ded >= 1000:
        return 0.90
    return 1.05


def estimate(inp: Inputs) -> dict:
    flags = _clamp_placeability(inp)
    tiv = inp.carts * inp.acv
    days_per_cart = (inp.rental_days / inp.carts) if inp.carts else 0
    util = 0.90 if days_per_cart < 60 else 1.00 if days_per_cart < 150 else 1.15 if days_per_cart < 250 else 1.35

    terr_gl = 1.40
    if inp.southshore:
        terr_gl *= 1.15
    new_venture = 1.20 if inp.new_rental_class else 1.00
    owner_exp = 0.95 if inp.shop_experience_years >= 5 else 1.15
    safety = 0.90 if (inp.gps and inp.written_agreement) else 1.05
    delivery = 1.10 if inp.deliver_carts else 1.00
    combo = 1.15  # shop + rental same entity
    lithium = 1.00 + 0.15 * inp.lithium_share
    wind = 1.35
    storm_ded = 1.00 if inp.named_storm_ded_pct >= 0.02 else 1.10

    gl_per_cart = 150.0
    gl = (
        inp.carts
        * gl_per_cart
        * terr_gl
        * _use_mult(inp.use)
        * _age_mult(inp.min_age)
        * _screening_mult(inp.screening)
        * _alcohol_mult(inp.alcohol)
        * new_venture
        * owner_exp
        * safety
        * delivery
        * combo
        * inp.gl_limit_ilf
    )
    gl = max(2500.0, gl)

    # Receipts method — take the higher of per-cart vs receipts (specialty often does).
    gl_receipts = (inp.rental_receipts / 1000.0) * 22.0 * (terr_gl / 1.40) * _use_mult(inp.use) * new_venture
    gl = max(gl, gl_receipts, 2500.0)

    pd = (
        tiv
        * 0.10
        * _storage_mult(inp.storage)
        * util
        * _pd_ded_mult(inp.pd_deductible)
        * lithium
        * 0.90  # NGC PM
        * wind
        / 1.35  # 0.10 already coastal; don't double-count wind in the mid case
        * storm_ded
    )

    hnoa = 400.0 if inp.deliver_carts else 300.0
    # Delivery of carts should sit on owned auto; HNOA stays incidental.
    gkll = 0.0 if inp.gkll_already_on_shop else (inp.gkll_limit / 1000.0) * 4.0
    if inp.carts >= 10 and inp.gkll_already_on_shop:
        gkll = 250.0  # possible limit bump as WIP + rental staging grow

    umbrella = 0.0
    if inp.umbrella_wanted:
        umb_use = 1.00 if inp.use in ("course", "gated") else 1.50 if inp.use == "community" else 2.20
        umbrella = 2500.0 * umb_use / 1.50
        if inp.alcohol != "ban" or inp.min_age < 25:
            umbrella *= 1.35

    wc = (inp.wc_rental_payroll / 100.0) * 4.00 * 1.00  # blended 8380/counter planning
    wc = max(400.0, wc) if inp.wc_rental_payroll > 0 else 0.0

    subtotal = gl + pd + hnoa + gkll + umbrella + wc
    tax = subtotal * 0.053 if inp.surplus else 0.0
    total = subtotal + tax

    return {
        "flags": flags,
        "tiv": tiv,
        "days_per_cart": days_per_cart,
        "lines": {
            "GL": gl,
            "Physical damage": pd,
            "HNOA": hnoa,
            "GKLL increment": gkll,
            "Umbrella $1M": umbrella,
            "WC increment": wc,
            "LA surplus tax/fees": tax,
        },
        "total": total,
        "band_low": total * 0.60,
        "band_high": total * 1.60,
    }


def main() -> None:
    p = argparse.ArgumentParser(description="NGC rental insurance planning estimator")
    p.add_argument("--carts", type=int)
    p.add_argument("--acv", type=float)
    p.add_argument("--receipts", type=float)
    p.add_argument("--days", type=int)
    p.add_argument("--min-age", type=int, dest="min_age")
    p.add_argument("--alcohol", choices=["ban", "dont_ask", "party"])
    p.add_argument("--use", choices=["course", "gated", "community", "public_road", "beach_event"])
    p.add_argument("--no-gps", action="store_true")
    p.add_argument("--southshore", action="store_true")
    args = p.parse_args()

    inp = Inputs()
    if args.carts is not None:
        inp.carts = args.carts
    if args.acv is not None:
        inp.acv = args.acv
    if args.receipts is not None:
        inp.rental_receipts = args.receipts
    if args.days is not None:
        inp.rental_days = args.days
    if args.min_age is not None:
        inp.min_age = args.min_age
    if args.alcohol is not None:
        inp.alcohol = args.alcohol
    if args.use is not None:
        inp.use = args.use
    if args.no_gps:
        inp.gps = False
    if args.southshore:
        inp.southshore = True

    out = estimate(inp)
    print("NGC rental insurance — PLANNING ESTIMATE (not a quote)")
    print(f"Location: 70433 Covington, LA · {inp.carts} carts · ${inp.acv:,.0f} ACV · TIV ${out['tiv']:,.0f}")
    print(f"Use={inp.use} · min age={inp.min_age} · alcohol={inp.alcohol} · {out['days_per_cart']:.0f} days/cart")
    print()
    for name, amt in out["lines"].items():
        print(f"  {name:<22} ${amt:,.0f}")
    print(f"  {'TOTAL (mid)':<22} ${out['total']:,.0f}")
    print(f"  Planning band         ${out['band_low']:,.0f} – ${out['band_high']:,.0f}")
    if out["flags"]:
        print()
        for f in out["flags"]:
            print(f"  ! {f}")
    print()
    print("Factors & methodology: knowledge/11_future_lines/golf_cart_rental_insurance_rating.md")


if __name__ == "__main__":
    main()
