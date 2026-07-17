const express = require("express");
const router = express.Router();
const { Account } = require("../models/account.model");
const { requireAuth, requireSelfOrAdmin } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const { emitToRole } = require("../realtime");

const PINCODE_RE = /^\d{6}$/;
const LAST4_RE = /^\d{4}$/;
const URL_RE = /^https?:\/\/\S+$/i;
const AVATAR_DATA_URL_RE = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_AVATAR_LENGTH = 1500000;

// every route below is /:id or /:id/... so the same two checks apply
// everywhere: must be logged in, and must be looking at your own account
// (or be an admin)
const protect = [requireAuth, requireSelfOrAdmin("id")];

async function findUser(req, res) {
  const account = await Account.findOne({ id: req.params.id, role: "user" });
  if (!account) {
    res.status(404).json({ success: false, message: "User not found" });
    return null;
  }
  return account;
}

function isBlank(value) {
  return typeof value !== "string" || value.trim() === "";
}

function optionalString(value, maxLength) {
  return value === undefined || (typeof value === "string" && value.length <= maxLength);
}

function isValidAvatar(value) {
  return value === "" || (typeof value === "string" && value.length <= MAX_AVATAR_LENGTH && (URL_RE.test(value) || AVATAR_DATA_URL_RE.test(value)));
}

// GET /api/users/:id
router.get("/:id", ...protect, asyncHandler(async (req, res) => {
  const account = await findUser(req, res);
  if (!account) return;
  res.json({ success: true, user: account });
}));

// PUT /api/users/:id  { name, phone, avatar, deliveryInstructions, notifyByEmail, notifyBySms }
router.put("/:id", ...protect, asyncHandler(async (req, res) => {
  const account = await findUser(req, res);
  if (!account) return;

  const { name, phone, avatar, deliveryInstructions, notifyByEmail, notifyBySms } = req.body;
  if (name !== undefined && isBlank(name)) {
    return res.status(400).json({ success: false, message: "name cannot be blank" });
  }
  if (!optionalString(phone, 20)) {
    return res.status(400).json({ success: false, message: "phone must be text under 20 characters" });
  }
  if (avatar !== undefined && !isValidAvatar(avatar)) {
    return res.status(400).json({ success: false, message: "avatar must be a valid image URL or uploaded PNG/JPEG/WebP image under 1.5MB" });
  }
  if (!optionalString(deliveryInstructions, 500)) {
    return res.status(400).json({ success: false, message: "deliveryInstructions must be text under 500 characters" });
  }
  if (notifyByEmail !== undefined && typeof notifyByEmail !== "boolean") {
    return res.status(400).json({ success: false, message: "notifyByEmail must be boolean" });
  }
  if (notifyBySms !== undefined && typeof notifyBySms !== "boolean") {
    return res.status(400).json({ success: false, message: "notifyBySms must be boolean" });
  }

  if (name !== undefined) account.name = name;
  if (phone !== undefined) account.phone = phone;
  if (avatar !== undefined) account.avatar = avatar;
  if (deliveryInstructions !== undefined) account.deliveryInstructions = deliveryInstructions;
  if (notifyByEmail !== undefined) account.notifyByEmail = notifyByEmail;
  if (notifyBySms !== undefined) account.notifyBySms = notifyBySms;
  await account.save();

  res.json({ success: true, user: account });
}));

// PUT /api/users/:id/avatar  { avatar }
router.put("/:id/avatar", ...protect, asyncHandler(async (req, res) => {
  const account = await findUser(req, res);
  if (!account) return;

  const { avatar } = req.body;
  if (!isValidAvatar(avatar)) {
    return res.status(400).json({ success: false, message: "avatar must be a valid image URL or uploaded PNG/JPEG/WebP image under 1.5MB" });
  }

  account.avatar = avatar;
  await account.save();

  res.json({ success: true, user: account });
}));

// GET /api/users/:id/addresses
router.get("/:id/addresses", ...protect, asyncHandler(async (req, res) => {
  const account = await findUser(req, res);
  if (!account) return;
  res.json({ success: true, addresses: account.addresses });
}));

// POST /api/users/:id/addresses  { label, line1, line2, city, state, pincode, phone, isDefault }
router.post("/:id/addresses", ...protect, asyncHandler(async (req, res) => {
  const account = await findUser(req, res);
  if (!account) return;

  const { label, line1, line2, city, state, pincode, phone, isDefault } = req.body;
  if (isBlank(line1) || isBlank(city) || isBlank(state) || isBlank(pincode)) {
    return res.status(400).json({ success: false, message: "line1, city, state and pincode are required" });
  }
  if (!PINCODE_RE.test(pincode)) {
    return res.status(400).json({ success: false, message: "pincode must be 6 digits" });
  }

  if (isDefault) {
    account.addresses.forEach((a) => (a.isDefault = false));
  }
  account.addresses.push({ label, line1, line2, city, state, pincode, phone, isDefault });
  await account.save();

  res.status(201).json({ success: true, addresses: account.addresses });
}));

