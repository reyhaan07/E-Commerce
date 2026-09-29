const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const router = express.Router();
const { Account, ROLES } = require("../models/account.model");
const { DeliveryPartner } = require("../models/deliveryPartner.model");
const { signToken } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const { nextId } = require("../utils/sequence");
const { sendMail, templates } = require("../utils/mailer");
const { notifyRole } = require("../utils/notify");

const LOGIN_APP_URL = process.env.LOGIN_APP_URL || "http://localhost:5177";

// Used to burn roughly the same amount of time as a real bcrypt.compare
// when an account isn't found, so "no such account" and "wrong password"
// don't take noticeably different amounts of time to respond.
const DUMMY_HASH = bcrypt.hashSync("timing-normalization", 10);

async function nextUserId() {
  // Atomic counter rather than a max+1 scan (see utils/sequence). Seller ids
  // in the same collection don't parse against the "user-" prefix, so each
  // role keeps its own independent run of numbers.
  return nextId("userAccount", Account, "user-");
}

async function nextSellerId() {
  return nextId("sellerAccount", Account, "seller-");
}

async function nextPartnerId() {
  return nextId("deliveryPartner", DeliveryPartner, "partner-");
}

function isEmailShaped(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Indian GSTIN / PAN formats (Feature 6). GSTIN is 15 chars; PAN is 10.
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const REQUIRED_DOC_TYPES = ["gst", "pan", "cheque", "id"];
const DOC_LABELS = { gst: "GST certificate", pan: "PAN card", cheque: "cancelled cheque / bank proof", id: "government ID" };

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (typeof email !== "string" || typeof password !== "string" || typeof role !== "string" || !ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "email, password and valid role are required",
    });
  }

  const cleanEmail = email.trim();
  const account = await Account.findOne({ email: cleanEmail, role }) ||
    await Account.findOne({ email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, role });
  if (account) {
    const passwordMatches = await account.comparePassword(password);
    if (passwordMatches) {
      // A suspended or deleted account keeps its password but loses access —
      // this is what makes suspending an admin from the roster actually bite.
      if (account.status !== "active") {
        // accountStatus lets the login screen render a proper "account
        // suspended" panel instead of treating it as a bad-credentials error.
        return res.status(403).json({
          success: false,
          accountStatus: account.status,
          message: account.status === "suspended"
            ? "This account has been suspended by a platform administrator. You can sign in again once it is reinstated."
            : "This account is no longer active. Contact a platform administrator.",
        });
      }
      account.lastLogin = new Date();
      await account.save();
      return res.json({
        success: true,
        token: signToken(account),
        role: account.role,
        id: account.id,
        name: account.name,
        email: account.email,
        ...(account.role === "admin" ? { adminRole: account.adminRole || "ADMIN" } : {}),
      });
    }
  } else {
    // no such account - still pay the bcrypt cost so the response takes
    // about as long as the "wrong password" case above
    await bcrypt.compare(password, DUMMY_HASH);
  }

  // Real delivery partners created by Admin can also login to the delivery app.
  if (role === "delivery") {
    const partner = await DeliveryPartner.findOne({ email: cleanEmail }) ||
      await DeliveryPartner.findOne({ email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    if (partner && (await partner.comparePassword(password))) {
      // Same rule as Accounts above: a suspended or deactivated partner keeps
      // their password but loses access. Suspended partners are told they can
      // appeal from the app, which they reach with the token issued below only
      // if they were already signed in - so the message matters here.
      const accountStatus = partner.accountStatus || "active";
      if (accountStatus !== "active") {
        return res.status(403).json({
          success: false,
          accountStatus,
          message: accountStatus === "suspended"
            ? "This account has been suspended. You can request a review from a platform administrator."
            : "This account has been deactivated by a platform administrator.",
        });
      }
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
// Creates a "user" account and logs them straight in (returns a JWT). Only for
// the "user" role — admin/seller/delivery accounts are created by an admin (or
// via /register/seller for sellers).
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
  if (!phone || !/^\d{10}$/.test(String(phone).trim())) {
    return res.status(400).json({ success: false, message: "Phone number must be exactly 10 digits" });
  }

  if (await Account.findOne({ email })) {
    return res.status(400).json({ success: false, message: "An account with this email already exists" });
  }

  let account;
  try {
    account = await Account.create({
      id: await nextUserId(),
      name: name.trim(),
      email,
      password,
      phone: String(phone).trim(),
      role: "user",
      lastLogin: new Date(),
    });
  } catch (err) {
    // the unique index is what actually stops a duplicate that slipped past the check above
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "An account with this email already exists" });
    }
    throw err;
  }

  await notifyRole("admin", "new-user", "New user registered", `${account.name} (${account.email})`, { userId: account.id });
  await sendMail({ to: account.email, ...templates.welcome(account.name) });

  res.status(201).json({
    success: true,
    token: signToken(account),
    role: account.role,
    id: account.id,
    name: account.name,
    email: account.email,
  });
}));

