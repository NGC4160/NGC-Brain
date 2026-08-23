const assert = require("assert");
const { createStore, SEED_VERSION } = require("../js/store.js");

function memoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
  };
}

const store = createStore(memoryStorage());
store.load();

const dash = store.dashboard();
assert.strictEqual(dash.shop_name, "Blake's Birdhouses");
assert.strictEqual(dash.due.length, 3);
assert.deepStrictEqual(
  dash.due.map((o) => o.customer_label).sort(),
  ["Elliot", "Emmet", "Kayla"]
);
assert.strictEqual(dash.stuck.length, 2);

const kayla = store.orderEconomics(1);
assert.ok(kayla.revenue_cents === 3200);
assert.ok(kayla.margin > 0);

store.createOrder({
  order_number: "BB-TEST",
  channel: "Local",
  customer_label: "Walk-in",
  due_date: "2026-08-20",
  variant_id: 1,
  qty: 1,
  notes: "test",
});
assert.strictEqual(store.enrichedOrders().length, 4);

const before = store.getState().materials.find((m) => m.color === "Olive Drab").qty_on_hand;
const kaylaJob = store.getState().jobs.find((j) => j.id === 1);
store.moveJob(kaylaJob.id, "Printing");
store.moveJob(kaylaJob.id, "Finishing");
const after = store.getState().materials.find((m) => m.color === "Olive Drab").qty_on_hand;
assert.ok(after < before, "filament should deduct on Finishing");
assert.strictEqual(store.getState().orders.find((o) => o.id === 1).status, "Finishing");

store.reset();
assert.strictEqual(store.getState().seed_version, SEED_VERSION);
assert.strictEqual(store.getState().orders.length, 3);

console.log("store tests passed");
