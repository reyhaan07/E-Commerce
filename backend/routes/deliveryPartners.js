const express = require("express");
const router = express.Router();
const { store, persist, nextPartnerId } = require("../data/store");
const { createDeliveryPartner } = require("../models/deliveryPartner.model");

// GET /api/delivery-partners
router.get("/", (req, res) => {
  // Never send passwords to the frontend
  const partners = store.deliveryPartners.map(({ password, ...rest }) => rest);
  res.json({ success: true, deliveryPartners: partners });
});

// POST /api/delivery-partners  { name, email, password, phone, vehicle }
router.post("/", (req, res) => {
  const { name, email, password, phone, vehicle } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "name, email and password are required" });
  }
  if (store.deliveryPartners.some((p) => p.email === email)) {
    return res.status(400).json({ success: false, message: "A delivery partner with this email already exists" });
  }

  const partner = createDeliveryPartner({
    id: nextPartnerId(),
    name,
    email,
    password,
    phone,
    vehicle,
  });

  store.deliveryPartners.push(partner);
  persist();

  const { password: _pw, ...safePartner } = partner;
  res.status(201).json({ success: true, deliveryPartner: safePartner });
});

// PUT /api/delivery-partners/:id  { name, phone, vehicle, status }
router.put("/:id", (req, res) => {
  const partner = store.deliveryPartners.find((p) => p.id === req.params.id);
  if (!partner) {
    return res.status(404).json({ success: false, message: "Delivery partner not found" });
  }

  const { name, phone, vehicle, status } = req.body;
  if (name !== undefined) partner.name = name;
  if (phone !== undefined) partner.phone = phone;
  if (vehicle !== undefined) partner.vehicle = vehicle;
  if (status !== undefined) partner.status = status;

  // Keep denormalized name/phone on any orders currently assigned to this partner in sync
  store.orders.forEach((order) => {
    if (order.deliveryPartnerId === partner.id) {
      order.deliveryPartnerName = partner.name;
      order.deliveryPartnerPhone = partner.phone;
    }
  });

  persist();
  const { password: _pw, ...safePartner } = partner;
  res.json({ success: true, deliveryPartner: safePartner });
});

// DELETE /api/delivery-partners/:id
router.delete("/:id", (req, res) => {
  const index = store.deliveryPartners.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: "Delivery partner not found" });
  }

  const [removed] = store.deliveryPartners.splice(index, 1);

  // Un-assign this partner from any orders rather than leaving dangling references
  store.orders.forEach((order) => {
    if (order.deliveryPartnerId === removed.id) {
      order.deliveryPartnerId = null;
      order.deliveryPartnerName = null;
      order.deliveryPartnerPhone = null;
      order.deliveryStatus = null;
    }
  });

  persist();
  res.json({ success: true });
});

module.exports = router;
