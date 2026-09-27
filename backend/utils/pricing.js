// Order pricing — the single place that decides what a cart costs.
//
// Both the payment route and the order route must agree, or a customer can be
// charged one figure and billed another. `POST /api/payments/create-order`
// used to take the amount straight from the browser, so a crafted request could
// create a ₹1 Razorpay order and then place a ₹27,000 cart against it: the
// signature only binds order_id|payment_id, never the amount.

const { Product } = require("../models/product.model");

// Flat delivery fee per order, mirroring what the checkout screen shows before
// the customer pays. Charged once per order, never per line.
const SHIPPING_FEE = 200;

function priceOrder(orderItems) {
  const subtotal = orderItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0);
  const shipping = orderItems.length ? SHIPPING_FEE : 0;
  const tax = 0; // no tax component is charged at checkout today
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    shipping,
    tax,
    total: Math.round((subtotal + shipping + tax) * 100) / 100,
  };
}

// Prices a cart the customer is about to pay for, using catalog prices rather
// than anything the browser sent. Returns { ok, pricing, lines, message }.
async function priceCart(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, message: "items is required" };
  }

  const lines = [];
  for (const item of items) {
    const qty = Math.max(1, Math.floor(Number(item.qty) || 1));
    if (!item.productId) {
      return { ok: false, message: "Every item must reference a product" };
    }
    const product = await Product.findOne(
      { id: String(item.productId), isArchived: { $ne: true } },
      "id name price"
    ).lean();
    if (!product) {
      return { ok: false, message: `Product ${item.productId} not found` };
    }
    lines.push({ productId: product.id, name: product.name, qty, price: product.price });
  }

  return { ok: true, pricing: priceOrder(lines), lines };
}

module.exports = { SHIPPING_FEE, priceOrder, priceCart };
