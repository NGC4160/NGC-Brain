from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Form, Request
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.db import (
    JOB_STATUSES,
    ORDER_STATUSES,
    connect,
    get_setting,
    init_db,
    money,
    order_economics,
    set_setting,
)
from app.paths import static_dir, templates_dir

templates = Jinja2Templates(directory=str(templates_dir()))


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db(seed=True)
    yield


app = FastAPI(title="Birdhouse Print Shop", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=str(static_dir())), name="static")


def _shop_name(conn) -> str:
    return get_setting(conn, "shop_name", "Birdhouse Print Shop")


@app.get("/")
def dashboard(request: Request):
    with connect() as conn:
        due = conn.execute(
            """
            SELECT * FROM orders
            WHERE status NOT IN ('Shipped', 'Cancelled')
            ORDER BY COALESCE(due_date, '9999-12-31'), id
            LIMIT 20
            """
        ).fetchall()
        stuck = conn.execute(
            """
            SELECT j.*, o.order_number, v.sku, v.color_name
            FROM jobs j
            JOIN order_items oi ON oi.id = j.order_item_id
            JOIN orders o ON o.id = oi.order_id
            JOIN variants v ON v.id = oi.variant_id
            WHERE j.status IN ('Printing', 'Finishing')
            ORDER BY j.id
            """
        ).fetchall()
        low = conn.execute(
            """
            SELECT * FROM materials
            WHERE active = 1 AND qty_on_hand <= reorder_at
            ORDER BY kind, name
            """
        ).fetchall()
        open_orders = conn.execute(
            "SELECT id FROM orders WHERE status NOT IN ('Shipped', 'Cancelled')"
        ).fetchall()
        margins = []
        for o in open_orders:
            econ = order_economics(conn, o["id"])
            row = conn.execute("SELECT order_number, status FROM orders WHERE id = ?", (o["id"],)).fetchone()
            margins.append({**dict(row), **econ})
        ctx = {
            "shop_name": _shop_name(conn),
            "due": due,
            "stuck": stuck,
            "low": low,
            "margins": margins,
            "nav": "dashboard",
        }
    return templates.TemplateResponse(request, "dashboard.html", ctx)


@app.get("/products")
def products(request: Request):
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT p.id AS product_id, p.name, p.description, p.active AS product_active,
                   v.id AS variant_id, v.size, v.color_name, v.sku,
                   v.sell_price_cents, v.est_grams, v.est_hours, v.active AS variant_active
            FROM products p
            LEFT JOIN variants v ON v.product_id = p.id
            ORDER BY p.name, v.sku
            """
        ).fetchall()
        ctx = {
            "shop_name": _shop_name(conn),
            "rows": rows,
            "money": money,
            "nav": "products",
        }
    return templates.TemplateResponse(request, "products.html", ctx)


@app.post("/products")
def create_product(
    name: str = Form(...),
    description: str = Form(""),
    size: str = Form(""),
    color_name: str = Form(""),
    sku: str = Form(...),
    sell_price: float = Form(...),
    est_grams: float = Form(0),
    est_hours: float = Form(0),
):
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO products(name, description) VALUES (?, ?)",
            (name.strip(), description.strip()),
        )
        product_id = cur.lastrowid
        conn.execute(
            """
            INSERT INTO variants(product_id, size, color_name, sku, sell_price_cents, est_grams, est_hours)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                product_id,
                size.strip(),
                color_name.strip(),
                sku.strip().upper(),
                int(round(sell_price * 100)),
                est_grams,
                est_hours,
            ),
        )
        conn.commit()
    return RedirectResponse("/products", status_code=303)


@app.get("/materials")
def materials(request: Request):
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM materials WHERE active = 1 ORDER BY kind, name"
        ).fetchall()
        ctx = {
            "shop_name": _shop_name(conn),
            "rows": rows,
            "nav": "materials",
        }
    return templates.TemplateResponse(request, "materials.html", ctx)