// PUT /api/users/:id/addresses/:addressId
router.put("/:id/addresses/:addressId", ...protect, asyncHandler(async (req, res) => {
  const account = await findUser(req, res);
  if (!account) return;

  const address = account.addresses.id(req.params.addressId);
  if (!address) {
    return res.status(404).json({ success: false, message: "Address not found" });
  }

  const { label, line1, line2, city, state, pincode, phone, isDefault } = req.body;
  if (line1 !== undefined && isBlank(line1)) {
    return res.status(400).json({ success: false, message: "line1 cannot be blank" });
  }
  if (city !== undefined && isBlank(city)) {
    return res.status(400).json({ success: false, message: "city cannot be blank" });
  }
  if (state !== undefined && isBlank(state)) {
    return res.status(400).json({ success: false, message: "state cannot be blank" });
  }
  if (pincode !== undefined) {
    if (isBlank(pincode)) {
      return res.status(400).json({ success: false, message: "pincode cannot be blank" });
    }
    if (!PINCODE_RE.test(pincode)) {
      return res.status(400).json({ success: false, message: "pincode must be 6 digits" });
    }
  }

  if (label !== undefined) address.label = label;
  if (line1 !== undefined) address.line1 = line1;
  if (line2 !== undefined) address.line2 = line2;
  if (city !== undefined) address.city = city;
  if (state !== undefined) address.state = state;
  if (pincode !== undefined) address.pincode = pincode;
  if (phone !== undefined) address.phone = phone;
  if (isDefault) {
    account.addresses.forEach((a) => (a.isDefault = false));
    address.isDefault = true;
  }
  await account.save();

  res.json({ success: true, addresses: account.addresses });
}));

// DELETE /api/users/:id/addresses/:addressId
router.delete("/:id/addresses/:addressId", ...protect, asyncHandler(async (req, res) => {
  const account = await findUser(req, res);
  if (!account) return;

  account.addresses.pull(req.params.addressId);
  await account.save();

  res.json({ success: true, addresses: account.addresses });
}));

// GET /api/users/:id/payment-methods
router.get("/:id/payment-methods", ...protect, asyncHandler(async (req, res) => {
  const account = await findUser(req, res);
  if (!account) return;
  res.json({ success: true, paymentMethods: account.paymentMethods });
}));

// POST /api/users/:id/payment-methods  { type, label, last4, upiId, isDefault }
// Mock/tokenized only - full card numbers are never accepted or stored.
router.post("/:id/payment-methods", ...protect, asyncHandler(async (req, res) => {
  const account = await findUser(req, res);
  if (!account) return;

  const { type, label, last4, upiId, isDefault, cardNumber, cvv } = req.body;
  if (cardNumber !== undefined || cvv !== undefined) {
    return res.status(400).json({ success: false, message: "Full card numbers and CVV are not accepted" });
  }
  if (type !== "card" && type !== "upi") {
    return res.status(400).json({ success: false, message: "type must be 'card' or 'upi'" });
  }
  if (type === "card" && !LAST4_RE.test(last4 || "")) {
    return res.status(400).json({ success: false, message: "last4 must be exactly 4 digits" });
  }
  if (type === "upi" && isBlank(upiId)) {
    return res.status(400).json({ success: false, message: "upiId is required" });
  }
  if (type === "card" && upiId) {
    return res.status(400).json({ success: false, message: "upiId is only accepted for UPI methods" });
  }
  if (type === "upi" && last4) {
    return res.status(400).json({ success: false, message: "last4 is only accepted for card methods" });
  }

  if (isDefault) {
    account.paymentMethods.forEach((p) => (p.isDefault = false));
  }
  account.paymentMethods.push({ type, label, last4, upiId, isDefault });
  await account.save();

  res.status(201).json({ success: true, paymentMethods: account.paymentMethods });
}));

