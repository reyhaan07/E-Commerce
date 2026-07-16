const express = require("express");
const router = express.Router();
const { Order, SELLER_STATUSES, DELIVERY_STATUSES } = require("../models/order.model");
const { DeliveryPartner } = require("../models/deliveryPartner.model");
const { Account } = require("../models/account.model");
const { getAuthFromHeader } = require("../middleware/auth");

// 1 loyalty point per 100 rupees spent, same as a lot of real stores do it
const LOYALTY_POINTS_PER_RUPEE = 1 / 100;

async function nextOrderId() {
  const orders = await Order.find({}, "id").lean();
  const maxNum = orders.reduce((max, o) => {
    const num = parseInt(String(o.id).replace("ORD-", ""), 10);
    return Number.isFinite(num) && num > max ? num : max;
  }, 1000);
  return `ORD-${maxNum + 1}`;
}

// GET /api/orders?deliveryPartnerId=&sellerStatus=&deliveryStatus=&userId=
router.get("/", async (req, res) => {
  const { deliveryPartnerId, sellerStatus, deliveryStatus, userId } = req.query;

  // filtering by deliveryPartnerId/sellerStatus/deliveryStatus is used by the
  // admin/seller/delivery apps and stays open like before - but asking for a
  // specific user's orders needs to be that user (or an admin)
  if (userId) {
    const auth = getAuthFromHeader(req);
    if (!auth) {
      return res.status(401).json({ success: false, message: "Missing or invalid Authorization header" });
    }
    if (auth.role !== "admin" && auth.id !== userId) {
      return res.status(403).json({ success: false, message: "You don't have access to this user's orders" });
    }
  }

  const filter = {};
  if (deliveryPartnerId) filter.deliveryPartnerId = deliveryPartnerId;
  if (sellerStatus) filter.sellerStatus = sellerStatus;
  if (deliveryStatus) filter.deliveryStatus = deliveryStatus;
  if (userId) filter.userId = userId;

  const orders = await Order.find(filter);
  res.json({ success: true, orders });
});

// GET /api/orders/:id
router.get("/:id", async (req, res) => {
  const order = await Order.findOne({ id: req.params.id });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  res.json({ success: true, order });
});

// POST /api/orders — used by seed/demo data creation if needed later
router.post("/", async (req, res) => {
  const {
    userId, customerName, customerEmail, customerPhone, customerAddress,
    items, amount, paymentMethod, sellerName, sellerAddress, sellerPhone,
  } = req.body;

  if (!customerName || !amount) {
    return res.status(400).json({ success: false, message: "customerName and amount are required" });
  }
  if (userId) {
    const auth = getAuthFromHeader(req);
    if (!auth) {
      return res.status(401).json({ success: false, message: "Missing or invalid Authorization header" });
    }
    if (auth.role !== "admin" && auth.id !== userId) {
      return res.status(403).json({ success: false, message: "You can't place an order for another user" });
    }
  }

  const order = await Order.create({
    id: await nextOrderId(),
    userId: userId || null,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    items: items || [],
    amount,
    paymentMethod,
    sellerName,
    sellerAddress,
    sellerPhone,
  });

  // give the account some loyalty points and empty out their cart now that
  // the order has gone through
  if (userId) {
    const account = await Account.findOne({ id: userId, role: "user" });
    if (account) {
      account.loyaltyPoints += Math.round(amount * LOYALTY_POINTS_PER_RUPEE);
      account.cart = [];
      await account.save();
    }
  }

  res.status(201).json({ success: true, order });
});

// PATCH /api/orders/:id/seller-status  { sellerStatus }
router.patch("/:id/seller-status", async (req, res) => {
  const { sellerStatus } = req.body;
  if (!SELLER_STATUSES.includes(sellerStatus)) {
    return res.status(400).json({ success: false, message: "Invalid sellerStatus" });
  }

  const order = await Order.findOneAndUpdate({ id: req.params.id }, { sellerStatus }, { new: true });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  res.json({ success: true, order });
});

// PATCH /api/orders/:id/assign  { deliveryPartnerId }
router.patch("/:id/assign", async (req, res) => {
  const { deliveryPartnerId } = req.body;
  const order = await Order.findOne({ id: req.params.id });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  const partner = await DeliveryPartner.findOne({ id: deliveryPartnerId });
  if (!partner) {
    return res.status(400).json({ success: false, message: "Delivery partner not found" });
  }

  order.deliveryPartnerId = partner.id;
  order.deliveryPartnerName = partner.name;
  order.deliveryPartnerPhone = partner.phone;
  order.deliveryStatus = "Assigned";
  order.statusHistory.push({ status: "Assigned", timestamp: new Date() });
  await order.save();

  res.json({ success: true, order });
});

// PATCH /api/orders/:id/delivery-status  { deliveryStatus }
router.patch("/:id/delivery-status", async (req, res) => {
  const { deliveryStatus } = req.body;
  if (!DELIVERY_STATUSES.includes(deliveryStatus)) {
    return res.status(400).json({ success: false, message: "Invalid deliveryStatus" });
  }

  const order = await Order.findOne({ id: req.params.id });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  order.deliveryStatus = deliveryStatus;
  order.statusHistory.push({ status: deliveryStatus, timestamp: new Date() });
  await order.save();

  res.json({ success: true, order });
});

module.exports = router;
