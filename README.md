# ShopSphere

A multi-vendor e-commerce demo platform — one Express/MongoDB backend and five React apps, fully
populated with a realistic marketplace: **44 categories, 440 products across 20 seller stores, 62
orders in every lifecycle state, 111 reviews, live cancellations and returns.** Everything runs
locally with test data and sandbox credentials only.

## Architecture

| Component | Path | Stack | Port |
|---|---|---|---|
| Backend API | `backend` | Node.js + Express + Mongoose (MongoDB), JWT + bcrypt, Socket.io, Nodemailer, Razorpay (test mode) | 5000 |
| Admin Panel | `frontend/admin` | React + Vite + Tailwind | 5173 |
| Seller Console | `frontend/seller` | React + Vite + Redux + Tailwind | 5174 |
| User Storefront | `frontend/user` | React + Vite + Tailwind + framer-motion | 5175 |
| Delivery Console | `frontend/delivery` | React + Vite | 5176 |
| Shared Login | `frontend/login` | React + Vite + Tailwind | 5177 |

## What's new — auth, profiles, delivery history, payroll & seller onboarding

- **Role-specific login** — the shared login app now has a role chooser plus dedicated
  `/login/user`, `/login/seller`, `/login/delivery`, `/login/admin` screens (the old `?role=` /
  `?redirect=` deep links still work).
- **Seller onboarding with verification** — self-serve multi-step registration
  (`POST /api/register/seller`) that validates GSTIN/PAN and required documents; the admin's
  **Seller Verification** page previews the documents and approves/rejects (with reason), notifying
  the seller. Publishing products is gated behind `verificationStatus === "Verified"`, and a pending
  banner shows across the seller app.
- **Profiles for every role** — real, editable profile pages for seller, admin and delivery partner,
  backed by `GET/PATCH /api/users/me` and `GET/PATCH /api/delivery-partners/me`.
- **Delivery history** — the delivery console gains **Profile** and **History** tabs: lifetime stat
  tiles and a filterable list of completed / cancelled / returned jobs
  (`GET /api/orders?history=true&deliveryPartnerId=…`).
- **Payroll** — a new admin **Payroll** page and `/api/payroll` API: generate a month's payroll,
  auto-count each partner's delivered orders, tune base/incentive/deductions, and mark rows Paid
  (which notifies the staff member and surfaces their payslip in the delivery Profile tab).

## Setup

Requirements: Node 20+, a local MongoDB on `mongodb://127.0.0.1:27017` (or set `MONGO_URI`).

```bash
npm install            # root tooling (concurrently)
npm run install:all    # deps for backend + all five apps
cp backend/.env.example backend/.env   # then set JWT_SECRET
npm run dev            # backend + all five apps on the ports above
```

On first start the backend seeds the entire demo world (only into empty collections).

**Reseed from scratch** — drops the database and rebuilds the identical world (deterministic, fixed
timestamps). Run whenever the data gets messy from testing:

```bash
cd backend && npm run reseed
```

> **Upgrading an existing database?** Delivery-partner passwords are now bcrypt-hashed (previously
> stored as plain text). Databases seeded before this change must be reseeded (`npm run reseed`) so
> partner logins keep working.

### Environment variables (`backend/.env`)

| Variable | Purpose | Default behaviour when unset |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/shopsphere` |
| `PORT` | API port | `5000` |
| `JWT_SECRET` | JWT signing secret | **required** |
| `LOGIN_APP_URL` | Shared login origin (reset links) | `http://localhost:5177` |
| `SMTP_*` | Nodemailer SMTP | all email printed to the backend console |
| `RAZORPAY_KEY_ID/SECRET` | Razorpay **test** keys | built-in mock checkout, real HMAC verification |

## Demo credentials

Password pattern: users/admins/partners use `<firstname>123` (padded to 8 chars where needed, e.g.
`amit1234`, `dev12345`); sellers use the store keyword + `1234`. The headline accounts:

| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | `admin@shopsphere.com` | `admin1234` | Platform Administrator |
| Seller | `seller@shopsphere.com` | `seller1234` | TechNova Electronics (seller-1) |
| User | `aditi@example.com` | `aditi123` | Has orders in most states |
| Delivery | `ravi.delivery@shopsphere.com` | `ravi123` | Chennai zone (partner-1) |

<details><summary><b>All 20 users</b></summary>

`aditi@example.com`/`aditi123` · `rahul@example.com`/`rahul123` · `priya.sharma@example.com`/`priya123` ·
`arjun.mehta@example.com`/`arjun123` · `sneha.iyer@example.com`/`sneha123` · `vikram.singh@example.com`/`vikram123` ·
`ananya.das@example.com`/`ananya123` · `karthik.reddy@example.com`/`karthik123` · `ishita.banerjee@example.com`/`ishita123` ·
`rohan.kulkarni@example.com`/`rohan123` · `meera.pillai@example.com`/`meera123` · `aakash.gupta@example.com`/`aakash123` ·
`divya.menon@example.com`/`divya123` · `siddharth.joshi@example.com`/`siddharth123` · `nisha.agarwal@example.com`/`nisha123` ·
`farhan.khan@example.com`/`farhan123` · `lakshmi.raman@example.com`/`lakshmi123` · `dev.patel@example.com`/`dev12345` ·
`tanvi.deshpande@example.com`/`tanvi123` · `harpreet.kaur@example.com`/`harpreet123`
</details>