// PUT /api/users/:id/payment-methods/:paymentId  { label, isDefault }
router.put("/:id/payment-methods/:paymentId", ...protect, asyncHandler(async (req, res) => {
  const account = await findUser(req, res);
  if (!account) return;

  const paymentMethod = account.paymentMethods.id(req.params.paymentId);
  if (!paymentMethod) {
    return res.status(404).json({ success: false, message: "Payment method not found" });
  }

  const { label, isDefault } = req.body;
  if (label !== undefined && typeof label !== "string") {
    return res.status(400).json({ success: false, message: "label must be text" });
  }
  if (isDefault !== undefined && typeof isDefault !== "boolean") {
    return res.status(400).json({ success: false, message: "isDefault must be boolean" });
  }

  if (label !== undefined) paymentMethod.label = label;
  if (isDefault) {
    account.paymentMethods.forEach((p) => (p.isDefault = false));
    paymentMethod.isDefault = true;
  }
  await account.save();

  res.json({ success: true, paymentMethods: account.paymentMethods });
}));

// DELETE /api/users/:id/payment-methods/:paymentId
router.delete("/:id/payment-methods/:paymentId", ...protect, asyncHandler(async (req, res) => {
  const account = await findUser(req, res);
  if (!account) return;

  account.paymentMethods.pull(req.params.paymentId);
  await account.save();

  res.json({ success: true, paymentMethods: account.paymentMethods });
}));

// GET /api/users/:id/cart
router.get("/:id/cart", ...protect, asyncHandler(async (req, res) => {
  const account = await findUser(req, res);
  if (!account) return;
  res.json({ success: true, cart: account.cart });
}));

// PUT /api/users/:id/cart  { items: [{ productId, name, price, image, qty }] }
// Replaces the whole cart in one go - simplest way to keep it in sync with
// whatever the frontend has in local state.
router.put("/:id/cart", ...protect, asyncHandler(async (req, res) => {
  const account = await findUser(req, res);
  if (!account) return;

  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, message: "items must be an array" });
  }
  for (const item of items) {
    if (!item.productId || Number(item.qty) < 1) {
      return res.status(400).json({ success: false, message: "Each cart item needs productId and qty >= 1" });
    }
  }
  account.cart = items.map((item) => ({
    productId: String(item.productId),
    name: item.name,
    price: Number(item.price) || 0,
    image: item.image,
    qty: Math.floor(Number(item.qty)),
  }));
  await account.save();

  // Feature 5: the admin dashboard shows a live count of active carts
  const activeCarts = await Account.countDocuments({ role: "user", "cart.0": { $exists: true } });
  emitToRole("admin", "cart-activity", { activeCarts });

  res.json({ success: true, cart: account.cart });
}));

// GET /api/users/:id/wishlist
router.get("/:id/wishlist", ...protect, asyncHandler(async (req, res) => {
  const account = await findUser(req, res);
  if (!account) return;
  res.json({ success: true, wishlist: account.wishlist });
}));

// POST /api/users/:id/wishlist  { productId, name, price, image }
router.post("/:id/wishlist", ...protect, asyncHandler(async (req, res) => {
  const account = await findUser(req, res);
  if (!account) return;

  const { productId, name, price, image } = req.body;
  if (!productId) {
    return res.status(400).json({ success: false, message: "productId is required" });
  }
  const alreadySaved = account.wishlist.some((w) => w.productId === String(productId));
  if (!alreadySaved) {
    account.wishlist.push({ productId: String(productId), name, price, image });
    await account.save();
  }

  res.status(201).json({ success: true, wishlist: account.wishlist });
}));

// DELETE /api/users/:id/wishlist/:productId
router.delete("/:id/wishlist/:productId", ...protect, asyncHandler(async (req, res) => {
  const account = await findUser(req, res);
  if (!account) return;

  account.wishlist = account.wishlist.filter((w) => w.productId !== req.params.productId);
  await account.save();

  res.json({ success: true, wishlist: account.wishlist });
}));

// GET /api/users/:id/reviews
router.get("/:id/reviews", ...protect, asyncHandler(async (req, res) => {
  const account = await findUser(req, res);
  if (!account) return;
  res.json({ success: true, reviews: account.reviews });
}));

// POST /api/users/:id/reviews  { productId, productName, rating, comment }
router.post("/:id/reviews", ...protect, asyncHandler(async (req, res) => {
  const account = await findUser(req, res);
  if (!account) return;

  const { productId, productName, rating, comment } = req.body;
  const numericRating = Number(rating);
  if (!productId || !Number.isFinite(numericRating)) {
    return res.status(400).json({ success: false, message: "productId and rating are required" });
  }
  if (numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ success: false, message: "rating must be between 1 and 5" });
  }
  if (comment !== undefined && typeof comment !== "string") {
    return res.status(400).json({ success: false, message: "comment must be text" });
  }

  account.reviews.push({ productId: String(productId), productName, rating: numericRating, comment });
  await account.save();

  res.status(201).json({ success: true, reviews: account.reviews });
}));

module.exports = router;
