// Backs every notification bell. Admin/seller/delivery consoles read their
// role feed; users read their personal feed.

const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { Notification } = require("../models/notification.model");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

// GET /api/notifications — the caller's feed (role feed + personal feed)
router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const notifications = await Notification.find({
    $or: [{ recipientRole: req.auth.role }, { recipientId: req.auth.id }],
  })
    .sort({ createdAt: -1 })
    .limit(limit);

  const unread = await Notification.countDocuments({
    $or: [{ recipientRole: req.auth.role }, { recipientId: req.auth.id }],
    read: false,
  });

  res.json({ success: true, notifications, unread });
}));

// PATCH /api/notifications/:id/read
router.patch("/:id/read", requireAuth, asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ success: false, message: "Notification not found" });
  }
  const notification = await Notification.findOne({
    _id: req.params.id,
    $or: [{ recipientRole: req.auth.role }, { recipientId: req.auth.id }],
  });
  if (!notification) {
    return res.status(404).json({ success: false, message: "Notification not found" });
  }
  notification.read = true;
  await notification.save();
  res.json({ success: true, notification });
}));

// PATCH /api/notifications/read-all
router.patch("/read-all", requireAuth, asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { $or: [{ recipientRole: req.auth.role }, { recipientId: req.auth.id }], read: false },
    { read: true }
  );
  res.json({ success: true });
}));

module.exports = router;
