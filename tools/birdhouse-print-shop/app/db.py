from __future__ import annotations

import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
DB_PATH = DATA_DIR / "birdhouse.db"
SCHEMA_PATH = ROOT / "schema.sql"

ORDER_STATUSES = [
    "Draft",
    "Queued",
    "Printing",
    "Finishing",
    "Ready to Ship",
    "Shipped",
    "Cancelled",
]

JOB_STATUSES = [
    "Queued",
    "Printing",
    "Finishing",
    "Ready to Ship",
    "Shipped",
    "Cancelled",
]


def connect() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(seed: bool = True) -> None:
    with connect() as conn:
        conn.executescript(SCHEMA_PATH.read_text())
        _ensure_settings(conn)
        if seed and _is_empty(conn):
            _seed(conn)
        conn.commit()


def get_setting(conn: sqlite3.Connection, key: str, default: str = "") -> str:
    row = conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
    return row["value"] if row else default


def set_setting(conn: sqlite3.Connection, key: str, value: str) -> None:
    conn.execute(
        "INSERT INTO settings(key, value) VALUES(?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (key, value),
    )


def _ensure_settings(conn: sqlite3.Connection) -> None:
    defaults = {
        # Active labor $/hr (finishing/packing), not full printer runtime
        "hourly_rate": "20",
        "waste_factor": "0.05",
        "shop_name": "Birdhouse Print Shop",
    }
    for key, value in defaults.items():
        exists = conn.execute("SELECT 1 FROM settings WHERE key = ?", (key,)).fetchone()
        if not exists:
            set_setting(conn, key, value)


def _is_empty(conn: sqlite3.Connection) -> bool:
    row = conn.execute("SELECT COUNT(*) AS c FROM products").fetchone()
    return row["c"] == 0


def _seed(conn: sqlite3.Connection) -> None:
    conn.execute(
        "INSERT INTO products(name, description) VALUES (?, ?)",
        ("Classic Wren", "Small traditional birdhouse for wrens"),
    )
    conn.execute(
        "INSERT INTO products(name, description) VALUES (?, ?)",
        ("Modern Box", "Clean-lined box birdhouse"),
    )

    # est_hours = hands-on labor (finish/pack), not printer runtime
    variants = [
        (1, "Small", "Forest Green", "WREN-S-GRN", 2800, 85, 0.35),
        (1, "Small", "Barn Red", "WREN-S-RED", 2800, 85, 0.35),
        (2, "Medium", "Slate Gray", "BOX-M-GRY", 4200, 140, 0.5),
        (2, "Medium", "Cedar Brown", "BOX-M-BRN", 4200, 140, 0.5),
    ]
    conn.executemany(
        "INSERT INTO variants(product_id, size, color_name, sku, sell_price_cents, est_grams, est_hours) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        variants,
    )

    materials = [
        ("PLA Forest Green", "filament", "Forest Green", 900, 22.0, 200),
        ("PLA Barn Red", "filament", "Barn Red", 750, 22.0, 200),
        ("PLA Slate Gray", "filament", "Slate Gray", 1100, 24.0, 200),
        ("PLA Cedar Brown", "filament", "Cedar Brown", 600, 24.0, 200),
        ("Mounting Hook", "hardware", "", 40, 0.35, 10),
    ]
    conn.executemany(
        "INSERT INTO materials(name, kind, color, qty_on_hand, cost_per_unit, reorder_at) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        materials,
    )

    conn.execute(
        "INSERT INTO orders(order_number, channel, customer_label, status, due_date, notes) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        ("BH-1001", "Etsy", "Etsy #88421", "Queued", "2026-08-08", "Gift wrap if possible"),
    )
    conn.execute(
        "INSERT INTO order_items(order_id, variant_id, qty, unit_price_cents) VALUES (1, 1, 2, 2800)"
    )
    conn.execute(
        "INSERT INTO jobs(order_item_id, status, printer_name) VALUES (1, 'Queued', 'Prusa-1')"
    )
    conn.execute(
        "INSERT INTO jobs(order_item_id, status, printer_name) VALUES (1, 'Queued', 'Prusa-2')"
    )


def money(cents: int) -> str:
    return f"${cents / 100:.2f}"


def order_economics(conn: sqlite3.Connection, order_id: int) -> dict:
    hourly = float(get_setting(conn, "hourly_rate", "25"))
    waste = float(get_setting(conn, "waste_factor", "0.05"))

    items = conn.execute(
        """
        SELECT oi.qty, oi.unit_price_cents, v.est_grams, v.est_hours, v.color_name
        FROM order_items oi
        JOIN variants v ON v.id = oi.variant_id
        WHERE oi.order_id = ?
        """,
        (order_id,),
    ).fetchall()

    revenue_cents = sum(i["qty"] * i["unit_price_cents"] for i in items)
    est_grams = sum(i["qty"] * i["est_grams"] for i in items)
    est_hours = sum(i["qty"] * i["est_hours"] for i in items)

    # Prefer matching filament by color name; fall back to average filament $/kg
    material_cost = 0.0
    for item in items:
        grams = item["qty"] * item["est_grams"] * (1 + waste)
        mat = conn.execute(
            "SELECT cost_per_unit FROM materials "
            "WHERE kind = 'filament' AND lower(color) = lower(?) AND active = 1 LIMIT 1",
            (item["color_name"],),
        ).fetchone()
        cost_per_kg = mat["cost_per_unit"] if mat else 22.0
        material_cost += (grams / 1000.0) * cost_per_kg

    # One hook per unit if hardware exists
    hook = conn.execute(
        "SELECT cost_per_unit FROM materials WHERE kind = 'hardware' AND active = 1 LIMIT 1"
    ).fetchone()
    units = sum(i["qty"] for i in items)
    if hook:
        material_cost += units * hook["cost_per_unit"]

    labor_cost = est_hours * hourly
    margin = (revenue_cents / 100.0) - material_cost - labor_cost

    return {
        "revenue_cents": revenue_cents,
        "revenue": money(revenue_cents),
        "est_grams": round(est_grams, 1),
        "est_hours": round(est_hours, 2),
        "material_cost": round(material_cost, 2),
        "labor_cost": round(labor_cost, 2),
        "margin": round(margin, 2),
    }
