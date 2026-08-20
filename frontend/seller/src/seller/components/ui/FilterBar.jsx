import React from 'react'

// A card-styled toolbar row that lays out a search field + filter controls.
// Children are the controls (SearchBar, selects, buttons); they wrap on
// narrow screens so nothing is clipped.
export default function FilterBar({ children, className = '' }) {
  return (
    <div className={`card p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 ${className}`}>
      {children}
    </div>
  )
}
