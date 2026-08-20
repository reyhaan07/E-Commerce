const jwt = require("jsonwebtoken");
const { Account } = require("../models/account.model");

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

// Use after requireAuth + requireRole("admin") - gates the admin roster itself.
// The tier is re-read from the database rather than trusted from the token, so
// demoting or suspending an admin takes effect before their 7-day JWT expires.
async function requireSuperAdmin(req, res, next) {
  if (req.auth.role !== "admin") {
    return res.status(403).json({ success: false, message: "Super admin access is required" });
  }
  try {
    const account = await Account.findOne({
      id: req.auth.id,
      role: "admin",
      adminRole: "SUPER_ADMIN",
      status: "active",
    });
    if (!account) {
      return res.status(403).json({ success: false, message: "Super admin access is required" });
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { signToken, getAuthFromHeader, requireAuth, requireSelfOrAdmin, requireRole, requireSuperAdmin, SYSTEM_SUPER_ADMIN_EMAIL };
