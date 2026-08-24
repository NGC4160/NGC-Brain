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

const {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  backupFilename,
  validateBackup,
} = require("../js/store.js");

const backupStore = createStore(memoryStorage());
backupStore.load();
assert.strictEqual(backupStore.isDirtySinceBackup(), false);
assert.strictEqual(backupStore.getLastBackupAt(), null);
assert.strictEqual(backupStore.shouldShowDeviceNote(), true);

backupStore.createOrder({
  order_number: "BB-BACKUP",
  channel: "Local",
  customer_label: "Walk-in",
  due_date: "2026-08-21",
  variant_id: 1,
  qty: 1,
  notes: "backup test",
});
assert.strictEqual(backupStore.isDirtySinceBackup(), true);
assert.strictEqual(backupStore.enrichedOrders().length, 4);

const snapshot = backupStore.exportBackup();
assert.strictEqual(snapshot.format, BACKUP_FORMAT);
assert.strictEqual(snapshot.format_version, BACKUP_VERSION);
assert.strictEqual(snapshot.seed_version, SEED_VERSION);
assert.ok(snapshot.exported_at);
assert.strictEqual(snapshot.shop.orders.length, 4);
assert.ok(Array.isArray(snapshot.shop.jobs));
assert.ok(Array.isArray(snapshot.shop.material_uses));
assert.ok(snapshot.shop.settings.shop_name);
assert.ok(String(backupFilename()).startsWith("blakes-birdhouses-backup-"));
assert.ok(backupFilename().endsWith(".json"));

const other = createStore(memoryStorage());
other.load();
assert.strictEqual(other.getState().orders.length, 3);

const restored = other.replaceFromBackup(JSON.stringify(snapshot));
assert.strictEqual(restored.ok, true);
assert.strictEqual(other.getState().orders.length, 4);
assert.strictEqual(other.getState().orders.some((o) => o.order_number === "BB-BACKUP"), true);
assert.strictEqual(other.isDirtySinceBackup(), false);
assert.ok(other.getLastBackupAt());
assert.strictEqual(restored.summary.orders, 4);
assert.deepStrictEqual(
  other.getState().orders.map((o) => o.customer_label).sort(),
  ["Elliot", "Emmet", "Kayla", "Walk-in"]
);

const beforeBad = other.getState();
const badCases = [
  "{not-json",
  JSON.stringify({ hello: "world" }),
  JSON.stringify({ format: BACKUP_FORMAT, format_version: 99, shop: snapshot.shop }),
  JSON.stringify({ format: BACKUP_FORMAT, format_version: BACKUP_VERSION, shop: { seed_version: SEED_VERSION } }),
  JSON.stringify({
    format: BACKUP_FORMAT,
    format_version: BACKUP_VERSION,
    shop: { ...snapshot.shop, orders: "nope" },
  }),
  JSON.stringify({
    format: BACKUP_FORMAT,
    format_version: BACKUP_VERSION,
    shop: { ...snapshot.shop, jobs: [null] },
  }),
];
badCases.forEach((payload) => {
  const result = other.replaceFromBackup(payload);
  assert.strictEqual(result.ok, false, "bad backup should be rejected");
  assert.ok(result.error && result.error.includes("Nothing on this device was changed."));
  assert.strictEqual(other.getState().orders.length, beforeBad.orders.length);
});

const rawStateOk = validateBackup(snapshot.shop);
assert.strictEqual(rawStateOk.ok, true);

const emptyOk = validateBackup("");
assert.strictEqual(emptyOk.ok, false);

backupStore.markBackupSaved();
assert.strictEqual(backupStore.isDirtySinceBackup(), false);
assert.ok(backupStore.getLastBackupAt());
backupStore.dismissDeviceNote();
assert.strictEqual(backupStore.shouldShowDeviceNote(), false);

const repaired = createStore(memoryStorage());
repaired.load();
const lowIds = JSON.parse(JSON.stringify(snapshot.shop));
lowIds.nextIds = { products: 1, variants: 1, materials: 1, orders: 1, order_items: 1, jobs: 1, material_uses: 1 };
const repairedResult = repaired.replaceFromBackup({
  format: BACKUP_FORMAT,
  format_version: BACKUP_VERSION,
  exported_at: snapshot.exported_at,
  seed_version: SEED_VERSION,
  shop: lowIds,
});
assert.strictEqual(repairedResult.ok, true);
assert.ok(repaired.getState().nextIds.orders > 4);

const rawImport = createStore(memoryStorage());
rawImport.load();
assert.strictEqual(rawImport.replaceFromBackup(snapshot.shop).ok, true);
assert.strictEqual(rawImport.getState().orders.length, 4);

console.log("store tests passed");
