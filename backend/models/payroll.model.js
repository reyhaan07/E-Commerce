// Payroll record — one per staff member per pay period (Feature 5).
// `staffId` points at a DeliveryPartner.id ("partner-2") or an admin/staff
// Account.id ("admin-1"). `id` is the business key ("PAY-2026-05-partner-2"),
// and Mongo's _id/__v are stripped in toJSON like every other model here.

const mongoose = require("mongoose");

const PAYROLL_STATUSES = ["Pending", "Paid"];
const STAFF_ROLES = ["delivery", "admin"];

const payrollSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  staffId: { type: String, required: true }, // DeliveryPartner.id or Account.id
  staffRole: { type: String, enum: STAFF_ROLES, required: true },
  staffName: { type: String, required: true },
  period: { type: String, required: true }, // "YYYY-MM"
  baseSalary: { type: Number, default: 0 },
  deliveriesCount: { type: Number, default: 0 },
  incentivePerDelivery: { type: Number, default: 0 },
  incentiveTotal: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netPay: { type: Number, default: 0 },
  status: { type: String, enum: PAYROLL_STATUSES, default: "Pending" },
  generatedAt: { type: Date, default: Date.now },
  paidAt: { type: Date, default: null },
});

// one payroll row per staff member per period
payrollSchema.index({ staffId: 1, period: 1 }, { unique: true });
payrollSchema.index({ period: 1 });

payrollSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Payroll = mongoose.model("Payroll", payrollSchema);

module.exports = { Payroll, PAYROLL_STATUSES, STAFF_ROLES };
