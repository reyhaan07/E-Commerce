// Tiny in-memory data store for Orders + Delivery Partners, persisted to a
// JSON file so demo data survives a server restart. No database needed —
// this is intentionally simple for a beginner-friendly codebase.

const fs = require("fs");
const path = require("path");
const seed = require("./seed");

const DB_PATH = path.join(__dirname, "db.json");

function load() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.orders) && Array.isArray(data.deliveryPartners)) {
        return data;
      }
    } catch (err) {
      console.warn("Could not read db.json, falling back to seed data:", err.message);
    }
  }
  return {
    orders: JSON.parse(JSON.stringify(seed.orders)),
    deliveryPartners: JSON.parse(JSON.stringify(seed.deliveryPartners)),
  };
}

const data = load();

const store = {
  orders: data.orders,
  deliveryPartners: data.deliveryPartners,
};

function persist() {
  fs.writeFileSync(
    DB_PATH,
    JSON.stringify({ orders: store.orders, deliveryPartners: store.deliveryPartners }, null, 2)
  );
}

function nextOrderId() {
  const maxNum = store.orders.reduce((max, o) => {
    const num = parseInt(String(o.id).replace("ORD-", ""), 10);
    return Number.isFinite(num) && num > max ? num : max;
  }, 1000);
  return `ORD-${maxNum + 1}`;
}

function nextPartnerId() {
  const maxNum = store.deliveryPartners.reduce((max, p) => {
    const num = parseInt(String(p.id).replace("partner-", ""), 10);
    return Number.isFinite(num) && num > max ? num : max;
  }, 0);
  return `partner-${maxNum + 1}`;
}

// Write the loaded/seeded data back out immediately so db.json always exists
// after the first boot (useful for first-run and for inspecting demo state).
persist();

module.exports = { store, persist, nextOrderId, nextPartnerId };
