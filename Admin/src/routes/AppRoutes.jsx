import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ProductListing from "../pages/ProductListing";
import ProductDetails from "../pages/ProductDetails";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Orders from "../pages/Orders";
import Wishlist from "../pages/Wishlist";
import Profile from "../pages/Profile";

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
import DeliveryPartners from "../pages/admin/DeliveryPartners";
import DeliveryAssignment from "../pages/admin/DeliveryAssignment";
import DeliveryTracking from "../pages/admin/DeliveryTracking";
import DeliveryAnalytics from "../pages/admin/DeliveryAnalytics";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/products" element={<ProductListing />} />
      <Route path="/product/:id" element={<ProductDetails />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="sellers" element={<SellerManagement />} />
        <Route path="seller-verification" element={<SellerVerification />} />
        <Route path="product-approval" element={<ProductApproval />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="orders" element={<OrderMonitoring />} />
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
