import React from 'react'
import { FiSearch } from 'react-icons/fi'

// Search input with a leading icon. `wrapperClass` controls width/growth.
export default function SearchBar({ value, onChange, placeholder = 'Search…', wrapperClass = 'flex-1', ...rest }) {
  return (
    <div className={`relative ${wrapperClass}`}>
      <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-faint)' }} />
      <input
        type="text"
        className="input pl-9"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </div>
  )
}
