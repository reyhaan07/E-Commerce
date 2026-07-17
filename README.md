# ShopSphere

A multi-role e-commerce demo platform — one backend, five small front-end apps. Everything runs
locally with test data and sandbox credentials only (no real customers, no real payments).

## Architecture

| Component | Path | Stack | Port |
|---|---|---|---|
| Backend API | `backend` | Node.js + Express + Mongoose (MongoDB), JWT + bcrypt, Socket.io, Nodemailer, Razorpay (test mode) | 5000 |
| Admin Panel | `frontend/admin` | React + Vite + Tailwind | 5173 |
| Seller Console | `frontend/seller` | React + Vite + Redux + Tailwind | 5174 |
| User Storefront | `frontend/user` | React + Vite + Tailwind + framer-motion | 5175 |
| Delivery Console | `frontend/delivery` | React + Vite | 5176 |
| Shared Login | `frontend/login` | React + Vite + Tailwind | 5177 |

**Roles:** User (shops, tracks, reviews) · Seller (store, products, inventory, dispatch) ·
Admin (platform control) · Delivery Partner (pickup & delivery).

## Setup

Requirements: Node 20+, a local MongoDB on `mongodb://127.0.0.1:27017` (or set `MONGO_URI`).

```bash
npm install            # root tooling (concurrently)
npm run install:all    # deps for backend + all five apps
cp backend/.env.example backend/.env   # then edit values as needed
npm run dev            # backend + all five apps on the ports above
```

On first start the backend seeds MongoDB with demo data and prints the demo credentials.

### Demo credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@shopsphere.com` | `admin1234` |
| Seller | `seller@shopsphere.com` | `seller1234` |
| User | `aditi@example.com` | `aditi123` |
| User | `rahul@example.com` | `rahul123` |
| Delivery | `ravi.delivery@shopsphere.com` | `ravi123` |
| Delivery | `sunita.delivery@shopsphere.com` | `sunita123` |

### Environment variables (`backend/.env`)

| Variable | Purpose | Default behaviour when unset |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/shopsphere` |
| `PORT` | API port | `5000` |
| `JWT_SECRET` | JWT signing secret | **required** |
| `LOGIN_APP_URL` | Shared login origin used in reset links | `http://localhost:5177` |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Nodemailer SMTP | emails are logged to the backend console |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay **test** keys (`rzp_test_...`) | a built-in mock checkout with real HMAC signature verification |

## Cross-app auth

The apps live on different origins, so localStorage can't be shared. The shared login page
(`:5177`) authenticates any of the 4 roles against `POST /api/login`, then redirects to the
chosen role's app passing `authId`, `authName`, `authEmail`, `authRole`, `authToken` as query
params. Each app's `useAuth` hook consumes the handoff, strips the params from the URL and stores
the session. Only `?redirect=` URLs pointing back into the chosen role's own origin are followed.

## Realtime + email conventions

- Important events (order created, status changed, partner assigned, cancellation/return updates,
  new user registered, cart activity) emit Socket.io events so dashboards refresh live. Clients
  connect with `?role=<role>&userId=<id>` and receive `notification`, `order-created`,
  `order-updated`, `cancellation-updated`, `return-updated`, `cart-activity`, … events.
- All email goes through `backend/utils/mailer.js`: welcome mail, OTP codes, order confirmations,
  tracking/status updates, refund confirmations, password-reset links. Without SMTP configured,
  every message is printed to the backend console (including the registration OTP).
- Payments: Razorpay test mode — create order → checkout → server-side signature verification →
  order recorded. Refunds go through the Razorpay test refund API. Without test keys, a mock
  checkout endpoint stands in and signatures are still verified server-side. COD skips the gateway.

## Core workflows

1. **Register** — form → 6-digit emailed OTP → verified account → admin gets a live new-user
   notification → welcome email → logged in.
2. **Order** — cart/Buy Now → address → payment (Razorpay test or COD) → signature verified →
   `ORD-xxxx` created, stock decremented → admin + seller notified live → seller marks
   *Ready For Dispatch* → *Request Pickup* → admin assigns a delivery partner → `TRK-xxxx`
   tracking id emailed → partner advances `Assigned → Accepted → Picked Up → In Transit →
   Out For Delivery → Delivered` → seller confirms → admin completes.
3. **Review** — only for delivered orders → admin moderation (Pending → Approved/Rejected) →
   approved reviews publish and recalculate the product + seller rating aggregates.
4. **Cancellation** — user requests while not shipped → admin + seller notified → approve
   (Razorpay test refund for prepaid, restock) or reject (user notified with reason).
5. **Return/refund** — delivered orders → `Requested → Admin Review → Seller Approved →
   Pickup Scheduled → Picked Up → Under Inspection → Refund Approved → Refunded` (or `Rejected`),
   with a reverse delivery-partner pickup, seller inspection, and a recorded refund.

## API surface (summary)

- `POST /api/login`, `/register`, `/verify-otp`, `/resend-otp`, `/forgot-password`, `/reset-password`
- `GET/POST/PUT/DELETE /api/products` (+ `/categories`, `/:id/stock`, `/:id/approval`) — search
  `?q=`, filters `category/minPrice/maxPrice/minRating`, `sort=newest|price_asc|price_desc|rating`,
  `page/limit` pagination
- `GET/POST /api/orders`, `PATCH /api/orders/:id/{seller-status,request-pickup,assign,delivery-status,confirm-delivery,complete,cancellation}`, `POST /api/orders/:id/cancel`
- `GET/POST /api/reviews`, `PATCH /api/reviews/:id/moderate`
- `GET/POST /api/returns`, `PATCH /api/returns/:id/{status,assign-pickup,inspect}`, `POST /api/returns/:id/refund`
- `POST /api/payments/create-order`, `POST /api/payments/mock-pay`
- `GET /api/notifications`, `PATCH /api/notifications/{:id/read,read-all}`
- `GET/PUT /api/users/:id` (+ addresses, payment methods, cart, wishlist, reviews sub-resources)
- `GET /api/admin/accounts`, `PATCH /api/admin/accounts/:id/status`, `GET /api/admin/stats`
- `GET/POST/PUT/DELETE /api/delivery-partners`

All responses use the shape `{ success, message?, ... }`.
