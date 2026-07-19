// Payroll / salary management (Feature 5). Admins generate a month's payroll
// for every staff member (delivery partners + admins), auto-counting each
// partner's delivered orders in that period, tune base salary / incentives /
// deductions, and mark rows Paid (which notifies the staff member). A staff
// member can read their own payslips via GET /api/payroll?staffId=me.

const express = require("express");
const router = express.Router();
const { Payroll } = require("../models/payroll.model");
const { DeliveryPartner } = require("../models/deliveryPartner.model");
const { Account } = require("../models/account.model");
const { Order } = require("../models/order.model");
const { requireAuth, requireRole } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const { notifyUser } = require("../utils/notify");
const { PERIOD_RE, currentPeriod, countDeliveries, computeNetPay } = require("../utils/payrollMath");

const ADMIN_BASE_SALARY = 40000; // default monthly base for admin/staff accounts

// { partnerId: deliveriesCount } for orders delivered within the period
async function deliveriesByPartner(period) {
  const delivered = await Order.find(
    { deliveryStatus: "Delivered", deliveryPartnerId: { $ne: null } },
    "deliveryPartnerId statusHistory createdAt"
  ).lean();
  return countDeliveries(delivered, period);
}

router.use(requireAuth);

// GET /api/payroll?period=YYYY-MM        (admin) — a period's rows
// GET /api/payroll?staffId=me            (any staff) — that staff's payslips
router.get("/", asyncHandler(async (req, res) => {
  const { staffId } = req.query;

  // self-service: a delivery partner / admin reading their own payslips
  if (staffId) {
    const resolved = staffId === "me" ? req.auth.id : staffId;
    if (req.auth.role !== "admin" && resolved !== req.auth.id) {
      return res.status(403).json({ success: false, message: "You can only view your own payslips" });
    }
    const filter = { staffId: resolved };
    if (req.query.period) filter.period = req.query.period;
    const payslips = await Payroll.find(filter).sort({ period: -1, generatedAt: -1 });
    return res.json({ success: true, payroll: payslips });
  }

  // otherwise it's the admin payroll table for a period
  if (req.auth.role !== "admin") {
    return res.status(403).json({ success: false, message: "You don't have access to this resource" });
  }
  const period = req.query.period || currentPeriod();
  if (!PERIOD_RE.test(period)) {
    return res.status(400).json({ success: false, message: "period must be in YYYY-MM format" });
  }
  const rows = await Payroll.find({ period }).sort({ staffRole: 1, staffName: 1 });
  res.json({ success: true, period, payroll: rows });
}));

// POST /api/payroll/generate  { period }  (admin) — build/refresh rows for
// every staff member. Recomputes delivery counts + net pay while preserving
// any admin-tuned base/incentive/deductions and never un-paying a Paid row.
router.post("/generate", requireRole("admin"), asyncHandler(async (req, res) => {
  const period = req.body.period || currentPeriod();
  if (!PERIOD_RE.test(period)) {
    return res.status(400).json({ success: false, message: "period must be in YYYY-MM format" });
  }

  const [partners, admins, counts] = await Promise.all([
    DeliveryPartner.find(),
    Account.find({ role: "admin" }),
    deliveriesByPartner(period),
  ]);

  const existingRows = await Payroll.find({ period });
  const existingByStaff = Object.fromEntries(existingRows.map((r) => [r.staffId, r]));

  const staff = [
    ...partners.map((p) => ({
      staffId: p.id,
      staffRole: "delivery",
      staffName: p.name,
      defaultBase: p.baseSalary,
      defaultIncentive: p.incentivePerDelivery,
      deliveriesCount: counts[p.id] || 0,
    })),
    ...admins.map((a) => ({
      staffId: a.id,
      staffRole: "admin",
      staffName: a.name,
      defaultBase: ADMIN_BASE_SALARY,
      defaultIncentive: 0,
      deliveriesCount: 0,
    })),
  ];

  for (const s of staff) {
    const prev = existingByStaff[s.staffId];
    const baseSalary = prev ? prev.baseSalary : s.defaultBase;
    const incentivePerDelivery = prev ? prev.incentivePerDelivery : s.defaultIncentive;
    const deductions = prev ? prev.deductions : 0;
    const { incentiveTotal, netPay } = computeNetPay({
      baseSalary,
      deliveriesCount: s.deliveriesCount,
      incentivePerDelivery,
      deductions,
    });

    await Payroll.findOneAndUpdate(
      { staffId: s.staffId, period },
      {
        $set: {
          id: `PAY-${period}-${s.staffId}`,
          staffRole: s.staffRole,
          staffName: s.staffName,
          baseSalary,
          deliveriesCount: s.deliveriesCount,
          incentivePerDelivery,
          incentiveTotal,
          deductions,
          netPay,
          generatedAt: new Date(),
          // preserve a Paid status across regenerations
          status: prev ? prev.status : "Pending",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const rows = await Payroll.find({ period }).sort({ staffRole: 1, staffName: 1 });
  res.json({ success: true, period, payroll: rows });
}));

// PATCH /api/payroll/:id  { baseSalary?, incentivePerDelivery?, deductions?, status? }
// Edit a row / mark it Paid. Marking Paid notifies the staff member.
router.patch("/:id", requireRole("admin"), asyncHandler(async (req, res) => {
  const row = await Payroll.findOne({ id: req.params.id });
  if (!row) {
    return res.status(404).json({ success: false, message: "Payroll record not found" });
  }

  const { baseSalary, incentivePerDelivery, deductions, status } = req.body;
  const numeric = (v) => Number.isFinite(Number(v)) && Number(v) >= 0;

  if (baseSalary !== undefined) {
    if (!numeric(baseSalary)) return res.status(400).json({ success: false, message: "baseSalary must be a non-negative number" });
    row.baseSalary = Number(baseSalary);
  }
  if (incentivePerDelivery !== undefined) {
    if (!numeric(incentivePerDelivery)) return res.status(400).json({ success: false, message: "incentivePerDelivery must be a non-negative number" });
    row.incentivePerDelivery = Number(incentivePerDelivery);
  }
  if (deductions !== undefined) {
    if (!numeric(deductions)) return res.status(400).json({ success: false, message: "deductions must be a non-negative number" });
    row.deductions = Number(deductions);
  }

  const { incentiveTotal, netPay } = computeNetPay(row);
  row.incentiveTotal = incentiveTotal;
  row.netPay = netPay;

  let justPaid = false;
  if (status !== undefined) {
    if (!["Pending", "Paid"].includes(status)) {
      return res.status(400).json({ success: false, message: "status must be Pending or Paid" });
    }
    justPaid = status === "Paid" && row.status !== "Paid";
    row.status = status;
    row.paidAt = status === "Paid" ? new Date() : null;
  }

  await row.save();

  if (justPaid) {
    await notifyUser(
      row.staffId,
      "payroll-paid",
      `Salary paid for ${row.period}`,
      `₹${row.netPay.toLocaleString("en-IN")} has been credited`,
      { payrollId: row.id, period: row.period, netPay: row.netPay }
    );
  }

  res.json({ success: true, payroll: row });
}));

module.exports = router;
