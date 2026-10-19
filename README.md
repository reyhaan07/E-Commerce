# ShopSphere — Multi-Vendor E-Commerce Platform

ShopSphere is an enterprise-grade multi-vendor e-commerce platform featuring five modern React web applications backed by a centralized Node.js/Express and MongoDB service. The system is designed with a unified, professional black-and-blue design language (`#0f172a` slate-900 chrome, `#1e293b` borders, and `#2563eb` royal blue accents) across all interfaces.

---

## 🏛️ System Architecture & Port Map

ShopSphere divides functionality into distinct, specialized applications sharing a central database, authentication service, and WebSocket layer:

```
                                  ┌───────────────────────────┐
                                  │   ShopSphere Backend      │
                                  │   Node.js / Express / DB  │
                                  │   Port: 5000              │
                                  └─────────────┬─────────────┘
                                                │
         ┌──────────────────┬───────────────────┼───────────────────┬──────────────────┐
         │                  │                   │                   │                  │
         ▼                  ▼                   ▼                   ▼                  ▼
┌─────────────────┐┌─────────────────┐┌─────────────────┐┌─────────────────┐┌─────────────────┐
│ Customer Store  ││ Seller Portal   ││ Admin Console   ││ Delivery Console││ Shared Auth App │
│ React / Vite    ││ React / Vite    ││ React / Vite    ││ React / Vite    ││ React / Vite    │
│ Port: 5175      ││ Port: 5174      ││ Port: 5173      ││ Port: 5176      ││ Port: 5177      │
└─────────────────┘└─────────────────┘└─────────────────┘└─────────────────┘└─────────────────┘
```

| Application | Port | Directory | Tech Stack | Role & Target Audience |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | `5000` | `backend/` | Node.js, Express, MongoDB/Mongoose, Socket.io, JWT | REST APIs, WebSockets, MongoDB, Razorpay |
| **Admin Console** | `5173` | `frontend/admin/` | React 18, Vite, Tailwind CSS, Lucide / React Icons | Platform operations, moderation, fleet & approvals |
| **Seller Portal** | `5174` | `frontend/seller/` | React 18, Vite, Redux Toolkit, Tailwind CSS | Catalog management, stock steppers, orders & analytics |
| **User Storefront** | `5175` | `frontend/user/` | React 18, Vite, Tailwind CSS, Framer Motion | Product discovery, cart, Razorpay checkout & tracking |
| **Delivery Console**| `5176` | `frontend/delivery/`| React 18, Vite, Pure CSS Modules, Socket.io Client | Dispatch orders, pickup & delivery, partner fleet |
| **Shared Auth App** | `5177` | `frontend/login/` | React 18, Vite, Tailwind CSS, React Icons | Multi-role credential router, OTP & password reset |

---

## 🎨 Unified Design System

All 5 platforms adhere to an authoritative design system:
- **Primary Chrome / Sidebar:** `#0f172a` (Slate-900 dark tone)
- **Dividers & Surface Tiles:** `#1e293b` / `#334155`
- **Brand & Active Pills:** `#2563eb` (Royal Blue)
- **Backgrounds:** Clean, responsive surface layers (`#f8fafc` / `#ffffff`)
- **Typography & Icons:** Modern system sans-serif typography with professional SVG iconography (`react-icons`). All raw emojis have been removed for an enterprise aesthetic.

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v20 or higher
- **MongoDB**: Local MongoDB community service running at `mongodb://127.0.0.1:27017` (or remote URI via `.env`)

### 2. Installation
Install root dependencies and all 5 sub-applications in a single command:

```bash
# Clone the repository
cd E-Commerce

# Install dependencies across backend and all frontends
npm install
npm run install:all
```

### 3. Environment Setup
Configure your environment variables in `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/shopsphere
JWT_SECRET=shopsphere-test-secret-key-12345
LOGIN_APP_URL=http://localhost:5177
RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET=your_razorpay_secret_here
```

### 4. Running the Platform
Start the backend and all five frontend portals concurrently:

```bash
npm run dev
# or
npm run dev:all
```

On first run, the backend will automatically seed empty collections with a complete realistic world (44 categories, 440 products, 62 active orders, 20 sellers, 20 delivery partners, and 20 users).

To drop and re-seed the database at any time:
```bash
cd backend
npm run reseed
```

### 5. Production Build
Verify all production bundles across all frontends:
```bash
npm run build:all
```

---

## 🔑 Demo Logins

A complete roster of pre-seeded accounts is documented in [`DEMO_LOGINS.md`](./DEMO_LOGINS.md).

