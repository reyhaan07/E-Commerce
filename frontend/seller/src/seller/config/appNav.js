import {
  FiGrid, FiBox, FiLayers, FiShoppingBag, FiBarChart2,
  FiShoppingCart, FiTag, FiCreditCard, FiSettings, FiPlus,
} from 'react-icons/fi'

// Sibling dev-server origins. The seller app runs on its own port; the shared
// login page and the public storefront live elsewhere.
export const SHARED_LOGIN_URL = 'http://localhost:5177'
export const STOREFRONT_URL = 'http://localhost:5175'

// Single source of truth for the sidebar + breadcrumb + mobile nav.
// `to` = internal route, `href` + external = opens the storefront app.
export const NAV_ITEMS = [
  { to: '/seller/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/seller/products',  label: 'Products',  icon: FiBox },
  { to: '/seller/inventory', label: 'Inventory', icon: FiLayers },
  { to: '/seller/orders',    label: 'Orders',    icon: FiShoppingBag, badge: 'orders' },
  { to: '/seller/analytics', label: 'Analytics', icon: FiBarChart2 },
  { href: STOREFRONT_URL,    label: 'Storefront', icon: FiShoppingCart, external: true },
  { to: '/seller/discounts', label: 'Discounts', icon: FiTag },
  { to: '/seller/payouts',   label: 'Payouts',   icon: FiCreditCard },
  { to: '/seller/settings',  label: 'Settings',  icon: FiSettings },
]

// Items surfaced in the phone bottom-bar (the rest live in the drawer).
export const MOBILE_NAV = [
  { to: '/seller/dashboard', label: 'Home',      icon: FiGrid },
  { to: '/seller/products',  label: 'Products',  icon: FiBox },
  { to: '/seller/orders',    label: 'Orders',    icon: FiShoppingBag, badge: 'orders' },
  { to: '/seller/inventory', label: 'Stock',     icon: FiLayers },
  { to: '/seller/analytics', label: 'Insights',  icon: FiBarChart2 },
]

export const QUICK_ACTIONS = [
  { label: 'Add Product',      icon: FiPlus,        to: '/seller/products?new=1' },
  { label: 'Manage Inventory', icon: FiLayers,      to: '/seller/inventory' },
  { label: 'View Orders',      icon: FiShoppingBag, to: '/seller/orders' },
  { label: 'Analytics',        icon: FiBarChart2,   to: '/seller/analytics' },
  { label: 'View Storefront',  icon: FiShoppingCart, href: STOREFRONT_URL, external: true },
]
