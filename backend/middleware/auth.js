const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = "7d";

function signToken(account) {
  return jwt.sign({ id: account.id, role: account.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
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

module.exports = { signToken, getAuthFromHeader, requireAuth, requireSelfOrAdmin, requireRole };
