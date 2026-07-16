import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Register from '../pages/Register';
import ProductListing from '../pages/ProductListing';
import ProductDetails from '../pages/ProductDetails';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import Orders from '../pages/Orders';
import Wishlist from '../pages/Wishlist';
import Profile from '../pages/Profile';
import TrackOrder from '../pages/TrackOrder';
import { useAuth } from '../hooks/useAuth';

// User runs on its own dev-server origin, separate from the shared login
// page (frontend/login). Unauthenticated visits to account-only pages get a
// hard redirect there — react-router's <Navigate> can't cross origins.
// Browsing (Home/Products/Cart) stays open without login, like a normal storefront.
const SHARED_LOGIN_URL = 'http://localhost:5177';

function RequireAuth({ children }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      window.location.href = `${SHARED_LOGIN_URL}?role=user&redirect=${encodeURIComponent(window.location.href)}`;
    }
  }, [user]);

  if (!user) return null;
  return children;
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/products" element={<ProductListing />} />
      <Route path="/product/:id" element={<ProductDetails />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
      <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
      <Route path="/wishlist" element={<RequireAuth><Wishlist /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="/track-order" element={<RequireAuth><TrackOrder /></RequireAuth>} />
      <Route path="/track-order/:id" element={<RequireAuth><TrackOrder /></RequireAuth>} />
    </Routes>
  );
};

export default AppRoutes;
