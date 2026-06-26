import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import SellerLayout from './seller/layouts/SellerLayout'
import DashboardPage from './seller/pages/Dashboard/index'
import ProductsPage  from './seller/pages/Products/index'
import InventoryPage from './seller/pages/Inventory/index'
import OrdersPage    from './seller/pages/Orders/index'
import ProfilePage   from './seller/pages/Profile/index'
import SettingsPage  from './seller/pages/Settings/index'

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
      <Route path="/seller" element={<SellerLayout />}>
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
