(function () {
  const store = BirdhouseStore.createStore();
  store.load();

  const app = document.getElementById("app");
  const shopNameEl = document.getElementById("shop-name");
  const yearEl = document.getElementById("year");

  const routes = {
    dashboard: renderDashboard,
    board: renderBoard,
    orders: renderOrders,
    products: renderProducts,
    materials: renderMaterials,
    settings: renderSettings,
  };

  function currentRoute() {
    const hash = (location.hash || "#/dashboard").replace(/^#\/?/, "");
    const name = hash.split("?")[0] || "dashboard";
    return routes[name] ? name : "dashboard";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtMoney(n) {
    return `$${Number(n).toFixed(2)}`;
  }

  function shopName() {
    return store.getSetting("shop_name", "Blake's Birdhouses");
  }

  function setActiveNav() {
    const route = currentRoute();
    document.querySelectorAll("nav a[data-route]").forEach((link) => {
      link.classList.toggle("active", link.dataset.route === route);
    });
    shopNameEl.textContent = shopName();
    document.title = `${shopName()} · ${route.charAt(0).toUpperCase()}${route.slice(1)}`;
  }

  function render() {
    setActiveNav();
    routes[currentRoute()]();
  }

  function renderDashboard() {
    const data = store.dashboard();
    const dueRows = data.due.length
      ? data.due
          .map(
            (o) => `<tr>
              <td>${escapeHtml(o.order_number)}<div class="muted">${escapeHtml(o.customer_label)}</div></td>
              <td>${escapeHtml(o.channel)}</td>
              <td>${escapeHtml(o.due_date || "—")}</td>
              <td>${escapeHtml(o.status)}</td>
            </tr>`
          )
          .join("")
      : `<tr><td colspan="4" class="muted">No open orders. Add one under Orders.</td></tr>`;

    const stuckRows = data.stuck.length
      ? data.stuck
          .map(
            (j) => `<tr>
              <td>#${j.id} · ${escapeHtml(j.order_number)}</td>
              <td>${escapeHtml(j.sku)} <span class="muted">${escapeHtml(j.color_name)}</span></td>
              <td>${escapeHtml(j.status)}</td>
            </tr>`
          )
          .join("")
      : `<tr><td colspan="3" class="muted">Nothing stuck in Printing/Finishing.</td></tr>`;

    const lowList = data.low.length
      ? `<ul>${data.low
          .map((m) => `<li class="warn">${escapeHtml(m.name)} — ${m.qty_on_hand} left (reorder ${m.reorder_at})</li>`)
          .join("")}</ul>`
      : `<p class="ok">Stock looks fine.</p>`;

    const marginRows = data.margins.length
      ? data.margins
          .map(
            (m) => `<tr>
              <td>${escapeHtml(m.order_number)}</td>
              <td>${escapeHtml(m.revenue)}</td>
              <td class="${m.margin < 0 ? "warn" : "ok"}">${fmtMoney(m.margin)}</td>
            </tr>`
          )
          .join("")
      : `<tr><td colspan="3" class="muted">No open orders to score.</td></tr>`;

    app.innerHTML = `
      <section class="grid cards">
        <div class="panel">
          <h2>Active missions</h2>
          <p class="stat">${data.due.length}</p>
          <p class="muted">Not shipped / cancelled</p>
        </div>
        <div class="panel">
          <h2>In the field</h2>
          <p class="stat">${data.stuck.length}</p>
          <p class="muted">Printing or finishing</p>
        </div>
        <div class="panel">
          <h2>Resupply</h2>
          <p class="stat ${data.low.length ? "warn" : ""}">${data.low.length}</p>
          <p class="muted">At or below reorder point</p>
        </div>
      </section>
      <section class="split">
        <div class="panel">
          <h2>Mission queue</h2>
          <table>
            <thead><tr><th>Order</th><th>Channel</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>${dueRows}</tbody>
          </table>
        </div>
        <div class="stack">
          <div class="panel">
            <h2>Needs attention</h2>
            <table>
              <thead><tr><th>Job</th><th>SKU</th><th>Status</th></tr></thead>
              <tbody>${stuckRows}</tbody>
            </table>
          </div>
          <div class="panel">
            <h2>Low materials</h2>
            ${lowList}
          </div>
          <div class="panel">
            <h2>Open-order margin (est.)</h2>
            <table>
              <thead><tr><th>Order</th><th>Revenue</th><th>Margin</th></tr></thead>
              <tbody>${marginRows}</tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }

  function renderBoard() {
    const { columns, statuses } = store.board();
    const cols = statuses
      .map((status) => {
        const jobs = columns[status] || [];
        const cards = jobs.length
          ? jobs
              .map((j) => {
                const options = [...statuses, "Shipped", "Cancelled"]
                  .map((s) => `<option value="${s}" ${s === j.status ? "selected" : ""}>${s}</option>`)
                  .join("");
                return `<div class="job">
                  <strong>${escapeHtml(j.order_number)} · #${j.id}</strong>
                  <div>${escapeHtml(j.product_name)}</div>
                  <div class="muted">${escapeHtml(j.sku)} · ${escapeHtml(j.color_name)} · ${j.est_grams}g</div>
                  ${j.printer_name ? `<div class="muted">${escapeHtml(j.printer_name)}</div>` : ""}
                  ${j.due_date ? `<div class="muted">Due ${escapeHtml(j.due_date)}</div>` : ""}
                  <form class="inline job-move" data-job-id="${j.id}">
                    <select name="status">${options}</select>
                    <button class="small" type="submit">Move</button>
                  </form>
                </div>`;
              })
              .join("")
          : `<p class="muted">Empty</p>`;
        return `<div class="column panel"><h3>${escapeHtml(status)}</h3>${cards}</div>`;
      })
      .join("");

    app.innerHTML = `
      <section class="panel">
        <h2>Operations board</h2>
        <p class="muted">Advance a unit to <strong>Finishing</strong> to deduct matched filament (+ waste) and one field hook.</p>
        <div class="board">${cols}</div>
      </section>
    `;

    app.querySelectorAll("form.job-move").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const status = form.querySelector("select").value;
        store.moveJob(form.dataset.jobId, status);
        render();
      });
    });
  }

  function renderOrders() {
    const orders = store.enrichedOrders();
    const variants = store.activeVariants();
    const rows = orders.length
      ? orders
          .map(
            (o) => `<tr>
              <td>
                <strong>${escapeHtml(o.order_number)}</strong>
                <div class="muted">${escapeHtml(o.channel)} · ${escapeHtml(o.customer_label)}</div>
                ${o.notes ? `<div class="muted">${escapeHtml(o.notes)}</div>` : ""}
              </td>
              <td>${escapeHtml(o.status)}</td>
              <td>${escapeHtml(o.due_date || "—")}</td>
              <td>
                ${escapeHtml(o.revenue)}
                <div class="${o.margin < 0 ? "warn" : "ok"}">margin ${fmtMoney(o.margin)}</div>
              </td>
            </tr>`
          )
          .join("")
      : `<tr><td colspan="4" class="muted">No orders yet.</td></tr>`;

    const variantOptions = variants
      .map(
        (v) =>
          `<option value="${v.id}">${escapeHtml(v.product_name)} · ${escapeHtml(v.sku)} · ${escapeHtml(v.color_name)} (${store.money(v.sell_price_cents)})</option>`
      )
      .join("");

    app.innerHTML = `
      <section class="split">
        <div class="panel">
          <h2>Orders</h2>
          <table>
            <thead><tr><th>Order</th><th>Status</th><th>Due</th><th>Money</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="panel">
          <h2>New order</h2>
          <form id="order-form" class="stack">
            <label>Order # <input name="order_number" required placeholder="BH-1002" /></label>
            <label>Channel
              <select name="channel">
                <option>Etsy</option>
                <option>Facebook</option>
                <option>Local</option>
                <option>Other</option>
              </select>
            </label>
            <label>Customer label<input name="customer_label" placeholder="Etsy #88901" /></label>
            <label>Due date<input name="due_date" type="date" /></label>
            <label>Variant
              <select name="variant_id" required>${variantOptions}</select>
            </label>
            <label>Qty<input name="qty" type="number" min="1" value="1" /></label>
            <label>Notes<textarea name="notes" rows="3" placeholder="Color request, gift note..."></textarea></label>
            <button type="submit">Create order + queue jobs</button>
          </form>
        </div>
      </section>
    `;

    document.getElementById("order-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.target;
      store.createOrder({
        order_number: form.order_number.value,
        channel: form.channel.value,
        customer_label: form.customer_label.value,
        due_date: form.due_date.value,
        variant_id: form.variant_id.value,
        qty: form.qty.value,
        notes: form.notes.value,
      });
      location.hash = "#/board";
    });
  }

  function renderProducts() {
    const rows = store.productRows();
    const body = rows
      .map(
        (r) => `<tr>
          <td><strong>${escapeHtml(r.name)}</strong><div class="muted">${escapeHtml(r.description)}</div></td>
          <td>${escapeHtml(r.sku || "—")}</td>
          <td>${r.variant_id ? `${escapeHtml(r.size)} · ${escapeHtml(r.color_name)}` : "—"}</td>
          <td>${r.variant_id ? store.money(r.sell_price_cents) : "—"}</td>
          <td class="muted">${r.variant_id ? `${r.est_grams}g · ${r.est_hours}h` : "—"}</td>
        </tr>`
      )
      .join("");

    app.innerHTML = `
      <section class="split">
        <div class="panel">
          <h2>Catalog</h2>
          <table>
            <thead><tr><th>Product</th><th>SKU</th><th>Variant</th><th>Price</th><th>Est.</th></tr></thead>
            <tbody>${body}</tbody>
          </table>
        </div>
        <div class="panel">
          <h2>Add product + first variant</h2>
          <form id="product-form" class="stack">
            <label>Product name<input name="name" required placeholder="Classic Wren" /></label>
            <label>Description<input name="description" placeholder="Small traditional birdhouse" /></label>
            <label>Size<input name="size" placeholder="Small" /></label>
            <label>Color<input name="color_name" placeholder="Forest Green" /></label>
            <label>SKU<input name="sku" required placeholder="WREN-S-GRN" /></label>
            <label>Sell price ($)<input name="sell_price" type="number" step="0.01" required value="28.00" /></label>
            <label>Est. grams<input name="est_grams" type="number" step="0.1" value="85" /></label>
            <label>Est. labor hours (hands-on)<input name="est_hours" type="number" step="0.05" value="0.35" /></label>
            <button type="submit">Save product</button>
          </form>
        </div>
      </section>
    `;

    document.getElementById("product-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.target;
      store.createProduct({
        name: form.name.value,
        description: form.description.value,
        size: form.size.value,
        color_name: form.color_name.value,
        sku: form.sku.value,
        sell_price: form.sell_price.value,
        est_grams: form.est_grams.value,
        est_hours: form.est_hours.value,
      });
      render();
    });
  }

  function renderMaterials() {
    const rows = store
      .getState()
      .materials.filter((m) => m.active)
      .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));

    const body = rows
      .map(
        (m) => `<tr>
          <td>
            <strong>${escapeHtml(m.name)}</strong>
            ${m.color ? `<div class="muted">${escapeHtml(m.color)}</div>` : ""}
            ${m.qty_on_hand <= m.reorder_at ? `<div class="warn">Reorder</div>` : ""}
          </td>
          <td>${escapeHtml(m.kind)}</td>
          <td>${m.qty_on_hand}${m.kind === "filament" ? " g" : ""}</td>
          <td>${fmtMoney(m.cost_per_unit)}${m.kind === "filament" ? "/kg" : "/ea"}</td>
          <td>
            <form class="inline adjust-form" data-id="${m.id}">
              <input name="delta" type="number" step="1" value="-50" style="width:6rem" />
              <button class="small" type="submit">Apply</button>
            </form>
          </td>
        </tr>`
      )
      .join("");

    app.innerHTML = `
      <section class="split">
        <div class="panel">
          <h2>On hand</h2>
          <table>
            <thead><tr><th>Material</th><th>Kind</th><th>Qty</th><th>Cost</th><th>Adjust</th></tr></thead>
            <tbody>${body}</tbody>
          </table>
        </div>
        <div class="panel">
          <h2>Add material</h2>
          <form id="material-form" class="stack">
            <label>Name<input name="name" required placeholder="PLA Forest Green" /></label>
            <label>Kind
              <select name="kind">
                <option value="filament">filament</option>
                <option value="hardware">hardware</option>
              </select>
            </label>
            <label>Color<input name="color" placeholder="Forest Green" /></label>
            <label>Qty on hand<input name="qty_on_hand" type="number" step="0.1" value="1000" /></label>
            <label>Cost per unit ($/kg or $/ea)<input name="cost_per_unit" type="number" step="0.01" value="22" /></label>
            <label>Reorder at<input name="reorder_at" type="number" step="0.1" value="200" /></label>
            <button type="submit">Save material</button>
          </form>
        </div>
      </section>
    `;

    app.querySelectorAll("form.adjust-form").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        store.adjustMaterial(form.dataset.id, form.delta.value);
        render();
      });
    });

    document.getElementById("material-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.target;
      store.createMaterial({
        name: form.name.value,
        kind: form.kind.value,
        color: form.color.value,
        qty_on_hand: form.qty_on_hand.value,
        cost_per_unit: form.cost_per_unit.value,
        reorder_at: form.reorder_at.value,
      });
      render();
    });
  }

  function renderSettings() {
    app.innerHTML = `
      <section class="panel settings-panel">
        <h2>Shop settings</h2>
        <form id="settings-form" class="stack">
          <label>Shop name<input name="shop_name" value="${escapeHtml(shopName())}" required /></label>
          <label>Hourly labor rate ($ for hands-on finish/pack)
            <input name="hourly_rate" type="number" step="0.01" value="${escapeHtml(store.getSetting("hourly_rate", "20"))}" required />
          </label>
          <label>Filament waste factor (0.05 = 5%)
            <input name="waste_factor" type="number" step="0.01" value="${escapeHtml(store.getSetting("waste_factor", "0.05"))}" required />
          </label>
          <button type="submit">Save settings</button>
        </form>
        <hr />
        <p class="muted">This browser keeps shop data locally. Reset restores sample missions for Kayla, Elliot, and Emmet.</p>
        <button type="button" class="secondary" id="reset-demo">Reset sample missions</button>
      </section>
    `;

    document.getElementById("settings-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.target;
      store.setSettings({
        shop_name: form.shop_name.value.trim(),
        hourly_rate: String(form.hourly_rate.value),
        waste_factor: String(form.waste_factor.value),
      });
      render();
    });

    document.getElementById("reset-demo").addEventListener("click", () => {
      if (confirm("Reset this browser’s shop data to the Kayla / Elliot / Emmet sample missions?")) {
        store.reset();
        location.hash = "#/dashboard";
        render();
      }
    });
  }

  window.addEventListener("hashchange", render);
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  if (!location.hash) location.hash = "#/dashboard";
  render();
})();
