// Razorpay test-mode payment flow (Feature 7 steps 3-4):
//   POST /api/payments/create-order  → Razorpay order id for the checkout
//   POST /api/payments/mock-pay      → stands in for the Razorpay checkout
//                                      popup when no test keys are configured
// Verification of the payment signature happens in POST /api/orders, before
// the ShopSphere order is created.

const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { requireAuth, requireActiveAccount } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const razorpay = require("../utils/razorpay");
const { priceCart } = require("../utils/pricing");
const { PaymentIntent } = require("../models/paymentIntent.model");

// GET /api/payments/config
// Lets the checkout page know whether online payment can be offered at all,
// so it can show Cash on Delivery as the only working method rather than
// letting someone pick a card and fail at the last step.
router.get("/config", asyncHandler(async (req, res) => {
  res.json({
    success: true,
    onlinePaymentEnabled: razorpay.onlinePaymentEnabled,
    provider: "Razorpay",
    mode: razorpay.isConfigured ? "test-keys" : (razorpay.allowMock ? "mock" : "disabled"),
  });
}));

// Guards every online-payment route while Razorpay has no credentials.
function requireOnlinePayments(req, res, next) {
  if (!razorpay.onlinePaymentEnabled) {
    return res.status(400).json({
      success: false,
      message: "Online payment isn't available yet. Please choose Cash on Delivery.",
    });
  }
  next();
}

// POST /api/payments/create-order  { items: [{ productId, qty }] }
// The amount is priced here from the catalog, never taken from the browser —
// it used to accept `amount` directly, so a crafted request could create a ₹1
// Razorpay order and then place a full cart against it (the signature binds
// order_id|payment_id, never the amount). The figure is recorded as a
// PaymentIntent so order creation can check the customer paid the order total.
router.post("/create-order", requireAuth, requireActiveAccount, requireOnlinePayments, asyncHandler(async (req, res) => {
  const priced = await priceCart(req.body.items);
  if (!priced.ok) {
    return res.status(400).json({ success: false, message: priced.message });
  }

  const receipt = `rcpt_${req.auth.id}_${Date.now()}`;
  const paymentOrder = await razorpay.createPaymentOrder(priced.pricing.total, receipt);

  await PaymentIntent.create({
    razorpayOrderId: paymentOrder.id,
    userId: req.auth.id,
    amount: priced.pricing.total,
    currency: paymentOrder.currency,
  });

  res.status(201).json({
    success: true,
    paymentOrder, // { id, amount (paise), currency, keyId, mock }
    pricing: priced.pricing, // so the page can show exactly what will be charged
  });
}));

// POST /api/payments/mock-pay  { razorpayOrderId }
// Only used when Razorpay test keys aren't configured: simulates a successful
// checkout by minting a payment id + a signature the server will verify.
router.post("/mock-pay", requireAuth, requireOnlinePayments, asyncHandler(async (req, res) => {
  if (razorpay.isConfigured) {
    return res.status(400).json({ success: false, message: "Razorpay test keys are configured — use the real test checkout" });
  }
  const { razorpayOrderId } = req.body;
  if (typeof razorpayOrderId !== "string" || !razorpayOrderId.startsWith("order_mock_")) {
    return res.status(400).json({ success: false, message: "razorpayOrderId (mock) is required" });
  }

  const razorpayPaymentId = `pay_mock_${crypto.randomBytes(8).toString("hex")}`;
  res.json({
    success: true,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature: razorpay.mockSignature(razorpayOrderId, razorpayPaymentId),
  });
}));

module.exports = router;
