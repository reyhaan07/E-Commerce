import React from 'react'
import { NavLink } from 'react-router-dom'
import { FiHome, FiBox, FiShoppingCart, FiUser } from 'react-icons/fi'

export default function MobileBottomNav(){
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-white/4 glass p-2 rounded-xl flex justify-between sm:hidden">
      <NavLink to="/seller" className="p-2 rounded text-white/80 flex-1 text-center">
        <FiHome className="mx-auto" />
        <div className="text-xs mt-1">Home</div>
      </NavLink>
      <NavLink to="/seller/products" className="p-2 rounded text-white/80 flex-1 text-center">
        <FiBox className="mx-auto" />
        <div className="text-xs mt-1">Products</div>
      </NavLink>
      <NavLink to="/seller/orders" className="p-2 rounded text-white/80 flex-1 text-center">
        <FiShoppingCart className="mx-auto" />
        <div className="text-xs mt-1">Orders</div>
      </NavLink>
      <NavLink to="/seller/profile" className="p-2 rounded text-white/80 flex-1 text-center">
        <FiUser className="mx-auto" />
        <div className="text-xs mt-1">Profile</div>
      </NavLink>
    </nav>
  )
}
