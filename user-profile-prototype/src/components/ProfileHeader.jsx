import React from 'react'
import { FiMenu, FiSearch, FiUser, FiHeart, FiShoppingCart } from 'react-icons/fi'

// Full-width ShopSphere store header: brand + categories, center search,
// and Profile / Wishlist / Cart actions on the right.
export default function ProfileHeader({ onOpenMenu, cartCount = 3 }) {
  return (
    <header className="topbar">
      <button className="hamburger" aria-label="Open account menu" onClick={onOpenMenu}>
        <FiMenu size={20} />
      </button>

      <a className="brand" href="#">
        <span className="brand-mark"><FiShoppingCart size={18} /></span>
        <span className="brand-name">Shop<span>Sphere</span></span>
      </a>

      <button className="topbar-cats"><FiMenu size={18} /><span>Categories</span></button>

      <div className="topbar-search">
        <input type="text" placeholder="Search for products, brands and more..." aria-label="Search" />
        <button className="s-icon" aria-label="Search"><FiSearch size={16} /></button>
      </div>

      <nav className="topbar-actions">
        <button className="top-action"><FiUser size={20} /><span>Profile</span></button>
        <button className="top-action"><FiHeart size={20} /><span>Wishlist</span></button>
        <button className="top-action">
          <FiShoppingCart size={20} /><span>Cart</span>
          {cartCount > 0 && <em className="count">{cartCount}</em>}
        </button>
      </nav>
    </header>
  )
}
