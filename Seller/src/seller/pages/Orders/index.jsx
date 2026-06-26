import React, { useState, useEffect } from 'react'
import { SkeletonTable } from '../../components/Skeleton'
import EmptyState from '../../components/EmptyState'
import { FiShoppingBag, FiSearch, FiFilter, FiEye } from 'react-icons/fi'

const ordersData = [
  { id: '#ORD-1041', customer: 'Priya Sharma',   items: 3, amount: '₹340', date: 'Jun 19, 2026', status: 'Processing', payment: 'Paid'   },
  { id: '#ORD-1040', customer: 'Arjun Mehta',    items: 1, amount: '₹120', date: 'Jun 19, 2026', status: 'Delivered',  payment: 'Paid'   },
  { id: '#ORD-1039', customer: 'Meera Nair',     items: 5, amount: '₹890', date: 'Jun 18, 2026', status: 'Shipped',    payment: 'Paid'   },
  { id: '#ORD-1038', customer: 'Rohan Gupta',    items: 1, amount: '₹55',  date: 'Jun 18, 2026', status: 'Returned',   payment: 'Refund' },
  { id: '#ORD-1037', customer: 'Sana Kapoor',    items: 2, amount: '₹210', date: 'Jun 17, 2026', status: 'Delivered',  payment: 'Paid'   },
  { id: '#ORD-1036', customer: 'Karan Joshi',    items: 4, amount: '₹475', date: 'Jun 17, 2026', status: 'Processing', payment: 'Paid'   },
  { id: '#ORD-1035', customer: 'Divya Pillai',   items: 1, amount: '₹89',  date: 'Jun 16, 2026', status: 'Cancelled',  payment: 'Refund' },
  { id: '#ORD-1034', customer: 'Vikram Singh',   items: 2, amount: '₹318', date: 'Jun 16, 2026', status: 'Delivered',  payment: 'Paid'   },
  { id: '#ORD-1033', customer: 'Anjali Verma',   items: 1, amount: '₹49',  date: 'Jun 15, 2026', status: 'Shipped',    payment: 'Paid'   },
  { id: '#ORD-1032', customer: 'Rahul Desai',    items: 3, amount: '₹650', date: 'Jun 15, 2026', status: 'Delivered',  payment: 'Paid'   },
]

const STATUSES = ['All', 'Processing', 'Shipped', 'Delivered', 'Returned', 'Cancelled']
const statusClass = { Processing: 'badge-info', Shipped: 'badge-accent', Delivered: 'badge-success', Returned: 'badge-danger', Cancelled: 'badge-neutral' }

export default function Orders() {
  const [loading, setLoading] = useState(true)
  const [query,   setQuery]   = useState('')
  const [status,  setStatus]  = useState('All')

  useEffect(() => { const t = setTimeout(() => setLoading(false), 1300); return () => clearTimeout(t) }, [])

  const filtered = ordersData.filter(o => {
    const matchQ = o.id.toLowerCase().includes(query.toLowerCase()) || o.customer.toLowerCase().includes(query.toLowerCase())
    const matchS = status === 'All' || o.status === status
    return matchQ && matchS
  })

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = s === 'All' ? ordersData.length : ordersData.filter(o => o.status === s).length
    return acc
  }, {})

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Orders</h2>
          <p className="page-subtitle">{ordersData.length} total orders</p>
        </div>
        <button className="btn-ghost">Export CSV</button>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUSES.map(s => (
          <button key={s}
            className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap"
            style={{
              background: status === s ? 'rgba(99,102,241,0.1)' : 'white',
              color: status === s ? 'var(--accent)' : 'var(--text-muted)',
              border: status === s ? '1px solid rgba(99,102,241,0.25)' : '1px solid var(--border)',
              fontWeight: status === s ? 600 : 500,
              boxShadow: status === s ? '0 2px 8px rgba(99,102,241,0.1)' : 'var(--shadow-sm)',
            }}
            onClick={() => setStatus(s)}>
            {s}
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: '#f1f5f9', color: 'var(--text-muted)' }}>{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="glass p-3 flex items-center gap-3" style={{ borderRadius: 16 }}>
        <div className="relative flex-1">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search by order ID or customer…" className="input pl-9 h-9 text-sm"
            value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <button className="btn-ghost h-9 text-sm shrink-0"><FiFilter size={14} /> Filter</button>
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={7} /> : filtered.length === 0 ? (
        <EmptyState icon={<FiShoppingBag />} title="No orders found" description="Try adjusting your search or status filter."
          action={<button className="btn-ghost" onClick={() => { setQuery(''); setStatus('All') }}>Clear Filters</button>} />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Amount</th><th>Date</th><th>Status</th><th>Payment</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.map((o, i) => (
                <tr key={i}>
                  <td><span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent)' }}>{o.id}</span></td>
                  <td>{o.customer}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{o.items} item{o.items > 1 ? 's' : ''}</td>
                  <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{o.amount}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{o.date}</td>
                  <td><span className={`badge ${statusClass[o.status] || 'badge-neutral'}`}>{o.status}</span></td>
                  <td><span className={`badge ${o.payment === 'Paid' ? 'badge-success' : 'badge-warning'}`}>{o.payment}</span></td>
                  <td><button className="btn-icon" style={{ width: 30, height: 30 }}><FiEye size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>Showing {filtered.length} of {ordersData.length} orders</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map(n => (
              <button key={n} className="w-8 h-8 rounded-lg flex items-center justify-center font-medium transition-all duration-200"
                style={{
                  background: n === 1 ? 'rgba(99,102,241,0.1)' : 'white',
                  color: n === 1 ? 'var(--accent)' : 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  fontWeight: n === 1 ? 700 : 500,
                }}>{n}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
