// Pure payroll helpers (Feature 5), kept DB-free so the salary math can be
// reasoned about and unit-tested on its own.

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function currentPeriod() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

// [start, end) UTC bounds for a "YYYY-MM" period
function periodBounds(period) {
  const [year, month] = period.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

// when an order reached "Delivered" — the last such statusHistory entry,
// falling back to the order's created date if history is missing
function deliveredAt(order) {
  const hops = (order.statusHistory || []).filter((h) => h.status === "Delivered");
  if (hops.length) return new Date(hops[hops.length - 1].timestamp);
  return new Date(order.createdAt);
}

// { partnerId: deliveriesCount } for orders delivered within the period
function countDeliveries(orders, period) {
  const { start, end } = periodBounds(period);
  const counts = {};
  for (const order of orders) {
    if (order.deliveryStatus !== "Delivered" || !order.deliveryPartnerId) continue;
    const when = deliveredAt(order);
    if (when >= start && when < end) {
      counts[order.deliveryPartnerId] = (counts[order.deliveryPartnerId] || 0) + 1;
    }
  }
  return counts;
}

function computeNetPay({ baseSalary, deliveriesCount, incentivePerDelivery, deductions }) {
  const incentiveTotal = deliveriesCount * incentivePerDelivery;
  return { incentiveTotal, netPay: baseSalary + incentiveTotal - deductions };
}

module.exports = { PERIOD_RE, currentPeriod, periodBounds, deliveredAt, countDeliveries, computeNetPay };