// POST /api/register/seller
// Feature 6: self-serve seller onboarding. Unlike user register this is
// multi-field and demands a well-formed GSTIN + PAN and the required proof
// documents up front. The account is created as a Pending seller so it can
// log in immediately but stays gated until an admin verifies it; the admin
// bell lights up via a real-time notification.
router.post("/register/seller", asyncHandler(async (req, res) => {
  const { name, email, password, phone, businessName, businessAddress, gstin, panNumber, documents } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ success: false, message: "name is required" });
  }
  if (!isEmailShaped(email)) {
    return res.status(400).json({ success: false, message: "a valid email is required" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ success: false, message: "password must be at least 8 characters" });
  }

  // collect everything that's missing/invalid so the seller sees it all at once
  const problems = [];
  if (!phone || !/^\d{10}$/.test(String(phone).trim())) problems.push("a 10-digit phone number");
  if (typeof businessName !== "string" || !businessName.trim()) problems.push("a business name");
  if (typeof businessAddress !== "string" || !businessAddress.trim()) problems.push("a business address");

  const gst = String(gstin || "").toUpperCase().trim();
  const pan = String(panNumber || "").toUpperCase().trim();
  if (!GSTIN_RE.test(gst)) problems.push("a valid 15-character GSTIN");
  if (!PAN_RE.test(pan)) problems.push("a valid 10-character PAN");

  const docs = Array.isArray(documents) ? documents : [];
  const providedTypes = new Set(
    docs.filter((d) => d && typeof d.dataUrl === "string" && d.dataUrl && REQUIRED_DOC_TYPES.includes(d.type)).map((d) => d.type)
  );
  const missingDocs = REQUIRED_DOC_TYPES.filter((t) => !providedTypes.has(t));
  for (const t of missingDocs) problems.push(`the ${DOC_LABELS[t]} document`);

  if (problems.length) {
    return res.status(400).json({
      success: false,
      message: `Your application is missing ${problems.join(", ")}. Please provide everything before submitting.`,
    });
  }

  const existing = await Account.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: "An account with this email already exists" });
  }

  const cleanDocs = docs
    .filter((d) => d && REQUIRED_DOC_TYPES.includes(d.type) && typeof d.dataUrl === "string" && d.dataUrl)
    .map((d) => ({
      type: d.type,
      label: d.label || DOC_LABELS[d.type],
      fileName: d.fileName || "",
      dataUrl: d.dataUrl,
      uploadedAt: new Date(),
    }));

  let account;
  try {
    account = await Account.create({
      id: await nextSellerId(),
      name: name.trim(),
      email,
      password,
      phone,
      role: "seller",
      status: "active",
      businessName: businessName.trim(),
      businessAddress: businessAddress.trim(),
      supportEmail: email,
      supportPhone: phone || "",
      gstin: gst,
      panNumber: pan,
      documents: cleanDocs,
      verificationStatus: "Pending",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "An account with this email already exists" });
    }
    throw err;
  }

  await notifyRole(
    "admin",
    "seller-application",
    "New seller application",
    `${account.businessName || account.name} (${account.email}) is awaiting verification`,
    { sellerId: account.id }
  );

  res.status(201).json({
    success: true,
    message: "Application submitted — pending admin approval",
    token: signToken(account),
    role: account.role,
    id: account.id,
    name: account.name,
    email: account.email,
    verificationStatus: account.verificationStatus,
  });
}));

// POST /api/register/delivery
// Self-serve delivery partner onboarding. Validates identity, phone, vehicle & zone,
// and activates the partner account so they can immediately sign in or start duty.
router.post("/register/delivery", asyncHandler(async (req, res) => {
  const { name, email, password, phone, vehicle, vehicleModel, vehicleNumber, zone, pincode, documents } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ success: false, message: "Full name is required" });
  }
  if (!isEmailShaped(email)) {
    return res.status(400).json({ success: false, message: "A valid email address is required" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
  }
  if (!phone || !/^\d{10}$/.test(String(phone).trim())) {
    return res.status(400).json({ success: false, message: "A valid 10-digit phone number is required" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existingPartner = await DeliveryPartner.findOne({ email: cleanEmail });
  const existingAccount = await Account.findOne({ email: cleanEmail });
  if (existingPartner || existingAccount) {
    return res.status(400).json({ success: false, message: "An account with this email already exists" });
  }

  const cleanDocs = (Array.isArray(documents) ? documents : [])
    .filter((d) => d && typeof d.dataUrl === "string" && d.dataUrl)
    .map((d) => ({
      type: d.type || "license",
      label: d.label || (d.type === "rc" ? "Vehicle RC Book" : d.type === "id" ? "Government ID" : "Driving License"),
      fileName: d.fileName || "",
      dataUrl: d.dataUrl,
      uploadedAt: new Date(),
    }));

  let partner;
  try {
    partner = await DeliveryPartner.create({
      id: await nextPartnerId(),
      name: name.trim(),
      email: cleanEmail,
      password,
      phone: String(phone).trim(),
      vehicle: vehicle || "Bike",
      vehicleModel: vehicleModel ? String(vehicleModel).trim() : "",
      vehicleNumber: vehicleNumber ? String(vehicleNumber).trim().toUpperCase() : "",
      documents: cleanDocs,
      zone: zone ? String(zone).trim() : "Main City Zone",
      pincode: pincode ? String(pincode).trim() : "",
      status: "Active",
      accountStatus: "active",
      baseSalary: 15000,
      incentivePerDelivery: 30,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "An account with this email already exists" });
    }
    throw err;
  }

  await notifyRole(
    "admin",
    "partner-registered",
    "New delivery partner registered",
    `${partner.name} (${partner.email}) registered as delivery partner`,
    { partnerId: partner.id }
  );

  const token = signToken({ id: partner.id, role: "delivery" });
  res.status(201).json({
    success: true,
    message: "Delivery partner registered successfully",
    token,
    role: "delivery",
    id: partner.id,
    name: partner.name,
    email: partner.email,
  });
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
    ...templates.passwordReset(account.name, `${LOGIN_APP_URL}/?token=${token}`),
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
