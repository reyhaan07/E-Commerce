# ShopSphere — Admin Module

React.js + Vite + Tailwind CSS admin panel for ShopSphere. Talks to the shared Backend for login and for Orders/Delivery Partner data; other admin data (users, sellers, products, refunds, analytics) is still local dummy data.

## Setup

```bash
npm install
npm run dev
```

Then open the printed local URL (typically http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

## Structure

- `src/pages/Login.jsx` — the shared 4-role login (User / Seller / Admin / Delivery Partner), redirects to the matching app on success
- `src/layouts/AdminLayout.jsx` — sidebar + navbar shell for all `/admin/*` routes
- `src/components/AdminSidebar.jsx`, `AdminNavbar.jsx` — admin chrome
- `src/pages/admin/` — Dashboard, User/Seller/Product management, Order Monitoring, Refund Tracking, Analytics, and Delivery Management (Partners, Assignment, Tracking, Analytics)
- `src/api/` — fetch helpers for the shared Orders/Delivery Partner backend API
- `src/routes/AppRoutes.jsx` — all route definitions