@app.post("/materials")
def create_material(
    name: str = Form(...),
    kind: str = Form(...),
    color: str = Form(""),
    qty_on_hand: float = Form(0),
    cost_per_unit: float = Form(0),
    reorder_at: float = Form(0),
):
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO materials(name, kind, color, qty_on_hand, cost_per_unit, reorder_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (name.strip(), kind, color.strip(), qty_on_hand, cost_per_unit, reorder_at),
        )
        conn.commit()
    return RedirectResponse("/materials", status_code=303)


@app.post("/materials/{material_id}/adjust")
def adjust_material(material_id: int, delta: float = Form(...)):
    with connect() as conn:
        conn.execute(
            "UPDATE materials SET qty_on_hand = qty_on_hand + ? WHERE id = ?",
            (delta, material_id),
        )
        conn.commit()
    return RedirectResponse("/materials", status_code=303)


@app.get("/orders")
def orders(request: Request):
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM orders ORDER BY created_at DESC, id DESC"
        ).fetchall()
        variants = conn.execute(
            """
            SELECT v.id, v.sku, v.color_name, v.size, v.sell_price_cents, p.name AS product_name
            FROM variants v JOIN products p ON p.id = v.product_id
            WHERE v.active = 1
            ORDER BY p.name, v.sku
            """
        ).fetchall()
        enriched = []
        for row in rows:
            econ = order_economics(conn, row["id"])
            enriched.append({**dict(row), **econ})
        ctx = {
            "shop_name": _shop_name(conn),
            "orders": enriched,
            "variants": variants,
            "statuses": ORDER_STATUSES,
            "nav": "orders",
        }
    return templates.TemplateResponse(request, "orders.html", ctx)


@app.post("/orders")
def create_order(
    order_number: str = Form(...),
    channel: str = Form("Other"),
    customer_label: str = Form(""),
    due_date: str = Form(""),
    notes: str = Form(""),
    variant_id: int = Form(...),
    qty: int = Form(1),
):
    with connect() as conn:
        variant = conn.execute(
            "SELECT sell_price_cents FROM variants WHERE id = ?", (variant_id,)
        ).fetchone()
        cur = conn.execute(
            """
            INSERT INTO orders(order_number, channel, customer_label, status, due_date, notes)
            VALUES (?, ?, ?, 'Queued', ?, ?)
            """,
            (
                order_number.strip(),
                channel.strip(),
                customer_label.strip(),
                due_date or None,
                notes.strip(),
            ),
        )
        order_id = cur.lastrowid
        item = conn.execute(
            """
            INSERT INTO order_items(order_id, variant_id, qty, unit_price_cents)
            VALUES (?, ?, ?, ?)
            """,
            (order_id, variant_id, qty, variant["sell_price_cents"]),
        )
        item_id = item.lastrowid
        for _ in range(max(qty, 1)):
            conn.execute(
                "INSERT INTO jobs(order_item_id, status) VALUES (?, 'Queued')",
                (item_id,),
            )
        conn.commit()
    return RedirectResponse("/orders", status_code=303)


@app.get("/board")
def board(request: Request):
    with connect() as conn:
        jobs = conn.execute(
            """
            SELECT j.*, o.order_number, o.due_date, v.sku, v.color_name, v.est_grams, p.name AS product_name
            FROM jobs j
            JOIN order_items oi ON oi.id = j.order_item_id
            JOIN orders o ON o.id = oi.order_id
            JOIN variants v ON v.id = oi.variant_id
            JOIN products p ON p.id = v.product_id
            WHERE j.status NOT IN ('Shipped', 'Cancelled')
            ORDER BY j.id
            """
        ).fetchall()
        columns = {s: [] for s in JOB_STATUSES if s not in ("Shipped", "Cancelled")}
        for job in jobs:
            columns.setdefault(job["status"], []).append(job)
        ctx = {
            "shop_name": _shop_name(conn),
            "columns": columns,
            "statuses": [s for s in JOB_STATUSES if s not in ("Shipped", "Cancelled")],
            "nav": "board",
        }
    return templates.TemplateResponse(request, "board.html", ctx)


