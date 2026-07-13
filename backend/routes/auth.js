const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { Account, ROLES } = require("../models/account.model");
const { DeliveryPartner } = require("../models/deliveryPartner.model");

async function nextUserId() {
  const accounts = await Account.find({ role: "user" }, "id").lean();
  const maxNum = accounts.reduce((max, a) => {
    const num = parseInt(String(a.id).replace("user-", ""), 10);
    return Number.isFinite(num) && num > max ? num : max;
  }, 0);
  return `user-${maxNum + 1}`;
}

router.post("/login", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role || !ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "email, password and valid role are required",
    });
  }

  const account = await Account.findOne({ email, role });
  if (account && (await account.comparePassword(password))) {
    account.lastLogin = new Date();
    await account.save();
    return res.json({
      success: true,
      role: account.role,
      id: account.id,
      name: account.name,
      email: account.email,
    });
  }

  // Real delivery partners created by Admin can also login to the delivery app.
  if (role === "delivery") {
    const partner = await DeliveryPartner.findOne({ email, password });
    if (partner) {
      return res.json({
        success: true,
        role: "delivery",
        id: partner.id,
        name: partner.name,
        email: partner.email,
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: "Invalid email or password",
  });
});

// POST /api/register  { name, email, password, phone }
// Only for the "user" role - admin/seller/delivery accounts are created by an admin.
router.post("/register", async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "name, email and password are required",
    });
  }

  if (await Account.findOne({ email })) {
    return res.status(400).json({ success: false, message: "An account with this email already exists" });
  }

  const account = await Account.create({
    id: await nextUserId(),
    name,
    email,
    password,
    phone,
    role: "user",
  });

  res.status(201).json({
    success: true,
    role: account.role,
    id: account.id,
    name: account.name,
    email: account.email,
  });
});

// POST /api/forgot-password  { email }
// No real email service here - the reset link is just logged to the console
// like a mock inbox, which is enough for a college project demo.
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const account = await Account.findOne({ email });

  // Always respond success even if the email isn't found, so people can't
  // use this to probe which emails are registered.
  if (!account) {
    return res.json({ success: true, message: "If that email exists, a reset link has been sent" });
  }

  const token = crypto.randomBytes(20).toString("hex");
  account.resetToken = token;
  account.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await account.save();

  console.log(`Password reset requested for ${email}. Reset token: ${token}`);

  res.json({ success: true, message: "If that email exists, a reset link has been sent" });
});

// POST /api/reset-password  { token, password }
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ success: false, message: "token and password are required" });
  }

  const account = await Account.findOne({ resetToken: token, resetTokenExpiry: { $gt: new Date() } });
  if (!account) {
    return res.status(400).json({ success: false, message: "Reset link is invalid or has expired" });
  }

  account.password = password;
  account.resetToken = null;
  account.resetTokenExpiry = null;
  await account.save();

  res.json({ success: true, message: "Password has been reset" });
});

module.exports = router;
