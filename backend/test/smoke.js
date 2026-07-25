// Smoke test — hits the running backend and checks the core happy paths that
// used to be verified by hand with curl: the product catalog loads, all four
// roles can log in, and user registration works (or correctly rejects a dup).
//
// Requires the API to be up first:  npm run dev   (from the repo root)
// Then, from backend/:              npm test
//
// Override the target with API_URL, e.g. API_URL=http://localhost:5000 npm test

const BASE = process.env.API_URL || "http://localhost:5000";

// Headline demo accounts (full table in README.md). /api/login needs the role.
const CREDS = [
  { role: "user", email: "aditi@example.com", password: "aditi123" },
  { role: "seller", email: "seller@shopsphere.com", password: "seller1234" },
  { role: "admin", email: "admin@shopsphere.com", password: "admin1234" },
  { role: "delivery", email: "ravi.delivery@shopsphere.com", password: "ravi123" },
];

let passed = 0;
let failed = 0;
const ok = (name) => { passed++; console.log(`  PASS  ${name}`); };
const bad = (name, detail) => { failed++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`); };

async function api(path, opts) {
  const res = await fetch(`${BASE}${path}`, opts);
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON body */ }
  return { status: res.status, body };
}

const postJson = (path, payload) =>
  api(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

async function main() {
  console.log(`ShopSphere smoke test -> ${BASE}\n`);

  // 1) Product catalog loads
  {
    const { status, body } = await api("/api/products");
    if (status === 200 && body && body.success && Array.isArray(body.products) && body.products.length > 0) {
      ok(`GET /api/products (${body.products.length} returned)`);
    } else {
      bad("GET /api/products", `status ${status}`);
    }
  }

  // 2) Login for every role issues a token
  for (const c of CREDS) {
    const { status, body } = await postJson("/api/login", c);
    if (status === 200 && body && body.success && body.token && body.role === c.role) {
      ok(`POST /api/login (${c.role})`);
    } else {
      bad(`POST /api/login (${c.role})`, (body && body.message) || `status ${status}`);
    }
  }

  // 3) Registration — a fresh run creates the account and returns a token; a
  //    repeat run must hit the duplicate-email guard. Both are correct.
  {
    const { status, body } = await postJson("/api/register", {
      name: "Smoke Test",
      email: "smoke.register@example.test",
      password: "smoke-pass-123",
    });
    if (status === 201 && body && body.success && body.token) {
      ok("POST /api/register (created + token)");
    } else if (status === 400 && body && /already exists/i.test(body.message || "")) {
      ok("POST /api/register (duplicate correctly rejected)");
    } else {
      bad("POST /api/register", (body && body.message) || `status ${status}`);
    }
  }

  console.log(`\n${failed === 0 ? "OK" : "FAILED"} — ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(`\nCould not reach the API at ${BASE}.`);
  console.error(`  ${err.message}`);
  console.error("Is the backend running?  npm run dev");
  process.exit(1);
});