@app.post("/jobs/{job_id}/status")
def move_job(job_id: int, status: str = Form(...)):
    if status not in JOB_STATUSES:
        return RedirectResponse("/board", status_code=303)

    with connect() as conn:
        job = conn.execute(
            """
            SELECT j.*, v.est_grams, v.color_name
            FROM jobs j
            JOIN order_items oi ON oi.id = j.order_item_id
            JOIN variants v ON v.id = oi.variant_id
            WHERE j.id = ?
            """,
            (job_id,),
        ).fetchone()
        if not job:
            return RedirectResponse("/board", status_code=303)

        prev = job["status"]
        conn.execute("UPDATE jobs SET status = ? WHERE id = ?", (status, job_id))

        if status == "Printing" and not job["started_at"]:
            conn.execute(
                "UPDATE jobs SET started_at = datetime('now') WHERE id = ?", (job_id,)
            )

        # Deduct filament once when leaving Printing / entering Finishing
        if status == "Finishing" and prev != "Finishing":
            grams = job["actual_grams"] if job["actual_grams"] is not None else job["est_grams"]
            waste = float(get_setting(conn, "waste_factor", "0.05"))
            used = float(grams) * (1 + waste)
            mat = conn.execute(
                """
                SELECT id FROM materials
                WHERE kind = 'filament' AND active = 1 AND lower(color) = lower(?)
                ORDER BY qty_on_hand DESC LIMIT 1
                """,
                (job["color_name"],),
            ).fetchone()
            if mat:
                conn.execute(
                    "UPDATE materials SET qty_on_hand = qty_on_hand - ? WHERE id = ?",
                    (used, mat["id"]),
                )
                conn.execute(
                    "INSERT INTO material_uses(job_id, material_id, qty_used) VALUES (?, ?, ?)",
                    (job_id, mat["id"], used),
                )
            hook = conn.execute(
                "SELECT id FROM materials WHERE kind = 'hardware' AND active = 1 ORDER BY id LIMIT 1"
            ).fetchone()
            if hook:
                conn.execute(
                    "UPDATE materials SET qty_on_hand = qty_on_hand - 1 WHERE id = ?",
                    (hook["id"],),
                )
                conn.execute(
                    "INSERT INTO material_uses(job_id, material_id, qty_used) VALUES (?, ?, 1)",
                    (job_id, hook["id"]),
                )
            conn.execute(
                "UPDATE jobs SET finished_at = datetime('now'), actual_grams = COALESCE(actual_grams, ?) WHERE id = ?",
                (job["est_grams"], job_id),
            )

        # Roll parent order status to earliest incomplete job-ish summary
        order = conn.execute(
            """
            SELECT o.id FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            WHERE oi.id = ?
            """,
            (job["order_item_id"],),
        ).fetchone()
        if order:
            statuses = [
                r["status"]
                for r in conn.execute(
                    """
                    SELECT j.status FROM jobs j
                    JOIN order_items oi ON oi.id = j.order_item_id
                    WHERE oi.order_id = ?
                    """,
                    (order["id"],),
                ).fetchall()
            ]
            for candidate in ORDER_STATUSES:
                if candidate in statuses:
                    conn.execute(
                        "UPDATE orders SET status = ? WHERE id = ?",
                        (candidate, order["id"]),
                    )
                    break

        conn.commit()
    return RedirectResponse("/board", status_code=303)


@app.get("/settings")
def settings_page(request: Request):
    with connect() as conn:
        ctx = {
            "shop_name": _shop_name(conn),
            "hourly_rate": get_setting(conn, "hourly_rate", "25"),
            "waste_factor": get_setting(conn, "waste_factor", "0.05"),
            "nav": "settings",
        }
    return templates.TemplateResponse(request, "settings.html", ctx)


@app.post("/settings")
def save_settings(
    shop_name: str = Form(...),
    hourly_rate: float = Form(...),
    waste_factor: float = Form(...),
):
    with connect() as conn:
        set_setting(conn, "shop_name", shop_name.strip())
        set_setting(conn, "hourly_rate", str(hourly_rate))
        set_setting(conn, "waste_factor", str(waste_factor))
        conn.commit()
    return RedirectResponse("/settings", status_code=303)


def run() -> None:
    import os

    import uvicorn

    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8787"))
    reload = os.getenv("RELOAD", "1") == "1"
    uvicorn.run("app.main:app", host=host, port=port, reload=reload)


if __name__ == "__main__":
    run()
