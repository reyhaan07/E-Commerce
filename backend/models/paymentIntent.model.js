// A Razorpay order the server created, and the amount it was created for.
//
// The payment signature proves a payment belongs to a Razorpay order, but says
// nothing about how much was paid. Recording the amount here lets order
// creation confirm the customer actually paid the order total, and lets a
// verified payment be spent only once (a signature could otherwise be replayed
// against a second, larger cart).

const mongoose = require("mongoose");

const paymentIntentSchema = new mongoose.Schema({
  razorpayOrderId: { type: String, required: true, unique: true },
  userId: { type: String, required: true }, // Account.id of whoever asked for it
  amount: { type: Number, required: true }, // rupees, server-priced
  currency: { type: String, default: "INR" },
  // Spent when an order is created against this payment, so it can't be reused.
  consumed: { type: Boolean, default: false },
  consumedByOrderId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

paymentIntentSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const PaymentIntent = mongoose.model("PaymentIntent", paymentIntentSchema);

module.exports = { PaymentIntent };
