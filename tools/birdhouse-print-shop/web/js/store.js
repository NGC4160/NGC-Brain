/**
 * Blake's Birdhouses — client-side shop store.
 * Ports tools/birdhouse-print-shop/app/db.py + main.py workflow.
 * Persistence: this browser's localStorage only (GitHub Pages is static).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.BirdhouseStore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const STORAGE_KEY = "blakes-birdhouses-v1";
  const SEED_VERSION = "blakes-military-v1";

  const ORDER_STATUSES = [
    "Draft",
    "Queued",
    "Printing",
    "Finishing",
    "Ready to Ship",
    "Shipped",
    "Cancelled",
  ];

  const JOB_STATUSES = [
    "Queued",
    "Printing",
    "Finishing",
    "Ready to Ship",
    "Shipped",
    "Cancelled",
  ];

  const BOARD_STATUSES = JOB_STATUSES.filter((s) => s !== "Shipped" && s !== "Cancelled");

  function nowIso() {
    return new Date().toISOString().replace("T", " ").slice(0, 19);
  }

  function money(cents) {
    return `$${(Number(cents) / 100).toFixed(2)}`;
  }

  function seedState() {
    const products = [
      {
        id: 1,
        name: "Patrol Nest",
        description: "Rugged field birdhouse — olive drab finish",
        active: 1,
      },
      {
        id: 2,
        name: "Bunker Box",
        description: "Hardened roost box with camo plate lines",
        active: 1,
      },
    ];

    const variants = [
      { id: 1, product_id: 1, size: "Standard", color_name: "Olive Drab", sku: "PATROL-OD", sell_price_cents: 3200, est_grams: 95, est_hours: 0.4, active: 1 },
      { id: 2, product_id: 1, size: "Standard", color_name: "Desert Tan", sku: "PATROL-TAN", sell_price_cents: 3200, est_grams: 95, est_hours: 0.4, active: 1 },
      { id: 3, product_id: 2, size: "Heavy", color_name: "Camo Green", sku: "BUNKER-CAMO", sell_price_cents: 4500, est_grams: 150, est_hours: 0.55, active: 1 },
      { id: 4, product_id: 2, size: "Heavy", color_name: "Coyote Brown", sku: "BUNKER-COY", sell_price_cents: 4500, est_grams: 150, est_hours: 0.55, active: 1 },
    ];

    const materials = [
      { id: 1, name: "PLA Olive Drab", kind: "filament", color: "Olive Drab", qty_on_hand: 1000, cost_per_unit: 24.0, reorder_at: 200, active: 1 },
      { id: 2, name: "PLA Desert Tan", kind: "filament", color: "Desert Tan", qty_on_hand: 850, cost_per_unit: 24.0, reorder_at: 200, active: 1 },
      { id: 3, name: "PLA Camo Green", kind: "filament", color: "Camo Green", qty_on_hand: 900, cost_per_unit: 25.0, reorder_at: 200, active: 1 },
      { id: 4, name: "PLA Coyote Brown", kind: "filament", color: "Coyote Brown", qty_on_hand: 700, cost_per_unit: 25.0, reorder_at: 200, active: 1 },
      { id: 5, name: "Field Mount Hook", kind: "hardware", color: "", qty_on_hand: 50, cost_per_unit: 0.4, reorder_at: 10, active: 1 },
    ];

    const sampleOrders = [
      { id: 1, order_number: "BB-KAYLA", channel: "Local", customer_label: "Kayla", status: "Queued", due_date: "2026-08-10", notes: "Patrol Nest — olive drab", variant_id: 1, printer_name: "Alpha-1" },
      { id: 2, order_number: "BB-ELLIOT", channel: "Etsy", customer_label: "Elliot", status: "Printing", due_date: "2026-08-09", notes: "Bunker Box — camo green", variant_id: 3, printer_name: "Bravo-2" },
      { id: 3, order_number: "BB-EMMET", channel: "Facebook", customer_label: "Emmet", status: "Finishing", due_date: "2026-08-08", notes: "Patrol Nest — desert tan", variant_id: 2, printer_name: "Charlie-3" },
    ];

    const orders = [];
    const order_items = [];
    const jobs = [];

    sampleOrders.forEach((row) => {
      const variant = variants.find((v) => v.id === row.variant_id);
      orders.push({
        id: row.id,
        order_number: row.order_number,
        channel: row.channel,
        customer_label: row.customer_label,
        status: row.status,
        due_date: row.due_date,
        notes: row.notes,
        created_at: "2026-08-01 12:00:00",
      });
      order_items.push({
        id: row.id,
        order_id: row.id,
        variant_id: row.variant_id,
        qty: 1,
        unit_price_cents: variant.sell_price_cents,
      });
      jobs.push({
        id: row.id,
        order_item_id: row.id,
        status: row.status,
        printer_name: row.printer_name,
        started_at: row.status === "Queued" ? null : "2026-08-02 09:00:00",
        finished_at: row.status === "Finishing" ? "2026-08-03 15:00:00" : null,
        actual_grams: null,
        actual_hours: null,
      });
    });

    return {
      seed_version: SEED_VERSION,
      nextIds: {
        products: 3,
        variants: 5,
        materials: 6,
        orders: 4,
        order_items: 4,
        jobs: 4,
        material_uses: 1,
      },
      settings: {
        shop_name: "Blake's Birdhouses",
        hourly_rate: "20",
        waste_factor: "0.05",
      },
      products,
      variants,
      materials,
      orders,
      order_items,
      jobs,
      material_uses: [],
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function nextId(state, key) {
    const id = state.nextIds[key] || 1;
    state.nextIds[key] = id + 1;
    return id;
  }

  function createStore(storage) {
    const backend = storage || (typeof localStorage !== "undefined" ? localStorage : null);
    let state = null;

    function persist() {
      if (backend) {
        backend.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    }

    function load() {
      if (backend) {
        try {
          const raw = backend.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.seed_version === SEED_VERSION) {
              state = parsed;
              return getState();
            }
          }
        } catch (_err) {
          // fall through to seed
        }
      }
      state = seedState();
      persist();
      return getState();
    }

    function reset() {
      state = seedState();
      persist();
      return getState();
    }

    function getState() {
      if (!state) load();
      return clone(state);
    }

    function getSetting(key, fallback) {
      if (!state) load();
      const value = state.settings[key];
      return value == null || value === "" ? fallback : String(value);
    }

    function setSettings(updates) {
      if (!state) load();
      Object.assign(state.settings, updates);
      persist();
    }

    function orderEconomics(orderId) {
      if (!state) load();
      const hourly = parseFloat(getSetting("hourly_rate", "20"));
      const waste = parseFloat(getSetting("waste_factor", "0.05"));
      const items = state.order_items.filter((i) => i.order_id === orderId);

      let revenueCents = 0;
      let estGrams = 0;
      let estHours = 0;
      let materialCost = 0;
      let units = 0;

      items.forEach((item) => {
        const variant = state.variants.find((v) => v.id === item.variant_id);
        if (!variant) return;
        revenueCents += item.qty * item.unit_price_cents;
        estGrams += item.qty * variant.est_grams;
        estHours += item.qty * variant.est_hours;
        units += item.qty;
        const grams = item.qty * variant.est_grams * (1 + waste);
        const mat = state.materials.find(
          (m) => m.kind === "filament" && m.active && m.color.toLowerCase() === variant.color_name.toLowerCase()
        );
        const costPerKg = mat ? mat.cost_per_unit : 22.0;
        materialCost += (grams / 1000.0) * costPerKg;
      });

      const hook = state.materials.find((m) => m.kind === "hardware" && m.active);
      if (hook) materialCost += units * hook.cost_per_unit;

      const laborCost = estHours * hourly;
      const margin = revenueCents / 100.0 - materialCost - laborCost;

      return {
        revenue_cents: revenueCents,
        revenue: money(revenueCents),
        est_grams: Math.round(estGrams * 10) / 10,
        est_hours: Math.round(estHours * 100) / 100,
        material_cost: Math.round(materialCost * 100) / 100,
        labor_cost: Math.round(laborCost * 100) / 100,
        margin: Math.round(margin * 100) / 100,
      };
    }

    function dashboard() {
      if (!state) load();
      const due = state.orders
        .filter((o) => o.status !== "Shipped" && o.status !== "Cancelled")
        .sort((a, b) => String(a.due_date || "9999-12-31").localeCompare(String(b.due_date || "9999-12-31")) || a.id - b.id)
        .slice(0, 20);

      const stuck = state.jobs
        .filter((j) => j.status === "Printing" || j.status === "Finishing")
        .map((j) => enrichJob(j));

      const low = state.materials
        .filter((m) => m.active && m.qty_on_hand <= m.reorder_at)
        .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));

      const margins = state.orders
        .filter((o) => o.status !== "Shipped" && o.status !== "Cancelled")
        .map((o) => ({ order_number: o.order_number, status: o.status, ...orderEconomics(o.id) }));

      return { due, stuck, low, margins, shop_name: getSetting("shop_name", "Blake's Birdhouses") };
    }

    function enrichJob(job) {
      const item = state.order_items.find((i) => i.id === job.order_item_id);
      const order = item ? state.orders.find((o) => o.id === item.order_id) : null;
      const variant = item ? state.variants.find((v) => v.id === item.variant_id) : null;
      const product = variant ? state.products.find((p) => p.id === variant.product_id) : null;
      return {
        ...job,
        order_number: order ? order.order_number : "",
        due_date: order ? order.due_date : null,
        sku: variant ? variant.sku : "",
        color_name: variant ? variant.color_name : "",
        est_grams: variant ? variant.est_grams : 0,
        product_name: product ? product.name : "",
      };
    }

    function productRows() {
      if (!state) load();
      const rows = [];
      state.products.forEach((p) => {
        const variants = state.variants.filter((v) => v.product_id === p.id);
        if (!variants.length) {
          rows.push({
            product_id: p.id,
            name: p.name,
            description: p.description,
            product_active: p.active,
            variant_id: null,
            size: "",
            color_name: "",
            sku: "",
            sell_price_cents: 0,
            est_grams: 0,
            est_hours: 0,
          });
        } else {
          variants.forEach((v) => {
            rows.push({
              product_id: p.id,
              name: p.name,
              description: p.description,
              product_active: p.active,
              variant_id: v.id,
              size: v.size,
              color_name: v.color_name,
              sku: v.sku,
              sell_price_cents: v.sell_price_cents,
              est_grams: v.est_grams,
              est_hours: v.est_hours,
              variant_active: v.active,
            });
          });
        }
      });
      return rows.sort((a, b) => a.name.localeCompare(b.name) || String(a.sku).localeCompare(String(b.sku)));
    }

    function activeVariants() {
      if (!state) load();
      return state.variants
        .filter((v) => v.active)
        .map((v) => {
          const product = state.products.find((p) => p.id === v.product_id);
          return { ...v, product_name: product ? product.name : "" };
        })
        .sort((a, b) => a.product_name.localeCompare(b.product_name) || a.sku.localeCompare(b.sku));
    }

    function createProduct(input) {
      if (!state) load();
      const productId = nextId(state, "products");
      state.products.push({
        id: productId,
        name: String(input.name || "").trim(),
        description: String(input.description || "").trim(),
        active: 1,
      });
      state.variants.push({
        id: nextId(state, "variants"),
        product_id: productId,
        size: String(input.size || "").trim(),
        color_name: String(input.color_name || "").trim(),
        sku: String(input.sku || "").trim().toUpperCase(),
        sell_price_cents: Math.round(Number(input.sell_price) * 100),
        est_grams: Number(input.est_grams) || 0,
        est_hours: Number(input.est_hours) || 0,
        active: 1,
      });
      persist();
    }

    function createMaterial(input) {
      if (!state) load();
      state.materials.push({
        id: nextId(state, "materials"),
        name: String(input.name || "").trim(),
        kind: input.kind === "hardware" ? "hardware" : "filament",
        color: String(input.color || "").trim(),
        qty_on_hand: Number(input.qty_on_hand) || 0,
        cost_per_unit: Number(input.cost_per_unit) || 0,
        reorder_at: Number(input.reorder_at) || 0,
        active: 1,
      });
      persist();
    }

    function adjustMaterial(materialId, delta) {
      if (!state) load();
      const mat = state.materials.find((m) => m.id === Number(materialId));
      if (!mat) return;
      mat.qty_on_hand = Number(mat.qty_on_hand) + Number(delta);
      persist();
    }

    function enrichedOrders() {
      if (!state) load();
      return state.orders
        .slice()
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)) || b.id - a.id)
        .map((o) => ({ ...o, ...orderEconomics(o.id) }));
    }

    function createOrder(input) {
      if (!state) load();
      const variant = state.variants.find((v) => v.id === Number(input.variant_id));
      if (!variant) throw new Error("Unknown variant");
      const qty = Math.max(1, parseInt(input.qty, 10) || 1);
      const orderId = nextId(state, "orders");
      state.orders.push({
        id: orderId,
        order_number: String(input.order_number || "").trim(),
        channel: String(input.channel || "Other").trim(),
        customer_label: String(input.customer_label || "").trim(),
        status: "Queued",
        due_date: input.due_date || null,
        notes: String(input.notes || "").trim(),
        created_at: nowIso(),
      });
      const itemId = nextId(state, "order_items");
      state.order_items.push({
        id: itemId,
        order_id: orderId,
        variant_id: variant.id,
        qty,
        unit_price_cents: variant.sell_price_cents,
      });
      for (let i = 0; i < qty; i += 1) {
        state.jobs.push({
          id: nextId(state, "jobs"),
          order_item_id: itemId,
          status: "Queued",
          printer_name: "",
          started_at: null,
          finished_at: null,
          actual_grams: null,
          actual_hours: null,
        });
      }
      persist();
    }

    function board() {
      if (!state) load();
      const columns = {};
      BOARD_STATUSES.forEach((s) => {
        columns[s] = [];
      });
      state.jobs
        .filter((j) => j.status !== "Shipped" && j.status !== "Cancelled")
        .forEach((job) => {
          const bucket = columns[job.status] || (columns[job.status] = []);
          bucket.push(enrichJob(job));
        });
      return { columns, statuses: BOARD_STATUSES };
    }

    function rollOrderStatus(orderId) {
      const itemIds = state.order_items.filter((i) => i.order_id === orderId).map((i) => i.id);
      const statuses = state.jobs.filter((j) => itemIds.includes(j.order_item_id)).map((j) => j.status);
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return;
      for (const candidate of ORDER_STATUSES) {
        if (statuses.includes(candidate)) {
          order.status = candidate;
          break;
        }
      }
    }

    function moveJob(jobId, status) {
      if (!state) load();
      if (!JOB_STATUSES.includes(status)) return;
      const job = state.jobs.find((j) => j.id === Number(jobId));
      if (!job) return;
      const prev = job.status;
      const item = state.order_items.find((i) => i.id === job.order_item_id);
      const variant = item ? state.variants.find((v) => v.id === item.variant_id) : null;
      job.status = status;

      if (status === "Printing" && !job.started_at) {
        job.started_at = nowIso();
      }

      if (status === "Finishing" && prev !== "Finishing" && variant) {
        const grams = job.actual_grams != null ? job.actual_grams : variant.est_grams;
        const waste = parseFloat(getSetting("waste_factor", "0.05"));
        const used = Number(grams) * (1 + waste);
        const mats = state.materials
          .filter((m) => m.kind === "filament" && m.active && m.color.toLowerCase() === variant.color_name.toLowerCase())
          .sort((a, b) => b.qty_on_hand - a.qty_on_hand);
        const mat = mats[0];
        if (mat) {
          mat.qty_on_hand -= used;
          state.material_uses.push({
            id: nextId(state, "material_uses"),
            job_id: job.id,
            material_id: mat.id,
            qty_used: used,
          });
        }
        const hook = state.materials.find((m) => m.kind === "hardware" && m.active);
        if (hook) {
          hook.qty_on_hand -= 1;
          state.material_uses.push({
            id: nextId(state, "material_uses"),
            job_id: job.id,
            material_id: hook.id,
            qty_used: 1,
          });
        }
        job.finished_at = nowIso();
        if (job.actual_grams == null) job.actual_grams = variant.est_grams;
      }

      if (item) rollOrderStatus(item.order_id);
      persist();
    }

    return {
      STORAGE_KEY,
      SEED_VERSION,
      ORDER_STATUSES,
      JOB_STATUSES,
      BOARD_STATUSES,
      money,
      seedState,
      load,
      reset,
      getState,
      getSetting,
      setSettings,
      orderEconomics,
      dashboard,
      productRows,
      activeVariants,
      createProduct,
      createMaterial,
      adjustMaterial,
      enrichedOrders,
      createOrder,
      board,
      moveJob,
    };
  }

  return {
    STORAGE_KEY,
    SEED_VERSION,
    ORDER_STATUSES,
    JOB_STATUSES,
    BOARD_STATUSES,
    money,
    seedState,
    createStore,
  };
});
