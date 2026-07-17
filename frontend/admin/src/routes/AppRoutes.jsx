import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import AdminLayout from "../layouts/AdminLayout";

import Dashboard from "../pages/admin/Dashboard";
import UserManagement from "../pages/admin/UserManagement";
import SellerManagement from "../pages/admin/SellerManagement";
import ProductManagement from "../pages/admin/ProductManagement";
import OrderMonitoring from "../pages/admin/OrderMonitoring";
import RefundTracking from "../pages/admin/RefundTracking";
import AnalyticsDashboard from "../pages/admin/AnalyticsDashboard";
import SellerVerification from "../pages/admin/SellerVerification";
import ProductApproval from "../pages/admin/ProductApproval";
import ReviewModeration from "../pages/admin/ReviewModeration";
import DeliveryPartners from "../pages/admin/DeliveryPartners";
import DeliveryAssignment from "../pages/admin/DeliveryAssignment";
import DeliveryTracking from "../pages/admin/DeliveryTracking";
import DeliveryAnalytics from "../pages/admin/DeliveryAnalytics";

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
        <Route path="reviews" element={<ReviewModeration />} />
        <Route path="refunds" element={<RefundTracking />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="delivery-partners" element={<DeliveryPartners />} />
        <Route path="delivery-assignment" element={<DeliveryAssignment />} />
        <Route path="delivery-tracking" element={<DeliveryTracking />} />
        <Route path="delivery-analytics" element={<DeliveryAnalytics />} />
      </Route>
    </Routes>
  );
}