Quickest path to explore each portal:
- **Admin**: `admin@shopsphere.com` / `admin1234` ([http://localhost:5173](http://localhost:5173))
- **Seller**: `seller@shopsphere.com` / `seller1234` ([http://localhost:5174](http://localhost:5174))
- **Customer**: `aditi@example.com` / `aditi123` ([http://localhost:5175](http://localhost:5175))
- **Delivery**: `ravi.delivery@shopsphere.com` / `ravi123` ([http://localhost:5176](http://localhost:5176))
- **Role Chooser**: [http://localhost:5177](http://localhost:5177)

---

## 📦 Key Platform Modules & Workflows

### 1. Product Approval & Autonomous Stock Management
- **Initial Approval Workflow**: When a seller submits a brand new product listing (`POST /api/products`), it starts in `approvalStatus: "Pending"` and appears in the admin approval queue.
- **Autonomous Stock Steppers**: Increasing or decreasing stock does **not** require admin intervention. Sellers can increment/decrement stock directly in the table row using `[-]` / `[+]` stepper buttons or via the Inventory page. Updates maintain `Approved` status without sending listings back to review.

### 2. Multi-Vendor Order Fulfillment & Dispatch Pipeline
1. **Order Placed**: Customer checks out on `:5175` via Razorpay online payment or COD. Order enters `Processing`.
2. **Seller Confirmation**: Seller reviews order on `:5174`, packages the items, marks `Ready For Dispatch`, and requests pickup.
3. **Admin Assignment**: Admin assigns a nearby active delivery partner on `:5173` based on pincode catchments. Order advances to `Assigned`.
4. **Delivery Progression**: Partner receives the assignment on `:5176` and advances the timeline:
   `Accepted` ➔ `Picked Up` ➔ `In Transit` ➔ `Out For Delivery` ➔ `Delivered`.
   Timelines update across customer, seller, and admin dashboards via WebSockets in real time.

### 3. Delivery Fleet Partner Onboarding
- Self-serve registration at `http://localhost:5176/register`.
- Partners register their personal details, phone number, vehicle type, bike/vehicle model (e.g. Honda Activa 6G), and registration number plate (e.g. TN-01-AB-1234).
- Secure document uploads for **Driving License** and **Vehicle RC Book** supporting both PDF viewports and image previews.
- Platform administrators inspect credentials and verify documents inside the admin delivery partner console.

### 4. Payments, Cancellations & Reverse Logistics
- **Razorpay Sandbox Integration**: Seamless online payment modal integration with HMAC-SHA256 signature verification in `backend/utils/razorpay.js`.
- **Cancellations**: Customer-initiated cancellations before dispatch automatically record refunds and restore stock.
- **Returns & Reverse Pickups**: Multi-step return pipeline:
  `Requested` ➔ `Admin Review` ➔ `Seller Approved` ➔ `Reverse Pickup Scheduled` ➔ `Picked Up` ➔ `Inspected` ➔ `Refund Approved`.

---

## 📁 Repository Directory Layout

```
E-Commerce/
├── backend/                  # Express REST API, MongoDB models, WebSockets, Razorpay
│   ├── config/               # Database connection
│   ├── data/                 # Seed catalogs, sellers, delivery fleets, users
│   ├── middleware/           # JWT authentication, role verification, async error handling
│   ├── models/               # Mongoose schemas (Accounts, Products, Orders, Returns, etc.)
│   ├── routes/               # API endpoints (Auth, Products, Orders, Payroll, Admin, etc.)
│   └── utils/                # Razorpay helpers, email dispatch
├── frontend/
│   ├── admin/                # Platform management console (Port 5173)
│   ├── seller/               # Vendor inventory, catalog & orders console (Port 5174)
│   ├── user/                 # E-commerce customer storefront (Port 5175)
│   ├── delivery/             # Delivery dispatch fleet console (Port 5176)
│   └── login/                # Universal multi-role authentication router (Port 5177)
├── DEMO_LOGINS.md            # Comprehensive reference of all demo account credentials
├── package.json              # Monorepo scripts for install, dev, and build
└── README.md                 # Primary system documentation
```

---

## 🔒 Security & Best Practices
- **Password Protection**: Industry-standard bcrypt password hashing across all user, seller, admin, and delivery accounts.
- **Role-Based Access Control**: Strict middleware verification (`requireRole('admin')`, `requireRole('seller')`, etc.) guarding privileged endpoints.
- **Safe Stock Updates**: Direct stock patch endpoints restricted to authorized store owners and platform moderators.
- **Integrity**: All customer orders, delivery transitions, and payments are recorded with audit logs.
