import React from 'react'

export function Skeleton({ className = '', rounded = 'rounded-lg' }) {
  return <div className={`skeleton ${rounded} ${className}`} aria-hidden="true" />
}

export function SkeletonCard() {
  return (
    <div className="glass p-5 space-y-3 animate-fade-in" style={{ borderRadius: 20 }}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-10 rounded-2xl" />
      </div>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid rgba(99,112,145,0.07)' }}>
      <td className="px-4 py-4"><Skeleton className="h-4 w-28" /></td>
      <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
      <td className="px-4 py-4"><Skeleton className="h-4 w-16" /></td>
      <td className="px-4 py-4"><Skeleton className="h-5 w-14 rounded-full" /></td>
      <td className="px-4 py-4"><Skeleton className="h-4 w-16" /></td>
    </tr>
  )
}

export function SkeletonProductGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-fade-in p-4 space-y-3"
          style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, boxShadow: 'var(--shadow-sm)' }}>
          <Skeleton className="w-full h-44 rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex justify-between pt-1">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {[100, 80, 60, 70, 60].map((w, i) => (
              <th key={i}><Skeleton className="h-3" style={{ width: w }} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
        </tbody>
      </table>
    </div>
  )
}

export default Skeleton
