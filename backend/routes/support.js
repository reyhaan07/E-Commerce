// Support requests raised from Seller Center. "Contact Support" used to be a
// bare mailto: link in the seller sidebar, which did nothing on a machine with
// no mail client configured — this is the real destination behind it.

const express = require("express");
const router = express.Router();
const { SupportRequest, SUPPORT_CATEGORIES } = require("../models/supportRequest.model");
const { Account } = require("../models/account.model");
const { requireAuth, requireRole } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const { nextId } = require("../utils/sequence");
const { notifyRole } = require("../utils/notify");
const { sendMail, templates } = require("../utils/mailer");

const SUPPORT_INBOX = process.env.SUPPORT_EMAIL || "support@shopsphere.com";

async function nextRequestId() {
  return nextId("supportRequest", SupportRequest, "sup-");
}

// POST /api/support  { subject, message, category? }  (seller)
// Deliberately NOT behind requireActiveAccount: a suspended seller is exactly
// the person who needs to reach support, and the 403 that middleware returns
// tells them to "contact a platform administrator" — which is this endpoint.
// Same carve-out as the delivery partner's unsuspension request.
router.post("/", requireAuth, requireRole("seller"), asyncHandler(async (req, res) => {
  const { subject, message, category } = req.body;

  if (typeof subject !== "string" || !subject.trim()) {
    return res.status(400).json({ success: false, message: "subject is required" });
  }
  if (subject.trim().length > 150) {
    return res.status(400).json({ success: false, message: "subject must be under 150 characters" });
  }
  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ success: false, message: "message is required" });
  }
  if (message.trim().length > 4000) {
    return res.status(400).json({ success: false, message: "message must be under 4000 characters" });
  }
  if (category !== undefined && !SUPPORT_CATEGORIES.includes(category)) {
    return res.status(400).json({ success: false, message: `category must be one of: ${SUPPORT_CATEGORIES.join(", ")}` });
  }

  const account = await Account.findOne({ id: req.auth.id }, "name email");
  const request = await SupportRequest.create({
    id: await nextRequestId(),
    requesterId: req.auth.id,
    requesterRole: "seller",
    requesterName: account?.name || "",
    requesterEmail: account?.email || "",
    category: category || "Other",
    subject: subject.trim(),
    message: message.trim(),
  });

  // Land it in the admin bell (persisted + pushed over Socket.io in one call).
  await notifyRole("admin", "seller-support-request", `Support request: ${request.subject}`,
    `${request.requesterName || request.requesterId} (${request.category}) — ${request.message.slice(0, 140)}`,
    { requestId: request.id, sellerId: request.requesterId, category: request.category });

  // Best-effort email to the support inbox. The mailer is a no-op when SMTP
  // isn't configured, so a dev machine still gets a 201 rather than a 500.
  try {
    await sendMail({ to: SUPPORT_INBOX, ...templates.supportRequest(request) });
  } catch (err) {
    // Non-fatal: the request is already stored and the admins already notified.
  }

  res.status(201).json({ success: true, request });
}));

// GET /api/support  (admin sees every request; a seller sees their own)
router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const filter = req.auth.role === "admin" ? {} : { requesterId: req.auth.id };
  if (req.query.status) filter.status = req.query.status;
  const requests = await SupportRequest.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, requests });
}));

// PATCH /api/support/:id  { status }  (admin) — close a handled request
router.patch("/:id", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["Open", "Resolved"].includes(status)) {
    return res.status(400).json({ success: false, message: "status must be Open or Resolved" });
  }
  const request = await SupportRequest.findOneAndUpdate({ id: req.params.id }, { status }, { new: true });
  if (!request) {
    return res.status(404).json({ success: false, message: "Support request not found" });
  }
  res.json({ success: true, request });
}));

module.exports = router;