<details><summary><b>All 20 seller stores</b></summary>

TechNova Electronics `seller@shopsphere.com`/`seller1234` · PixelPort Mobiles `contact@pixelport.example.com`/`pixel1234` ·
ByteWorks Computing `sales@byteworks.example.com`/`byte1234` · LensCraft Studio `hello@lenscraft.example.com`/`lens1234` ·
SoundWave Audio `care@soundwave.example.com`/`sound1234` · HomeCraft Living `support@homecraft.example.com`/`home1234` ·
BrightNest Appliances `orders@brightnest.example.com`/`nest1234` · SpiceRoute Kitchen `team@spiceroute.example.com`/`spice1234` ·
UrbanWeave Fashion `style@urbanweave.example.com`/`weave1234` · StrideZone Footwear `walk@stridezone.example.com`/`stride1234` ·
TimeAxis Watches `tick@timeaxis.example.com`/`time1234` · GlowLeaf Beauty `glow@glowleaf.example.com`/`glow1234` ·
FitPulse Sports `coach@fitpulse.example.com`/`pulse1234` · PageTurner Books `read@pageturner.example.com`/`page1234` ·
LittleSprouts Baby `care@littlesprouts.example.com`/`sprout1234` · AutoMoto Hub `garage@automoto.example.com`/`moto1234` ·
PetJoy Supplies `woof@petjoy.example.com`/`pet1234` · MelodyMakers Instruments `jam@melodymakers.example.com`/`melody1234` ·
OfficeMate Supplies `desk@officemate.example.com`/`office1234` · FestiveNest Gifting `joy@festivenest.example.com`/`gift1234`
</details>

<details><summary><b>All 20 admins</b></summary>

`admin@shopsphere.com`/`admin1234` (Platform Admin) · `rajesh.ops@`/`rajesh123` (Operations) ·
`sunita.catalog@`/`sunita123`, `amit.catalog@`/`amit1234` (Catalog Moderators) ·
`kavya.refunds@`/`kavya123`, `manoj.refunds@`/`manoj123` (Refund Officers) ·
`pooja.logistics@`/`pooja123`, `sanjay.logistics@`/`sanjay123` (Logistics) ·
`ritika.sellers@`/`ritika123`, `deepak.sellers@`/`deepak123` (Seller Verification) ·
`neha.support@`/`neha1234`, `vivek.support@`/`vivek123` (Support Leads) ·
`shruti.reviews@`/`shruti123` (Review Moderator) · `gaurav.fraud@`/`gaurav123` (Fraud & Risk) ·
`asha.payments@`/`asha1234` (Payments) · `nikhil.growth@`/`nikhil123` (Growth) ·
`swati.data@`/`swati123` (Data & Analytics) · `imran.delivery@`/`imran123` (Delivery Network) ·
`rekha.compliance@`/`rekha123` (Compliance) · `arvind.escalations@`/`arvind123` (Escalations)
— all `@shopsphere.com`
</details>

<details><summary><b>All 20 delivery partners</b></summary>

Ravi Kumar `ravi.delivery@`/`ravi123` (Chennai) · Sunita Sharma `sunita.delivery@`/`sunita123` (Chennai, holds the
seeded reverse pickups) · Mohammed Irfan `irfan.delivery@`/`irfan123` · Ganesh Yadav `ganesh.delivery@`/`ganesh123` ·
Lakhan Singh `lakhan.delivery@`/`lakhan123` · Prakash Jha `prakash.delivery@`/`prakash123` ·
Suresh Babu `suresh.delivery@`/`suresh123` · Anil Kumble `anil.delivery@`/`anil1234` ·
Ramesh Iyer `ramesh.delivery@`/`ramesh123` · Vijay Antony `vijay.delivery@`/`vijay123` ·
Santosh Pawar `santosh.delivery@`/`santosh123` · Kiran Rathod `kiran.delivery@`/`kiran123` ·
Bhavesh Solanki `bhavesh.delivery@`/`bhavesh123` · Dinesh Meena `dinesh.delivery@`/`dinesh123` ·
Sourav Ganguly `sourav.delivery@`/`sourav123` · Alok Verma `alok.delivery@`/`alok1234` ·
Joseph Thomas `joseph.delivery@`/`joseph123` · Narendra Rawat `narendra.delivery@`/`narendra123` ·
Salim Sheikh `salim.delivery@`/`salim123` · Tara Chand `tara.delivery@`/`tara1234`
— all `@shopsphere.com`
</details>

## The seeded world

- **Catalog**: 44 top-level categories (the full Amazon/Flipkart breadth), each with subcategories
  and product types (`Category → Subcategory → Product Type → Product`), ~10 products per category
  (440 total), distributed across all 20 stores by specialty. 9 products sit in the admin approval
  queue; stock mixes healthy, low (<5) and out-of-stock.
