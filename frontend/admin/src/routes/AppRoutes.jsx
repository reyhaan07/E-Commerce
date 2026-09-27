import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import AdminLayout from "../layouts/AdminLayout";

import Dashboard from "../pages/admin/Dashboard";
import UserManagement from "../pages/admin/UserManagement";
import SellerManagement from "../pages/admin/SellerManagement";
import ProductManagement from "../pages/admin/ProductManagement";
import OrderMonitoring from "../pages/admin/OrderMonitoring";
import AnalyticsDashboard from "../pages/admin/AnalyticsDashboard";
import SellerVerification from "../pages/admin/SellerVerification";
import ProductApproval from "../pages/admin/ProductApproval";
import DeliveryPartners from "../pages/admin/DeliveryPartners";
import DeliveryAssignment from "../pages/admin/DeliveryAssignment";
import DeliveryTracking from "../pages/admin/DeliveryTracking";
import DeliveryAnalytics from "../pages/admin/DeliveryAnalytics";
import DeliveryCoverage from "../pages/admin/DeliveryCoverage";
import Payroll from "../pages/admin/Payroll";
import AdminProfile from "../pages/admin/AdminProfile";
import AdminManagement from "../pages/admin/AdminManagement";

// The shared login page lives in its own app (frontend/login) on its own
// dev-server origin, so unauthenticated visits need a hard redirect there —
// react-router's <Navigate> can't cross origins.
const SHARED_LOGIN_URL = "http://localhost:5177";

function RedirectToLogin() {
  useEffect(() => {
    window.location.href = `${SHARED_LOGIN_URL}?role=admin&redirect=${encodeURIComponent(window.location.href)}`;
  }, []);
  return null;
}

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <RedirectToLogin />;
  return children;
}

// Client-side gate for super-admin-only screens (admin roster, payroll). It
// only hides the screen — /api/admin/admins and the /api/payroll roster enforce
// the tier server-side, so a normal admin gains nothing by forcing the URL.
function RequireSuperAdmin({ children }) {
  const { isSuperAdmin } = useAuth();
  if (!isSuperAdmin) return <Navigate to="/admin/dashboard" replace />;
  return children;
}

export default function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/admin/dashboard" replace /> : <RedirectToLogin />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="sellers" element={<SellerManagement />} />
        <Route path="seller-verification" element={<SellerVerification />} />
        <Route path="product-approval" element={<ProductApproval />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="orders" element={<OrderMonitoring />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="delivery-partners" element={<DeliveryPartners />} />
        <Route path="delivery-assignment" element={<DeliveryAssignment />} />
        <Route path="delivery-tracking" element={<DeliveryTracking />} />
        <Route path="delivery-analytics" element={<DeliveryAnalytics />} />
        <Route path="delivery-coverage" element={<DeliveryCoverage />} />
        <Route path="payroll" element={<RequireSuperAdmin><Payroll /></RequireSuperAdmin>} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="admins" element={<RequireSuperAdmin><AdminManagement /></RequireSuperAdmin>} />
        {/* Unknown console path (an old bookmark such as the removed
            /admin/reviews, or a typo) lands on the dashboard rather than
            rendering an empty shell. */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
