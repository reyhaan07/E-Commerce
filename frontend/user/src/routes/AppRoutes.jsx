import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ProductListing from '../pages/ProductListing';
import ProductDetails from '../pages/ProductDetails';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import Wishlist from '../pages/Wishlist';
import Profile from '../pages/Profile';
import TrackOrder from '../pages/TrackOrder';
import { useAuth } from '../hooks/useAuth';

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    const target = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${target}`} replace />;
  }
  return children;
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/products" element={<ProductListing />} />
      <Route path="/product/:id" element={<ProductDetails />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
      {/* The standalone Orders page is retired — My Orders lives inside the
          Profile layout so the account sidebar stays visible. Redirected rather
          than removed so old links and bookmarks still land somewhere sensible. */}
      <Route path="/orders" element={<Navigate to="/profile?tab=orders" replace />} />
      <Route path="/wishlist" element={<RequireAuth><Wishlist /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="/track-order" element={<RequireAuth><TrackOrder /></RequireAuth>} />
      <Route path="/track-order/:id" element={<RequireAuth><TrackOrder /></RequireAuth>} />
    </Routes>
  );
};

export default AppRoutes;
