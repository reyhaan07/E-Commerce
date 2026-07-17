const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const router = express.Router();
const { Account, ROLES } = require("../models/account.model");
const { DeliveryPartner } = require("../models/deliveryPartner.model");
const { signToken } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const { sendMail, templates } = require("../utils/mailer");
const { notifyRole } = require("../utils/notify");

const OTP_TTL_MS = 10 * 60 * 1000;
const LOGIN_APP_URL = process.env.LOGIN_APP_URL || "http://localhost:5177";

function newOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

// Used to burn roughly the same amount of time as a real bcrypt.compare
// when an account isn't found, so "no such account" and "wrong password"
// don't take noticeably different amounts of time to respond.
const DUMMY_HASH = bcrypt.hashSync("timing-normalization", 10);

async function nextUserId() {
  const accounts = await Account.find({ role: "user" }, "id").lean();
  const maxNum = accounts.reduce((max, a) => {
    const num = parseInt(String(a.id).replace("user-", ""), 10);
    return Number.isFinite(num) && num > max ? num : max;
  }, 0);
  return `user-${maxNum + 1}`;
}

function isEmailShaped(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (typeof email !== "string" || typeof password !== "string" || typeof role !== "string" || !ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "email, password and valid role are required",
    });
  }

  const account = await Account.findOne({ email, role });
  if (account) {
    const passwordMatches = await account.comparePassword(password);
    if (passwordMatches && account.role === "user" && !account.emailVerified) {
      return res.status(403).json({ success: false, message: "Please verify your email first — check your inbox for the code" });
    }
    if (passwordMatches) {
      account.lastLogin = new Date();
      await account.save();
      return res.json({
        success: true,
        token: signToken(account),
        role: account.role,
        id: account.id,
        name: account.name,
        email: account.email,
      });
    }
  } else {
    // no such account - still pay the bcrypt cost so the response takes
    // about as long as the "wrong password" case above
    await bcrypt.compare(password, DUMMY_HASH);
  }

  // Real delivery partners created by Admin can also login to the delivery app.
  if (role === "delivery") {
    const partner = await DeliveryPartner.findOne({ email, password });
    if (partner) {
      return res.json({
        success: true,
        token: signToken({ id: partner.id, role: "delivery" }),
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
}));

// POST /api/register  { name, email, password, phone }
// Feature 1 step 1: validates the details, creates an *unverified* account
// holding a 6-digit OTP, and emails the code. The account only becomes usable
// after POST /api/verify-otp. Only for the "user" role - admin/seller/delivery
// accounts are created by an admin.
router.post("/register", asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ success: false, message: "name is required" });
  }
  if (!isEmailShaped(email)) {
    return res.status(400).json({ success: false, message: "a valid email is required" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ success: false, message: "password must be at least 8 characters" });
  }

  const existing = await Account.findOne({ email });
  if (existing && existing.emailVerified) {
    return res.status(400).json({ success: false, message: "An account with this email already exists" });
  }

  const otp = newOtp();
  let account;
  try {
    if (existing) {
      // an earlier registration that never finished OTP verification -
      // treat this as a fresh attempt with the new details
      existing.name = name;
      existing.password = password;
      existing.phone = phone;
      existing.otpCode = otp;
      existing.otpExpiry = new Date(Date.now() + OTP_TTL_MS);
      account = await existing.save();
    } else {
      account = await Account.create({
        id: await nextUserId(),
        name,
        email,
        password,
        phone,
        role: "user",
        emailVerified: false,
        otpCode: otp,
        otpExpiry: new Date(Date.now() + OTP_TTL_MS),
      });
    }
  } catch (err) {
    // someone else registered with the same email/id between our check
    // above and this create() - the unique index is what actually stops it
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "An account with this email already exists" });
    }
    throw err;
  }

  await sendMail({ to: email, ...templates.otp(name, otp) });

  res.status(201).json({
    success: true,
    otpRequired: true,
    email: account.email,
    message: "We've emailed you a 6-digit verification code",
  });
}));

// POST /api/verify-otp  { email, otp }
// Feature 1 steps 2-5: checks the code, activates the account, notifies the
// admin dashboard in real time, sends the welcome email and logs the user in.
router.post("/verify-otp", asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (typeof email !== "string" || typeof otp !== "string") {
    return res.status(400).json({ success: false, message: "email and otp are required" });
  }

  const account = await Account.findOne({ email, role: "user", emailVerified: false });
  if (!account || !account.otpCode || !account.otpExpiry || account.otpExpiry < new Date()) {
    return res.status(400).json({ success: false, message: "Code is invalid or has expired — request a new one" });
  }
  const matches = crypto.timingSafeEqual(
    Buffer.from(account.otpCode.padEnd(10)),
    Buffer.from(String(otp).padEnd(10).slice(0, 10))
  );
  if (!matches) {
    return res.status(400).json({ success: false, message: "That code doesn't match — check your email and try again" });
  }

  account.emailVerified = true;
  account.otpCode = null;
  account.otpExpiry = null;
  account.lastLogin = new Date();
  await account.save();

  await notifyRole("admin", "new-user", "New user registered", `${account.name} (${account.email})`, { userId: account.id });
  await sendMail({ to: account.email, ...templates.welcome(account.name) });

  res.json({
    success: true,
    token: signToken(account),
    role: account.role,
    id: account.id,
    name: account.name,
    email: account.email,
  });
}));

// POST /api/resend-otp  { email }
router.post("/resend-otp", asyncHandler(async (req, res) => {
  const { email } = req.body;
  const account = await Account.findOne({ email, role: "user", emailVerified: false });
  // same response either way, so this can't be used to probe for accounts
  if (account) {
    account.otpCode = newOtp();
    account.otpExpiry = new Date(Date.now() + OTP_TTL_MS);
    await account.save();
    await sendMail({ to: account.email, ...templates.otp(account.name, account.otpCode) });
  }
  res.json({ success: true, message: "If a pending registration exists, a new code has been sent" });
}));

// POST /api/forgot-password  { email }
// No real email service here - the reset link is just logged to the console
// like a mock inbox, which is enough for a college project demo.
router.post("/forgot-password", asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (typeof email !== "string") {
    return res.status(400).json({ success: false, message: "email is required" });
  }

  const account = await Account.findOne({ email });

  // Pay the same bcrypt cost whether or not the account exists, so "no such
  // account" and "account found" take about the same time to respond -
  // the response body is already identical either way.
  await bcrypt.compare(email, DUMMY_HASH);

  if (!account) {
    return res.json({ success: true, message: "If that email exists, a reset link has been sent" });
  }

  const token = crypto.randomBytes(20).toString("hex");
  account.resetToken = token;
  account.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await account.save();

  await sendMail({
    to: account.email,
    ...templates.passwordReset(account.name, `${LOGIN_APP_URL}/?resetToken=${token}`),
  });

  res.json({ success: true, message: "If that email exists, a reset link has been sent" });
}));

// POST /api/reset-password  { token, password }
router.post("/reset-password", asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (typeof token !== "string" || typeof password !== "string") {
    return res.status(400).json({ success: false, message: "token and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: "password must be at least 8 characters" });
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
}));

module.exports = router;
