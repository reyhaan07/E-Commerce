// Plain factory function describing the shape of an Order record.
// No ORM/schema-validation library is used — the store is in-memory/JSON,
// so this just documents and centralizes how a new order is built.

function createOrder({ id, customerName, customerEmail, items, amount, sellerName }) {
  return {
    id,
    customerName,
    customerEmail,
    items,
    amount,
    createdAt: new Date().toISOString(),
    sellerName: sellerName || "ShopSphere Store",
    // Seller-facing lifecycle (set by the Seller app)
    sellerStatus: "Processing",
    // Delivery-facing lifecycle (set by Admin assignment + Delivery Partner app)
    deliveryStatus: null,
    deliveryPartnerId: null,
    deliveryPartnerName: null,
    deliveryPartnerPhone: null,
    statusHistory: [],
  };
}

const SELLER_STATUSES = [
  "Processing",
  "Ready For Dispatch",
  "Shipped",
  "Delivered",
  "Returned",
  "Cancelled",
];

const DELIVERY_STATUSES = [
  "Assigned",
  "Accepted",
  "Picked Up",
  "In Transit",
  "Out For Delivery",
  "Delivered",
];

module.exports = { createOrder, SELLER_STATUSES, DELIVERY_STATUSES };
