import React from 'react'

export default function SidebarFilters(){
  return (
    <aside className="hidden lg:block w-64 p-4 space-y-4">
      <div className="p-3 glass rounded-lg-smooth">
        <h4 className="font-semibold mb-2">Categories</h4>
        <ul className="space-y-2 text-sm text-white/70">
          <li className="cursor-pointer hover:text-white">All</li>
          <li className="cursor-pointer hover:text-white">Clothing</li>
          <li className="cursor-pointer hover:text-white">Accessories</li>
          <li className="cursor-pointer hover:text-white">Electronics</li>
        </ul>
      </div>
      <div className="p-3 glass rounded-lg-smooth">
        <h4 className="font-semibold mb-2">Price</h4>
        <div className="text-sm text-white/70">₹0 - ₹10,000</div>
      </div>
      <div className="p-3 glass rounded-lg-smooth">
        <h4 className="font-semibold mb-2">Availability</h4>
        <label className="text-sm"><input type="checkbox" className="mr-2"/>In stock</label>
      </div>
    </aside>
  )
}
