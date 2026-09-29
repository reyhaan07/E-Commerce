const jwt = require("jsonwebtoken");
const { Account } = require("../models/account.model");
const { DeliveryPartner } = require("../models/deliveryPartner.model");

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = "7d";
// The seeded founding admin. It can never be demoted, suspended or deleted,
// so the console can't be locked out of its own roster.
const SYSTEM_SUPER_ADMIN_EMAIL = "admin@shopsphere.com";

function signToken(account) {
  const payload = { id: account.id, role: account.role };
  // Only admins carry a tier; it lets the console hide super-admin-only nav
  // without a round trip. The server still re-checks it against the database.
  if (account.role === "admin") payload.adminRole = account.adminRole || "ADMIN";
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// Decodes the token on the request without failing the request if it's
// missing/invalid - for routes where auth is only required sometimes
// (e.g. /api/orders is public unless someone asks for a specific userId).
function getAuthFromHeader(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Hard-fails the request if there's no valid token. Sets req.auth to
// { id, role } from the token payload.
function requireAuth(req, res, next) {
  const auth = getAuthFromHeader(req);
  if (!auth) {
    return res.status(401).json({ success: false, message: "Missing or invalid Authorization header" });
  }
  req.auth = auth;
  next();
}

// Use after requireAuth on routes shaped like /:id - only the account
// itself (or an admin) can access it.
function requireSelfOrAdmin(paramName) {
  return function (req, res, next) {
    const targetId = req.params[paramName];
    if (req.auth.role === "admin" || req.auth.id === targetId) {
      return next();
    }
    return res.status(403).json({ success: false, message: "You don't have access to this account" });
  };
}

// Use after requireAuth - only accounts with one of the given roles pass.
function requireRole(...roles) {
  return function (req, res, next) {
    if (roles.includes(req.auth.role)) {
      return next();
    }
    return res.status(403).json({ success: false, message: "You don't have access to this resource" });
  };
}

// True when req.auth belongs to an active SUPER_ADMIN. The tier is re-read from
// the database rather than trusted from the token, so demoting or suspending an
// admin takes effect before their 7-day JWT expires. Exported for the handful of
// routes that branch on the tier inline instead of gating the whole route
// (e.g. GET /api/payroll, which also serves self-service payslips).
async function isSuperAdmin(auth) {
  if (!auth || auth.role !== "admin") return false;
  const account = await Account.findOne({
    id: auth.id,
    role: "admin",
    adminRole: "SUPER_ADMIN",
    status: "active",
  });
  return Boolean(account);
}

// Use after requireAuth + requireRole("admin") - gates the admin roster itself,
// review moderation and payroll management.
async function requireSuperAdmin(req, res, next) {
  try {
    if (!(await isSuperAdmin(req.auth))) {
      return res.status(403).json({ success: false, message: "Super admin access is required" });
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

// Use after requireAuth on state-changing routes. Suspending an account only
// blocks the next *login* - an already-issued JWT stays valid for 7 days - so
// without this a suspended seller/customer keeps working until it expires. The
// status is re-read from the database on every request, same as the tier above.
// Delivery partners live in their own collection and are covered by
// requireActivePartner in routes/deliveryPartners.js instead.
async function requireActiveAccount(req, res, next) {
  try {
    const account = await Account.findOne({ id: req.auth.id }, "status role");
    // Not an Account at all (e.g. a delivery partner token) - nothing to check
    // here, so leave it to the route's own role guard.
    if (!account) return next();
    if (account.status !== "active") {
      return res.status(403).json({
        success: false,
        message: account.status === "suspended"
          ? "This account is suspended. Contact a platform administrator to restore access."
          : "This account is no longer active.",
      });
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

const PARTNER_STATUS_MESSAGE = {
  suspended: "This delivery partner account is suspended. You can request a review from the app.",
  deactivated: "This delivery partner account has been deactivated by an administrator.",
};

// The delivery-partner counterpart to requireActiveAccount. Partners live in
// their own collection, so requireActiveAccount never sees them. Use after
// requireAuth on anything a suspended/deactivated partner must not be able to
// do - their JWT stays valid for 7 days after an admin acts on the account.
async function requireActivePartner(req, res, next) {
  try {
    const partner = await DeliveryPartner.findOne({ id: req.auth.id }, "accountStatus");
    // Not a partner (an admin acting on a delivery route) - leave it to the
    // route's own role guard.
    if (!partner) return next();
    const status = partner.accountStatus || "active";
    if (status !== "active") {
      return res.status(403).json({ success: false, accountStatus: status, message: PARTNER_STATUS_MESSAGE[status] });
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { signToken, getAuthFromHeader, requireAuth, requireSelfOrAdmin, requireRole, isSuperAdmin, requireSuperAdmin, requireActiveAccount, requireActivePartner, SYSTEM_SUPER_ADMIN_EMAIL };
