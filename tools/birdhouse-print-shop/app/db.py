from __future__ import annotations

import sqlite3

from app.paths import default_data_dir, schema_path

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


def data_dir():
    return default_data_dir()


def db_path():
    return data_dir() / "birdhouse.db"


def connect() -> sqlite3.Connection:
    data_dir().mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


SEED_VERSION = "blakes-military-v1"


def init_db(seed: bool = True) -> None:
    with connect() as conn:
        conn.executescript(schema_path().read_text(encoding="utf-8"))
        _ensure_settings(conn)
        if seed:
            current = get_setting(conn, "seed_version", "")
            if current != SEED_VERSION:
                _reset_business_data(conn)
                _seed(conn)
                set_setting(conn, "seed_version", SEED_VERSION)
            set_setting(conn, "shop_name", "Blake's Birdhouses")
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
        "shop_name": "Blake's Birdhouses",
    }
    for key, value in defaults.items():
        exists = conn.execute("SELECT 1 FROM settings WHERE key = ?", (key,)).fetchone()
        if not exists:
            set_setting(conn, key, value)


def _reset_business_data(conn: sqlite3.Connection) -> None:
    for table in (
        "material_uses",
        "jobs",
        "order_items",
        "orders",
        "variants",
        "products",
        "materials",
    ):
        conn.execute(f"DELETE FROM {table}")


def _seed(conn: sqlite3.Connection) -> None:
    conn.execute(
        "INSERT INTO products(name, description) VALUES (?, ?)",
        ("Patrol Nest", "Rugged field birdhouse — olive drab finish"),
    )
    conn.execute(
        "INSERT INTO products(name, description) VALUES (?, ?)",
        ("Bunker Box", "Hardened roost box with camo plate lines"),
    )

    # est_hours = hands-on labor (finish/pack), not printer runtime
    variants = [
        (1, "Standard", "Olive Drab", "PATROL-OD", 3200, 95, 0.4),
        (1, "Standard", "Desert Tan", "PATROL-TAN", 3200, 95, 0.4),
        (2, "Heavy", "Camo Green", "BUNKER-CAMO", 4500, 150, 0.55),
        (2, "Heavy", "Coyote Brown", "BUNKER-COY", 4500, 150, 0.55),
    ]
    conn.executemany(
        "INSERT INTO variants(product_id, size, color_name, sku, sell_price_cents, est_grams, est_hours) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        variants,
    )

    materials = [
        ("PLA Olive Drab", "filament", "Olive Drab", 1000, 24.0, 200),
        ("PLA Desert Tan", "filament", "Desert Tan", 850, 24.0, 200),
        ("PLA Camo Green", "filament", "Camo Green", 900, 25.0, 200),
        ("PLA Coyote Brown", "filament", "Coyote Brown", 700, 25.0, 200),
        ("Field Mount Hook", "hardware", "", 50, 0.4, 10),
    ]
    conn.executemany(
        "INSERT INTO materials(name, kind, color, qty_on_hand, cost_per_unit, reorder_at) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        materials,
    )

    orders = [
        ("BB-KAYLA", "Local", "Kayla", "Queued", "2026-08-10", "Patrol Nest — olive drab"),
        ("BB-ELLIOT", "Etsy", "Elliot", "Printing", "2026-08-09", "Bunker Box — camo green"),
        ("BB-EMMET", "Facebook", "Emmet", "Finishing", "2026-08-08", "Patrol Nest — desert tan"),
    ]
    for order_number, channel, customer, status, due, notes in orders:
        cur = conn.execute(
            "INSERT INTO orders(order_number, channel, customer_label, status, due_date, notes) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (order_number, channel, customer, status, due, notes),
        )
        order_id = cur.lastrowid
        # Map customers to variants: Kayla=1, Elliot=3, Emmet=2
        variant_id = {"Kayla": 1, "Elliot": 3, "Emmet": 2}[customer]
        price = {1: 3200, 2: 3200, 3: 4500, 4: 4500}[variant_id]
        item = conn.execute(
            "INSERT INTO order_items(order_id, variant_id, qty, unit_price_cents) VALUES (?, ?, 1, ?)",
            (order_id, variant_id, price),
        )
        job_status = {"Kayla": "Queued", "Elliot": "Printing", "Emmet": "Finishing"}[customer]
        printer = {"Kayla": "Alpha-1", "Elliot": "Bravo-2", "Emmet": "Charlie-3"}[customer]
        conn.execute(
            "INSERT INTO jobs(order_item_id, status, printer_name) VALUES (?, ?, ?)",
            (item.lastrowid, job_status, printer),
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
