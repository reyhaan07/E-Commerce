# Task: Complete the User Account module of ShopSphere (21/21 features)

You are working in an existing monorepo. Read code before changing it — much of
this module already works. Your job is to VERIFY the finished parts and BUILD the
missing parts, not to rewrite working code.

## Project context

- Monorepo: `backend/` (Node.js, Express 5, Mongoose, CommonJS) + `frontend/user`,
  `frontend/seller`, `frontend/admin`, `frontend/delivery`, `frontend/login`
  (all React 19 + Vite; frontend/user styles with Tailwind).
- Dev servers: backend :5000, admin :5173, seller :5174, **user :5175**,
  delivery :5176, shared login app :5177. Run everything with `npm run dev:all`
  from the repo root (the login app runs separately:
  `npm run dev --prefix frontend/login`).
- MongoDB: local `mongodb://127.0.0.1:27017/shopsphere`, auto-seeded on backend
  startup by `backend/data/seed.js` (only when collections are empty).
- Test account: `aditi@example.com` / `aditi123` (role `user`).
- Key files: `backend/models/account.model.js` (the Account schema — it ALREADY
  contains fields for every feature below), `backend/routes/auth.js` (register/
  login/forgot-password/reset-password), `backend/routes/users.js` (profile,
  addresses, payment methods, cart, wishlist, reviews — all JWT-protected),
  `backend/middleware/auth.js`, and `frontend/user/src/` (pages: Profile, Cart,
  Wishlist, Orders, Checkout; API helper: `src/api/client.js`; auth:
  `src/hooks/useAuth.js`).

## Already completed (10 features) — verify, do not rebuild

Unique user ID, full name, email, password (bcrypt), role enum
(admin/seller/user/delivery), phone number, createdAt, lastLogin,
account status enum (active/suspended/deleted), emailVerified flag.
Verify each is visible where it should be (e.g. the Profile page shows phone,
member-since, last login). Fix small display gaps only.

## To complete (11 features) — schema fields already exist for ALL of these

For each: expose it through `backend/routes/users.js` (extend the existing
router patterns and `protect` middleware) and give it real UI in
`frontend/user` (extend the existing Profile/Cart/etc. pages — match their
style: Tailwind classes, react-icons, `apiRequest()` helper).

1. **Profile picture / avatar** — `avatar` field. Let the user set/change it via
    file-upload infrastructure.
2. **Saved addresses** — backend CRUD exists. Ensure the Profile page has full
   add/edit/delete/set-default UI and Checkout offers saved addresses.
3. **Saved payment methods** — backend routes exist. Build the UI (card: label +
   last4 only; UPI: upiId). NEVER accept or store full card numbers or CVV —
   the form should take only last-4 digits for display purposes.
4. **Order history reference** — orders live in `/api/orders?userId=` (JWT
   checked). Verify the Orders page lists the logged-in user's orders and links
   to order detail/tracking.
5. **Cart** — backend + Cart page exist. Verify server-side persistence: log in
   on a fresh browser and the cart must survive. Fix if it's localStorage-only.
6. **Wishlist** — backend + Wishlist page exist. Verify add/remove from product
   cards and the Wishlist page, persisted server-side.
7. **Reviews / ratings authored** — backend GET/POST exist. Add UI: submit a
   rating+comment from a delivered order or product page, and list "My Reviews"
   in the Profile page.
8. **Delivery instructions / preferences** — `deliveryInstructions` field.
   Editable textarea in Profile; shown during Checkout.
9. **Password reset token + expiry** — backend endpoints exist
   (`POST /api/forgot-password`, `POST /api/reset-password`; token is logged to
   the backend console as a mock inbox). Build the missing frontend: a
   forgot-password form and a reset form that takes token + new password. Put
   them in `frontend/login` (it currently has a placeholder "Forgot password?"
   button — wire it up).
10. **Notification preferences** — `notifyByEmail` / `notifyBySms` booleans.
    Toggle switches in Profile, persisted via the profile update route.
11. **Loyalty points** — `loyaltyPoints` field. Display the balance in Profile.
    Award points on order placement (e.g. 1 point per ₹100) in the existing
    order-creation route.

## Hard constraints — breaking any of these is a failed task

- Do NOT touch `frontend/seller`, `frontend/admin`, or `frontend/delivery`.
- Do NOT create any new login/register page. Shared login = `frontend/login`
  (:5177); user registration = `frontend/user` `/register`.
- Preserve the security patterns exactly: the bcrypt pre-save hook and
  `toJSON` transform in `account.model.js` (password/resetToken must never
  appear in any API response), the `protect` ownership middleware on all
  `/api/users/:id/*` routes, and the timing-normalization in `auth.js`.
- Validate all new inputs server-side (types, ranges, enum values) following
  the style already used in `routes/auth.js` and `routes/users.js`.
- No new npm dependencies unless truly unavoidable; if added, explain why.
- Keep `backend/data/seed.js` compatible — the app must still boot cleanly on
  an empty database.
- Match the existing code style of each file you touch.

## Verification (required before you finish)

Start MongoDB + `npm run dev:all`, then walk the real flows in the user app
(:5175) as `aditi@example.com`: update avatar, add/edit/delete an address, add
a payment method, toggle notifications, write delivery instructions, add to
cart + wishlist and confirm persistence after re-login, submit a review, view
loyalty points, and complete the full forgot-password → reset → login-with-new-
password loop from :5177. Registration and login must still work unchanged.

## Deliverable

A short summary listing: new/changed endpoints, changed files, how each of the
11 features was implemented, and anything you verified as already working.
