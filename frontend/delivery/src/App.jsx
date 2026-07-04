import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import DeliveryLayout from './layouts/DeliveryLayout'
import Login from './pages/Auth/Login'
import DashboardPage from './pages/Dashboard/index'
import AssignedOrdersPage from './pages/AssignedOrders/index'
import OrderDetailsPage from './pages/OrderDetails/index'
import HistoryPage from './pages/History/index'
import ProfilePage from './pages/Profile/index'
import { useAuth } from './hooks/useAuth'

function RequireAuth({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/delivery/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/delivery/login" element={<Login />} />

      <Route
        path="/delivery"
        element={
          <RequireAuth>
            <DeliveryLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="orders" element={<AssignedOrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailsPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="/" element={<Navigate to="/delivery" replace />} />
      <Route path="*" element={<Navigate to="/delivery" replace />} />
    </Routes>
  )
}
