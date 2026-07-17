// Razorpay test-mode payment flow (Feature 7 steps 3-4):
//   POST /api/payments/create-order  → Razorpay order id for the checkout
//   POST /api/payments/mock-pay      → stands in for the Razorpay checkout
//                                      popup when no test keys are configured
// Verification of the payment signature happens in POST /api/orders, before
// the ShopSphere order is created.

const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const razorpay = require("../utils/razorpay");

// POST /api/payments/create-order  { amount }
router.post("/create-order", requireAuth, asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ success: false, message: "amount must be a positive number" });
  }

  const receipt = `rcpt_${req.auth.id}_${Date.now()}`;
  const paymentOrder = await razorpay.createPaymentOrder(amount, receipt);

  res.status(201).json({
    success: true,
    paymentOrder, // { id, amount (paise), currency, keyId, mock }
  });
}));

// POST /api/payments/mock-pay  { razorpayOrderId }
// Only used when Razorpay test keys aren't configured: simulates a successful
// checkout by minting a payment id + a signature the server will verify.
router.post("/mock-pay", requireAuth, asyncHandler(async (req, res) => {
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
