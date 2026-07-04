const express = require("express");
const router = express.Router();
const { store, persist, nextOrderId } = require("../data/store");
const { createOrder, SELLER_STATUSES, DELIVERY_STATUSES } = require("../models/order.model");

// GET /api/orders?deliveryPartnerId=&sellerStatus=&deliveryStatus=
router.get("/", (req, res) => {
  const { deliveryPartnerId, sellerStatus, deliveryStatus } = req.query;

  let results = store.orders;

  if (deliveryPartnerId) {
    results = results.filter((o) => o.deliveryPartnerId === deliveryPartnerId);
  }
  if (sellerStatus) {
    results = results.filter((o) => o.sellerStatus === sellerStatus);
  }
  if (deliveryStatus) {
    results = results.filter((o) => o.deliveryStatus === deliveryStatus);
  }

  res.json({ success: true, orders: results });
});

// GET /api/orders/:id
router.get("/:id", (req, res) => {
  const order = store.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  res.json({ success: true, order });
});

// POST /api/orders — used by seed/demo data creation if needed later
router.post("/", (req, res) => {
  const { customerName, customerEmail, items, amount, sellerName } = req.body;

  if (!customerName || !amount) {
    return res.status(400).json({ success: false, message: "customerName and amount are required" });
  }

  const order = createOrder({
    id: nextOrderId(),
    customerName,
    customerEmail,
    items: items || [],
    amount,
    sellerName,
  });

  store.orders.push(order);
  persist();
  res.status(201).json({ success: true, order });
});

// PATCH /api/orders/:id/seller-status  { sellerStatus }
router.patch("/:id/seller-status", (req, res) => {
  const { sellerStatus } = req.body;
  const order = store.orders.find((o) => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (!SELLER_STATUSES.includes(sellerStatus)) {
    return res.status(400).json({ success: false, message: "Invalid sellerStatus" });
  }

  order.sellerStatus = sellerStatus;
  persist();
  res.json({ success: true, order });
});

// PATCH /api/orders/:id/assign  { deliveryPartnerId }
router.patch("/:id/assign", (req, res) => {
  const { deliveryPartnerId } = req.body;
  const order = store.orders.find((o) => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  const partner = store.deliveryPartners.find((p) => p.id === deliveryPartnerId);
  if (!partner) {
    return res.status(400).json({ success: false, message: "Delivery partner not found" });
  }

  order.deliveryPartnerId = partner.id;
  order.deliveryPartnerName = partner.name;
  order.deliveryPartnerPhone = partner.phone;
  order.deliveryStatus = "Assigned";
  order.statusHistory.push({ status: "Assigned", timestamp: new Date().toISOString() });

  persist();
  res.json({ success: true, order });
});

// PATCH /api/orders/:id/delivery-status  { deliveryStatus }
router.patch("/:id/delivery-status", (req, res) => {
  const { deliveryStatus } = req.body;
  const order = store.orders.find((o) => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (!DELIVERY_STATUSES.includes(deliveryStatus)) {
    return res.status(400).json({ success: false, message: "Invalid deliveryStatus" });
  }

  order.deliveryStatus = deliveryStatus;
  order.statusHistory.push({ status: deliveryStatus, timestamp: new Date().toISOString() });

  persist();
  res.json({ success: true, order });
});

module.exports = router;
