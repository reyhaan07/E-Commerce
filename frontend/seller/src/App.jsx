import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import SellerLayout from './seller/layouts/SellerLayout'
import DashboardPage from './seller/pages/Dashboard/index'
import ProductsPage  from './seller/pages/Products/index'
import InventoryPage from './seller/pages/Inventory/index'
import OrdersPage    from './seller/pages/Orders/index'
import ProfilePage   from './seller/pages/Profile/index'
import SettingsPage  from './seller/pages/Settings/index'
import RegisterPage  from './seller/pages/Auth/Register'
import { useAuth } from './seller/hooks/useAuth'

// Seller runs on its own dev-server origin, separate from the shared login
// page (frontend/login). Unauthenticated visits get a hard redirect there —
// react-router's <Navigate> can't cross origins.
const SHARED_LOGIN_URL = 'http://localhost:5177'

function RequireAuth({ children }) {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      window.location.href = `${SHARED_LOGIN_URL}?role=seller&redirect=${encodeURIComponent(window.location.href)}`
    }
  }, [user])

  if (!user) return null
  return children
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.18, ease: 'easeIn' } },
}

function PageWrapper({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <Routes location={location} key={location.pathname}>
      {/* Public self-serve seller onboarding (Feature 6) — no auth required */}
      <Route path="/seller/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />
      <Route path="/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />
      <Route path="/seller" element={<RequireAuth><SellerLayout /></RequireAuth>}>
        <Route index        element={<PageWrapper><DashboardPage /></PageWrapper>} />
        <Route path="dashboard" element={<PageWrapper><DashboardPage /></PageWrapper>} />
        <Route path="products"  element={<PageWrapper><ProductsPage /></PageWrapper>} />
        <Route path="inventory" element={<PageWrapper><InventoryPage /></PageWrapper>} />
        <Route path="orders"    element={<PageWrapper><OrdersPage /></PageWrapper>} />
        <Route path="profile"   element={<PageWrapper><ProfilePage /></PageWrapper>} />
        <Route path="settings"  element={<PageWrapper><SettingsPage /></PageWrapper>} />
      </Route>
      <Route path="/" element={<Navigate to="/seller" replace />} />
      <Route path="*" element={<Navigate to="/seller" replace />} />
    </Routes>
  )
}
