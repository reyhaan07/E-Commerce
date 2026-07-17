// Email helper. When SMTP settings exist in .env we send real mail via
// Nodemailer; when they don't (the common local-demo case) every message is
// logged to the console instead, so the app works fully offline.

const nodemailer = require("nodemailer");

const FROM = process.env.SMTP_FROM || "ShopSphere <no-reply@shopsphere.local>";

let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

async function sendMail({ to, subject, text, html }) {
  if (!to) return;
  if (!transporter) {
    console.log(`\n--- EMAIL (console fallback) ---\nTo: ${to}\nSubject: ${subject}\n${text}\n--------------------------------\n`);
    return;
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, text, html });
  } catch (err) {
    // never let a mail failure break the API request that triggered it
    console.error(`Failed to send email "${subject}" to ${to}:`, err.message);
  }
}

const templates = {
  otp: (name, code) => ({
    subject: "Your ShopSphere verification code",
    text: `Hi ${name},\n\nYour one-time verification code is ${code}. It expires in 10 minutes.\n\n— ShopSphere`,
  }),
  welcome: (name) => ({
    subject: "Welcome to ShopSphere!",
    text: `Hi ${name},\n\nYour account is ready. Happy shopping!\n\n— ShopSphere`,
  }),
  passwordReset: (name, link) => ({
    subject: "Reset your ShopSphere password",
    text: `Hi ${name},\n\nUse this link to reset your password (valid for 1 hour):\n${link}\n\nIf you didn't ask for this, you can ignore it.\n\n— ShopSphere`,
  }),
  orderConfirmed: (name, order) => ({
    subject: `Order ${order.id} confirmed`,
    text: `Hi ${name},\n\nThanks for your order ${order.id} (₹${order.amount}). We'll email you when it ships.\n\n— ShopSphere`,
  }),
  trackingAssigned: (name, order) => ({
    subject: `Order ${order.id} is on its way`,
    text: `Hi ${name},\n\nYour order ${order.id} has been handed to ${order.deliveryPartnerName || "our delivery partner"}.\nTracking id: ${order.trackingId}\n\n— ShopSphere`,
  }),
  statusUpdate: (name, order, status) => ({
    subject: `Order ${order.id}: ${status}`,
    text: `Hi ${name},\n\nYour order ${order.id} is now "${status}".\nTracking id: ${order.trackingId || "—"}\n\n— ShopSphere`,
  }),
  refundConfirmed: (name, orderId, amount) => ({
    subject: `Refund processed for ${orderId}`,
    text: `Hi ${name},\n\nYour refund of ₹${amount} for order ${orderId} has been processed. It should reflect in 5-7 business days (instantly in test mode).\n\n— ShopSphere`,
  }),
  cancellationRejected: (name, orderId, reason) => ({
    subject: `Cancellation request for ${orderId}`,
    text: `Hi ${name},\n\nYour cancellation request for ${orderId} was declined.\nReason: ${reason || "not provided"}\n\n— ShopSphere`,
  }),
};

module.exports = { sendMail, templates };