- **Orders**: 62 across every state — Processing, Ready For Dispatch (± pickup requested), Assigned,
  Accepted, Picked Up, In Transit, Out For Delivery, Delivered, Completed, Cancelled, Returned.
- **Reviews**: 111 in varied voices (2★–5★), 8 pending moderation; product and seller aggregates are
  recomputed from the approved set at seed time.
- **Cancellations**: 2 awaiting decision, 1 rejected, 2 approved with recorded refunds.
- **Returns**: 8, one at each stage of `Requested → Admin Review → Seller Approved → Pickup
  Scheduled → Picked Up → Under Inspection → Refund Approved → Refunded`.
- **Notifications**: every role's bell has a seeded feed; Socket.io keeps them live.

## 10-minute demo script

1. **Browse & buy** *(no login needed to browse)* — open `http://localhost:5175`. Open the
   **Categories** mega-menu → Beauty & Personal Care → Skincare → Sunscreens. Show breadcrumbs,
   filters, sort. Open a product: seller card, stock state, review distribution. Log in as
   **aditi@example.com / aditi123** (via the login page at `:5177`, card **User**), add to cart,
   checkout with the saved address + **Card** payment (mock Razorpay test flow) → note the new
   `ORD-xxxx` on My Orders.
2. **Register with OTP** *(optional, 1 min)* — from the storefront, Register a new account; read
   the 6-digit code from the backend terminal; verify → you're logged in, and the admin bell shows
   "New user registered" live.
3. **Seller dispatch** — new tab, log in at `:5177` as the store you bought from (e.g. **GlowLeaf
   Beauty — glow@glowleaf.example.com / glow1234**). Orders tab → your new order → **Ready For
   Dispatch** → **Request Pickup**.
4. **Admin assignment** — log in as **admin@shopsphere.com / admin1234** (`:5173`). **Assign
   Deliveries** → pick the order → assign **Ravi Kumar** → a `TRK-xxxx` id is generated and the
   customer is emailed (backend console).
5. **Delivery progression** — log in as **ravi.delivery@shopsphere.com / ravi123** (`:5176`).
   Accept → Picked Up → In Transit → Out For Delivery → Delivered. Keep the user's **Track Order**
   page open side-by-side: the timeline advances live without a refresh.
6. **Review & moderation** — as Aditi, submit a review from My Orders (delivered order). As admin,
   **Review Moderation** → Approve → the product page rating updates.
7. **Cancellation** — as any user with a Processing order (or place a fresh one), **Cancel Order**
   with a reason. As admin, **Refund Tracking** → Approve & Refund → user is notified, stock
   restored.
8. **Return & refund** — admin **Refund Tracking** shows the seeded returns at every stage: walk
   RET-2001 through Start Review → (as the seller) Approve Return → (as admin) schedule the reverse
   pickup with **Sunita Sharma** → (as Sunita, `:5176`) Mark Picked Up → Delivered to Seller → (as
   the seller) inspection **Pass** → (as admin) Approve Refund → **Process Refund** → refund
   recorded, user notified.

## Realtime, email & payments conventions

- Socket.io events fire for orders, status changes, assignments, cancellations, returns, reviews,
  new users and cart activity; admin/seller/delivery dashboards and the user Track Order page
  update live. Clients join rooms via `?role=<role>&userId=<id>`.
- All email (OTP, welcome, order confirmation, tracking, refunds, password reset) goes through
  Nodemailer; without SMTP configured every message prints to the backend console.
- Payments: Razorpay test mode — create order → checkout → server-side HMAC signature verification →
  order recorded; refunds via the test refund API. Without keys, a built-in mock checkout stands in
  (signatures still verified). COD skips the gateway.

## API surface (summary)

- `POST /api/login`, `/register`, `/verify-otp`, `/resend-otp`, `/forgot-password`, `/reset-password`
- `GET/POST/PUT/DELETE /api/products` (+ `/categories` tree, `/:id/stock`, `/:id/approval`) —
  `?q= category subcategory productType minPrice maxPrice minRating sort page limit`
- `GET/POST /api/orders` (+ `sellerId`/`userId`/status filters), `PATCH .../{seller-status,request-pickup,assign,delivery-status,confirm-delivery,complete,cancellation}`, `POST .../cancel`
- `GET/POST /api/reviews`, `PATCH /api/reviews/:id/moderate`
- `GET/POST /api/returns`, `PATCH .../{status,assign-pickup,inspect}`, `POST .../refund`
- `POST /api/payments/create-order`, `/api/payments/mock-pay`
- `GET /api/notifications`, `PATCH .../{:id/read,read-all}`
- `GET/PUT /api/users/:id` (+ addresses, payment methods, cart, wishlist)
- `GET /api/admin/accounts`, `PATCH .../:id/{status,verification}`, `GET /api/admin/stats`
- `GET/POST/PUT/DELETE /api/delivery-partners`

All responses use `{ success, message?, ... }`.
