// Razorpay (test mode) wrapper. With RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET set
// in .env this talks to the real Razorpay test API; without them it falls
// back to a deterministic mock so the whole checkout/refund flow still works
// offline. Signature verification is real HMAC either way.

const crypto = require("crypto");

const KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const MOCK_SECRET = "shopsphere-mock-secret";

const isConfigured = Boolean(KEY_ID && KEY_SECRET);

let client = null;
if (isConfigured) {
  const Razorpay = require("razorpay");
  client = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
}

// amount is in rupees; Razorpay wants paise
async function createPaymentOrder(amount, receipt) {
  const paise = Math.round(amount * 100);
  if (client) {
    const rzpOrder = await client.orders.create({ amount: paise, currency: "INR", receipt });
    return { id: rzpOrder.id, amount: paise, currency: "INR", keyId: KEY_ID, mock: false };
  }
  const id = `order_mock_${crypto.randomBytes(8).toString("hex")}`;
  console.log(`[razorpay:mock] created payment order ${id} for ₹${amount} (${receipt})`);
  return { id, amount: paise, currency: "INR", keyId: "rzp_test_mock", mock: true };
}

// Standard Razorpay signature check: HMAC-SHA256(orderId|paymentId, secret).
// In mock mode the "checkout" is expected to compute the same HMAC with the
// mock secret (the frontend mock does this), so verification is still real.
function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return false;
  const secret = isConfigured ? KEY_SECRET : MOCK_SECRET;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpaySignature));
  } catch {
    return false;
  }
}

// Used by the mock checkout on the frontend via POST /api/payments/mock-pay
function mockSignature(razorpayOrderId, razorpayPaymentId) {
  return crypto
    .createHmac("sha256", MOCK_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
}

async function refundPayment(paymentId, amount) {
  const paise = Math.round(amount * 100);
  if (client && paymentId && !paymentId.startsWith("pay_mock_")) {
    const refund = await client.payments.refund(paymentId, { amount: paise });
    return { id: refund.id, status: refund.status || "processed", mock: false };
  }
  const id = `rfnd_mock_${crypto.randomBytes(8).toString("hex")}`;
  console.log(`[razorpay:mock] refunded ₹${amount} on payment ${paymentId || "(cod payout)"} → ${id}`);
  return { id, status: "processed", mock: true };
}

module.exports = { isConfigured, createPaymentOrder, verifyPaymentSignature, mockSignature, refundPayment };
