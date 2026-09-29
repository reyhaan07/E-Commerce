// Delivery coverage (gate 2): the catchments that decide which delivery
// partners can serve which seller warehouse. Previously only editable by
// changing data/pincodes.js and restarting the server.
//
// Reads are open to any signed-in admin; writes change who can deliver where,
// so they follow the same admin-only rule as the rest of delivery operations.

const express = require("express");
const router = express.Router();
const { PincodeCluster } = require("../models/pincodeCluster.model");
const { DeliveryPartner } = require("../models/deliveryPartner.model");
const { Account } = require("../models/account.model");
const { requireAuth, requireRole, requireActiveAccount } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const { refreshCoverage, getNearbyPincodes } = require("../utils/coverage");
const { nextId } = require("../utils/sequence");

const PINCODE_RE = /^\d{6}$/;

router.use(requireAuth, requireRole("admin"));

// Validates + de-duplicates a PIN list from the request body.
function cleanPins(list, field) {
  if (list === undefined) return { pins: undefined };
  if (!Array.isArray(list)) return { error: `${field} must be an array` };
  const pins = [...new Set(list.map((p) => String(p).trim()))].filter(Boolean);
  const bad = pins.find((p) => !PINCODE_RE.test(p));
  if (bad) return { error: `"${bad}" is not a valid 6-digit PIN code` };
  if (pins.length > 200) return { error: `${field} cannot hold more than 200 PIN codes` };
  return { pins };
}

// GET /api/coverage — every catchment, decorated with how many delivery
// partners and seller warehouses currently sit inside it, so an admin can see
// which zones actually have capacity.
router.get("/", asyncHandler(async (req, res) => {
  const [clusters, partners, sellers] = await Promise.all([
    PincodeCluster.find().sort({ city: 1 }),
    DeliveryPartner.find({}, "id name pincode status accountStatus").lean(),
    Account.find({ role: "seller" }, "id name warehousePincode").lean(),
  ]);

  const decorated = clusters.map((c) => {
    const pins = new Set(c.near || []);
    const inZone = partners.filter((p) => pins.has(String(p.pincode || "").trim()));
    return {
      ...c.toJSON(),
      partnerCount: inZone.length,
      availablePartnerCount: inZone.filter(
        (p) => p.status === "Active" && (p.accountStatus || "active") === "active"
      ).length,
      sellerCount: sellers.filter((s) => pins.has(String(s.warehousePincode || "").trim())).length,
    };
  });

  // PINs that partners sit on but no catchment covers — those partners can
  // never be matched to anything, which is otherwise invisible.
  const covered = new Set(clusters.flatMap((c) => c.near || []));
  const orphanPartners = partners
    .filter((p) => p.pincode && !covered.has(String(p.pincode).trim()))
    .map((p) => ({ id: p.id, name: p.name, pincode: p.pincode }));

  res.json({ success: true, clusters: decorated, orphanPartners });
}));

// POST /api/coverage  { city, hub, near[], outliers[] }
router.post("/", requireActiveAccount, asyncHandler(async (req, res) => {
  const { city, hub } = req.body;
  if (typeof city !== "string" || !city.trim()) {
    return res.status(400).json({ success: false, message: "city is required" });
  }
  const hubPin = String(hub || "").trim();
  if (!PINCODE_RE.test(hubPin)) {
    return res.status(400).json({ success: false, message: "hub must be a 6-digit PIN code" });
  }
  const near = cleanPins(req.body.near, "near");
  if (near.error) return res.status(400).json({ success: false, message: near.error });
  const outliers = cleanPins(req.body.outliers, "outliers");
  if (outliers.error) return res.status(400).json({ success: false, message: outliers.error });

  // The hub always belongs to its own catchment, otherwise a seller sitting on
  // the hub PIN would match no partners.
  const nearPins = [...new Set([hubPin, ...(near.pins || [])])];

  const cluster = await PincodeCluster.create({
    id: await nextId("pincodeCluster", PincodeCluster, "zone-"),
    city: city.trim(),
    hub: hubPin,
    near: nearPins,
    outliers: outliers.pins || [],
  });
  await refreshCoverage();
  res.status(201).json({ success: true, cluster });
}));

// PATCH /api/coverage/:id  { city?, hub?, near?, outliers? }
router.patch("/:id", requireActiveAccount, asyncHandler(async (req, res) => {
  const cluster = await PincodeCluster.findOne({ id: req.params.id });
  if (!cluster) {
    return res.status(404).json({ success: false, message: "Coverage zone not found" });
  }

  if (req.body.city !== undefined) {
    if (typeof req.body.city !== "string" || !req.body.city.trim()) {
      return res.status(400).json({ success: false, message: "city cannot be blank" });
    }
    cluster.city = req.body.city.trim();
  }
  if (req.body.hub !== undefined) {
    const hubPin = String(req.body.hub).trim();
    if (!PINCODE_RE.test(hubPin)) {
      return res.status(400).json({ success: false, message: "hub must be a 6-digit PIN code" });
    }
    cluster.hub = hubPin;
  }
  const near = cleanPins(req.body.near, "near");
  if (near.error) return res.status(400).json({ success: false, message: near.error });
  if (near.pins) cluster.near = near.pins;
  const outliers = cleanPins(req.body.outliers, "outliers");
  if (outliers.error) return res.status(400).json({ success: false, message: outliers.error });
  if (outliers.pins) cluster.outliers = outliers.pins;

  if (!cluster.near.includes(cluster.hub)) cluster.near.push(cluster.hub);
  cluster.updatedAt = new Date();
  await cluster.save();
  await refreshCoverage();

  res.json({ success: true, cluster });
}));

// DELETE /api/coverage/:id — removing a zone un-matches every partner in it,
// so it is refused while sellers still dispatch from one of its PINs.
router.delete("/:id", requireActiveAccount, asyncHandler(async (req, res) => {
  const cluster = await PincodeCluster.findOne({ id: req.params.id });
  if (!cluster) {
    return res.status(404).json({ success: false, message: "Coverage zone not found" });
  }

  const pins = cluster.near || [];
  const sellersInZone = await Account.countDocuments({ role: "seller", warehousePincode: { $in: pins } });
  if (sellersInZone > 0) {
    return res.status(400).json({
      success: false,
      message: `${sellersInZone} seller${sellersInZone > 1 ? "s" : ""} dispatch from this zone. Move their warehouse PIN first, or edit the zone instead of deleting it.`,
    });
  }

  await cluster.deleteOne();
  await refreshCoverage();
  res.json({ success: true });
}));

// GET /api/coverage/preview?warehousePincode=500001 — which partners a given
// warehouse can currently reach. Lets an admin check the effect of a change
// without opening an order.
router.get("/preview", asyncHandler(async (req, res) => {
  const warehousePincode = String(req.query.warehousePincode || "").trim();
  if (!PINCODE_RE.test(warehousePincode)) {
    return res.status(400).json({ success: false, message: "warehousePincode must be a 6-digit PIN code" });
  }
  const nearby = getNearbyPincodes(warehousePincode);
  const partners = await DeliveryPartner.find({ pincode: { $in: nearby } }, "id name pincode status accountStatus").lean();
  res.json({
    success: true,
    warehousePincode,
    nearby,
    partners: partners.filter((p) => (p.accountStatus || "active") === "active"),
  });
}));

module.exports = router;
