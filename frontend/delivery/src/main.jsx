import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { io } from 'socket.io-client'
import {
  FaTruck, FaHistory, FaUser, FaBox, FaBoxOpen,
  FaClock, FaCheckCircle, FaCheck, FaStore,
  FaMapMarkerAlt, FaDirections, FaPhoneAlt, FaArrowRight,
  FaUndoAlt, FaMoneyBillWave, FaClipboardList, FaTimes,
  FaLock, FaEnvelope, FaEye, FaEyeSlash,
  FaFilePdf, FaIdCard, FaMotorcycle, FaUpload, FaFileAlt
} from 'react-icons/fa'
import './styles.css'

const API_BASE = 'http://localhost:5000/api'
const LOGIN_URL = 'http://localhost:5177'
const STORAGE_KEY = 'delivery_user'
const EXPECTED_ROLE = 'delivery'

const timelineSteps = ['Assigned', 'Accepted', 'Picked Up', 'In Transit', 'Out For Delivery', 'Delivered']

function statusIndex(status) {
  return Math.max(0, timelineSteps.indexOf(status))
}

function consumeAuthHandoff() {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('authId')
  const role = params.get('authRole')
  if (!id || role !== EXPECTED_ROLE) return null

  const user = {
    id,
    role,
    name: params.get('authName') || 'Delivery Partner',
    email: params.get('authEmail') || '',
    token: params.get('authToken') || null,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))

  params.delete('authId')
  params.delete('authName')
  params.delete('authEmail')
  params.delete('authRole')
  params.delete('authToken')
  const query = params.toString()
  window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash)
  return user
}

function getStoredUser() {
  const handoff = consumeAuthHandoff()
  if (handoff) return handoff
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
}

function authHeaders() {
  try {
    const token = JSON.parse(localStorage.getItem(STORAGE_KEY))?.token
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch { return {} }
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0)
}

function formatDate(value) {
  if (!value) return 'Not available'
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

function DeliveryRegister({ onRegistered, onGoToLogin }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    vehicle: 'Bike',
    vehicleModel: '',
    vehicleNumber: '',
    zone: '',
    pincode: '',
  })
  const [docs, setDocs] = useState({}) // license, rc, id -> { type, label, fileName, dataUrl, isPdf, size }
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileUpload = async (type, label, file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError(`${label} file size must be under 5MB`)
      return
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      setDocs((prev) => ({
        ...prev,
        [type]: {
          type,
          label,
          fileName: file.name,
          dataUrl,
          isPdf,
          size: (file.size / 1024).toFixed(1) + ' KB',
        },
      }))
      setError('')
    } catch {
      setError('Unable to read selected file. Please select another.')
    }
  }

  const removeDoc = (type) => {
    setDocs((prev) => {
      const next = { ...prev }
      delete next[type]
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Please enter your full name')
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Please enter a valid email address')
    if (!form.password || form.password.length < 8) return setError('Password must be at least 8 characters')
    if (!form.phone || !/^\d{10}$/.test(form.phone.trim())) return setError('Please enter a valid 10-digit phone number')
    if (!form.vehicleModel.trim()) return setError('Please enter your bike / vehicle model (e.g. Honda Activa, Pulsar 150)')
    if (!form.vehicleNumber.trim()) return setError('Please enter your vehicle registration number plate (e.g. TN-01-AB-1234)')
    if (!docs.license) return setError('Please upload your Driving License as PDF or image')
    if (!docs.rc) return setError('Please upload your Vehicle RC Book as PDF or image')

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/register/delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
          documents: Object.values(docs),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed')
      }

      const userData = {
        id: data.id,
        role: 'delivery',
        name: data.name,
        email: data.email,
        token: data.token,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
      window.history.pushState({}, '', '/')
      if (onRegistered) onRegistered(userData)
    } catch (err) {
      setError(err.message || 'Unable to register. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-wrapper">
      <div className="register-card" style={{ maxWidth: 720 }}>
        <div className="register-header">
          <div className="brand-icon-box" style={{ margin: '0 auto 12px' }}>S</div>
          <span className="brand-role-pill">Delivery Fleet Onboarding</span>
          <h1 className="register-title">Deliver with ShopSphere</h1>
          <p className="register-subtitle">Join our logistics fleet, accept delivery orders, and earn competitive weekly payouts.</p>
        </div>

        {error && (
          <div className="register-error">
            <FaTimes style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-section-divider">
            <span>1. Personal & Contact Details</span>
          </div>

          <div className="register-grid">
            <div className="register-field">
              <label>Full Name *</label>
              <div className="input-with-icon">
                <FaUser className="field-icon" />
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <label>Email Address *</label>
              <div className="input-with-icon">
                <FaEnvelope className="field-icon" />
                <input
                  type="email"
                  placeholder="delivery@shopsphere.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <label>Password (min 8 chars) *</label>
              <div className="input-with-icon">
                <FaLock className="field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="register-field">
              <label>Phone Number (10 digits) *</label>
              <div className="input-with-icon">
                <FaPhoneAlt className="field-icon" />
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="register-section-divider">
            <span>2. Vehicle & Operations</span>
          </div>

          <div className="register-grid">
            <div className="register-field">
              <label>Vehicle Fleet Type</label>
              <div className="input-with-icon">
                <FaTruck className="field-icon" />
                <select
                  value={form.vehicle}
                  onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                >
                  <option value="Bike">Motorcycle / Scooter</option>
                  <option value="Van">Delivery Van</option>
                  <option value="Truck">Logistics Mini Truck</option>
                  <option value="Bicycle">Bicycle</option>
                </select>
              </div>
            </div>

            <div className="register-field">
              <label>Bike / Vehicle Model *</label>
              <div className="input-with-icon">
                <FaMotorcycle className="field-icon" />
                <input
                  type="text"
                  placeholder="e.g. Honda Activa 6G / Pulsar 150"
                  value={form.vehicleModel}
                  onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <label>Vehicle Number Plate *</label>
              <div className="input-with-icon">
                <FaIdCard className="field-icon" />
                <input
                  type="text"
                  placeholder="e.g. TN-01-AB-1234"
                  value={form.vehicleNumber}
                  onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })}
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <label>Operating City / Zone</label>
              <div className="input-with-icon">
                <FaMapMarkerAlt className="field-icon" />
                <input
                  type="text"
                  placeholder="e.g. Chennai Central"
                  value={form.zone}
                  onChange={(e) => setForm({ ...form, zone: e.target.value })}
                />
              </div>
            </div>

            <div className="register-field full-width">
              <label>Base Operating PIN Code</label>
              <div className="input-with-icon">
                <FaMapMarkerAlt className="field-icon" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 600001 (used to match nearby seller warehouse dispatches)"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                />
              </div>
            </div>
          </div>

          <div className="register-section-divider">
            <span>3. Verification Documents (PDF / Images)</span>
          </div>

          <div className="doc-upload-grid">
            {/* Driving License */}
            {docs.license ? (
              <div className="doc-preview-card">
                <div className="doc-preview-left">
                  <div className="doc-thumb-icon">
                    {docs.license.isPdf ? <FaFilePdf /> : <FaFileAlt />}
                  </div>
                  <div className="doc-preview-info">
                    <div className="doc-preview-label">Driving License *</div>
                    <div className="doc-preview-file" title={docs.license.fileName}>
                      {docs.license.fileName} ({docs.license.size})
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="doc-remove-btn"
                  onClick={() => removeDoc('license')}
                >
                  <FaTimes /> Remove
                </button>
              </div>
            ) : (
              <label className="doc-upload-box">
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={(e) => handleFileUpload('license', 'Driving License', e.target.files?.[0])}
                />
                <div className="doc-upload-icon"><FaUpload /></div>
                <div className="doc-upload-title">Driving License *</div>
                <div className="doc-upload-hint">Upload PDF or Image (max 5MB)</div>
              </label>
            )}

            {/* Vehicle RC Book */}
            {docs.rc ? (
              <div className="doc-preview-card">
                <div className="doc-preview-left">
                  <div className="doc-thumb-icon">
                    {docs.rc.isPdf ? <FaFilePdf /> : <FaFileAlt />}
                  </div>
                  <div className="doc-preview-info">
                    <div className="doc-preview-label">Vehicle RC Book *</div>
                    <div className="doc-preview-file" title={docs.rc.fileName}>
                      {docs.rc.fileName} ({docs.rc.size})
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="doc-remove-btn"
                  onClick={() => removeDoc('rc')}
                >
                  <FaTimes /> Remove
                </button>
              </div>
            ) : (
              <label className="doc-upload-box">
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={(e) => handleFileUpload('rc', 'Vehicle RC Book', e.target.files?.[0])}
                />
                <div className="doc-upload-icon"><FaUpload /></div>
                <div className="doc-upload-title">Vehicle RC Book *</div>
                <div className="doc-upload-hint">Upload PDF or Image (max 5MB)</div>
              </label>
            )}

            {/* Optional ID proof */}
            {docs.id ? (
              <div className="doc-preview-card full-width" style={{ gridColumn: '1 / -1' }}>
                <div className="doc-preview-left">
                  <div className="doc-thumb-icon">
                    {docs.id.isPdf ? <FaFilePdf /> : <FaFileAlt />}
                  </div>
                  <div className="doc-preview-info">
                    <div className="doc-preview-label">Government ID (Optional)</div>
                    <div className="doc-preview-file" title={docs.id.fileName}>
                      {docs.id.fileName} ({docs.id.size})
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="doc-remove-btn"
                  onClick={() => removeDoc('id')}
                >
                  <FaTimes /> Remove
                </button>
              </div>
            ) : (
              <label className="doc-upload-box" style={{ gridColumn: '1 / -1' }}>
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={(e) => handleFileUpload('id', 'Government ID', e.target.files?.[0])}
                />
                <div className="doc-upload-icon"><FaIdCard /></div>
                <div className="doc-upload-title">Government ID Proof (Aadhaar / Voter ID)</div>
                <div className="doc-upload-hint">Optional · PDF or Image (max 5MB)</div>
              </label>
            )}
          </div>

          <button type="submit" className="register-submit-btn" disabled={loading}>
            {loading ? 'Submitting Registration...' : 'Register as Delivery Partner'}
          </button>
        </form>

        <div className="register-footer">
          <span>Already registered as a delivery partner?</span>
          <button type="button" className="link-button" onClick={onGoToLogin}>
            Sign In Here
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(getStoredUser)
  const [isRegister, setIsRegister] = useState(() => {
    const path = window.location.pathname
    const search = window.location.search
    const hash = window.location.hash
    return path.includes('register') || search.includes('register') || hash.includes('register')
  })
  const [tab, setTab] = useState('console') // console | history | profile
  const [orders, setOrders] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState(null)
  const [lastSynced, setLastSynced] = useState(new Date())
  const [account, setAccount] = useState(null)
  const [accountChecked, setAccountChecked] = useState(false)
  const [appealMessage, setAppealMessage] = useState('')
  const [appealBusy, setAppealBusy] = useState(false)
  const [appealError, setAppealError] = useState('')

  useEffect(() => {
    if (!user && !isRegister) {
      window.location.href = `${LOGIN_URL}?role=delivery&redirect=${encodeURIComponent(window.location.href)}`
    }
  }, [user, isRegister])

  // Re-read the account on every refresh: an admin can suspend or deactivate a
  // partner at any time, and the JWT stays valid for 7 days after they do.
  const loadAccount = useCallback(async () => {
    if (!user) return null
    try {
      const response = await fetch(`${API_BASE}/delivery-partners/me`, { headers: authHeaders() })
      const result = await response.json()
      if (response.ok && result.success) {
        setAccount(result.deliveryPartner)
        return result.deliveryPartner
      }
      // 404 means the record is gone entirely (an account deleted before soft
      // deactivation existed) - treat it the same as a deactivated account.
      if (response.status === 404) setAccount({ accountStatus: 'deactivated' })
    } catch {
      /* offline - leave the last known account in place */
    } finally {
      setAccountChecked(true)
    }
    return null
  }, [user])

  useEffect(() => { loadAccount() }, [loadAccount])

  const loadOrders = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      await loadAccount()
      const response = await fetch(`${API_BASE}/orders`)
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'Failed to load orders')

      const assignedOrders = result.orders.filter((order) => {
        const hasDeliveryWork = Boolean(order.deliveryStatus || order.deliveryPartnerId)
        if (!hasDeliveryWork) return false
        if (user.id === 'delivery-demo') return true
        return order.deliveryPartnerId === user.id
      })

      setOrders(assignedOrders)
      setSelectedId((current) => current && assignedOrders.some((order) => order.id === current) ? current : assignedOrders[0]?.id || '')


      setLastSynced(new Date())
    } catch (err) {
      setError(err.message || 'Unable to load delivery orders')
    } finally {
      setLoading(false)
    }
  }, [user, loadAccount])

  useEffect(() => { loadOrders() }, [loadOrders])

  // live refresh when the admin assigns work or a return moves
  useEffect(() => {
    if (!user) return
    const socket = io('http://localhost:5000', { query: { role: 'delivery', userId: user.id } })
    socket.on('delivery-assigned', loadOrders)
    socket.on('order-updated', loadOrders)
    socket.on('return-updated', loadOrders)
    return () => socket.disconnect()
  }, [user, loadOrders])

  const selectedOrder = orders.find((order) => order.id === selectedId) || orders[0]

  const metrics = useMemo(() => {
    const completed = orders.filter((order) => order.deliveryStatus === 'Delivered').length
    return [
      { label: 'Assigned Orders', value: orders.length, detail: 'Loaded from MongoDB' },
      { label: 'Pending', value: orders.length - completed, detail: 'Needs delivery action' },
      { label: 'Delivered', value: completed, detail: 'Completed orders' },
    ]
  }, [orders])

  const filteredOrders = orders.filter((order) => {
    const text = `${order.id} ${order.customerName} ${order.sellerName} ${order.deliveryStatus} ${order.customerAddress}`.toLowerCase()
    return text.includes(query.toLowerCase())
  })

  const activeCount = useMemo(() => {
    return orders.filter(
      (o) => o.deliveryStatus !== 'Delivered' && (!o.cancellation || o.cancellation.status !== 'Approved')
    ).length
  }, [orders])

  const updateStatus = async (order, nextStatus) => {
    setError('')
    try {
      const response = await fetch(`${API_BASE}/orders/${order.id}/delivery-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ deliveryStatus: nextStatus }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'Failed to update status')
      setOrders((current) => current.map((item) => item.id === order.id ? result.order : item))
      setLastSynced(new Date())
    } catch (err) {
      setError(err.message || 'Unable to update delivery status')
    }
  }

  const advanceStatus = (order) => {
    const next = timelineSteps[statusIndex(order.deliveryStatus) + 1]
    if (next) updateStatus(order, next)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  const requestUnsuspension = async () => {
    setAppealBusy(true)
    setAppealError('')
    try {
      const response = await fetch(`${API_BASE}/delivery-partners/me/unsuspension-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ message: appealMessage }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not send your request')
      setAccount(result.deliveryPartner)
      setAppealMessage('')
    } catch (err) {
      setAppealError(err.message || 'Could not send your request')
    } finally {
      setAppealBusy(false)
    }
  }

  const openMaps = (address) => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`, '_blank')
  const callNumber = (phone) => { if (phone) window.location.href = `tel:${String(phone).replace(/\s/g, '')}` }

  if (isRegister) {
    return (
      <DeliveryRegister
        onRegistered={(userData) => {
          setUser(userData)
          setIsRegister(false)
        }}
        onGoToLogin={() => {
          window.location.href = `${LOGIN_URL}?role=delivery`
        }}
      />
    )
  }

  if (!user) {
    return (
      <div className="register-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="register-card" style={{ maxWidth: 460, textAlign: 'center', padding: '40px 32px' }}>
          <div className="brand-icon-box" style={{ margin: '0 auto 16px', width: 48, height: 48, fontSize: 22 }}>S</div>
          <span className="brand-role-pill" style={{ marginBottom: 12, display: 'inline-block' }}>Delivery Fleet Portal</span>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Delivery Partner Access</h2>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
            Sign in to manage your active dispatch assignments, or register to join our fleet.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <a
              href={`${LOGIN_URL}?role=delivery&redirect=${encodeURIComponent(window.location.href)}`}
              className="register-submit-btn"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <FaLock /> Sign In to Delivery Console
            </a>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className="top-button"
              style={{ width: '100%', height: 44, justifyContent: 'center', background: '#f1f5f9', color: '#0f172a', fontWeight: 600, border: '1px solid #cbd5e1' }}
            >
              <FaMotorcycle /> Register as Delivery Partner
            </button>
          </div>
        </div>
      </div>
    )
  }
  if (loading || !accountChecked) return <main className="app"><div className="loading">Loading delivery orders from MongoDB...</div></main>

  // A suspended or deactivated partner never reaches the console. Their token
  // stays valid until it expires, so this is what stops the app from looking
  // live after an admin has acted; the API refuses their writes regardless.
  const accountStatus = account?.accountStatus || 'active'
  if (accountStatus !== 'active') {
    const suspended = accountStatus === 'suspended'
    const appeal = account?.unsuspensionRequest || {}
    return (
      <main className="app">
        <section className="shell">
          <div className="account-block">
            <span className={`account-block-badge ${suspended ? 'warn' : 'danger'}`}>
              {suspended ? 'Account Suspended' : 'Account Deactivated'}
            </span>
            <h1>{suspended ? 'Your account is suspended' : 'Your account has been deactivated'}</h1>
            <p className="muted">
              {suspended
                ? 'A platform administrator has suspended this delivery partner account. You cannot accept deliveries, update order status or edit your profile until it is reinstated.'
                : 'A platform administrator has deactivated this delivery partner account. You no longer have access to the delivery console.'}
            </p>
            {appeal.reason && (
              <p className="account-block-reason"><strong>Administrator note:</strong> {appeal.reason}</p>
            )}

            {suspended && appeal.status === 'pending' && (
              <div className="account-block-panel">
                <strong>Your reinstatement request is with the admin team.</strong>
                <p className="muted">Submitted {formatDate(appeal.requestedAt)}. You will be notified once it is reviewed.</p>
              </div>
            )}

            {suspended && appeal.status !== 'pending' && (
              <div className="account-block-panel">
                {appeal.status === 'rejected' && (
                  <p className="account-block-reason">Your previous request was declined. You can submit a new one.</p>
                )}
                <label htmlFor="appeal">Request unsuspension</label>
                <textarea
                  id="appeal"
                  rows={3}
                  placeholder="Tell the admin team why your account should be reinstated (optional)"
                  value={appealMessage}
                  onChange={(e) => setAppealMessage(e.target.value)}
                />
                {appealError && <div className="error">{appealError}</div>}
                <button className="top-button primary" onClick={requestUnsuspension} disabled={appealBusy}>
                  {appealBusy ? 'Sending...' : 'Request Unsuspension'}
                </button>
              </div>
            )}

            <div className="stack">
              <button className="top-button" onClick={loadAccount}>Check again</button>
              <button className="top-button" onClick={logout}>Logout</button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <div className="delivery-app-layout">
      {/* ── Left Sidebar (matching Admin and Seller portals) ── */}
      <aside className="delivery-sidebar">
        <div className="delivery-sidebar-brand">
          <div className="brand-icon-box">S</div>
          <div>
            <div className="brand-name">ShopSphere</div>
            <div className="brand-role-pill">Delivery Portal</div>
          </div>
        </div>

        <div className="delivery-partner-card">
          <div className="delivery-partner-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'D'}
          </div>
          <div className="delivery-partner-info">
            <div className="delivery-partner-name">{user?.name || 'Partner'}</div>
            <div className="delivery-partner-id">{user?.id}</div>
            <div className="delivery-duty-status">
              <span className="duty-dot"></span>
              <span>Active Partner</span>
            </div>
          </div>
        </div>

        <div className="sidebar-section-title">Operations Menu</div>
        <nav className="delivery-sidebar-nav">
          <button
            type="button"
            className={`delivery-nav-link ${tab === 'console' ? 'active' : ''}`}
            onClick={() => setTab('console')}
          >
            <FaTruck className="nav-icon" />
            <span className="nav-text">Dispatch Console</span>
            {activeCount > 0 && <span className="nav-badge">{activeCount}</span>}
          </button>

          <button
            type="button"
            className={`delivery-nav-link ${tab === 'history' ? 'active' : ''}`}
            onClick={() => setTab('history')}
          >
            <FaHistory className="nav-icon" />
            <span className="nav-text">Delivery History</span>
          </button>

          <button
            type="button"
            className={`delivery-nav-link ${tab === 'profile' ? 'active' : ''}`}
            onClick={() => setTab('profile')}
          >
            <FaUser className="nav-icon" />
            <span className="nav-text">Partner Profile</span>
          </button>
        </nav>

        <div className="delivery-sidebar-footer">
          <button className="sidebar-btn primary" onClick={loadOrders}>
            Refresh Orders
          </button>
          <button className="sidebar-btn secondary" onClick={logout}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="delivery-main-column">
        <header className="delivery-top-navbar">
          <div>
            <h1 className="top-navbar-heading">
              {tab === 'console' && 'Dispatch & Delivery Console'}
              {tab === 'history' && 'Completed Order History'}
              {tab === 'profile' && 'Partner Profile & Payroll'}
            </h1>
            <p className="top-navbar-sub">
              {tab === 'console' && 'Manage assigned active shipments, customer fulfillment, and return pickups'}
              {tab === 'history' && 'Past delivery lifecycle records, signature verifications, and audit log'}
              {tab === 'profile' && 'Operational identity, duty availability, payroll breakdown, and vehicle specifications'}
            </p>
          </div>
          <div className="top-navbar-right">
            <span className="live-status-badge">
              <span className="live-pulse"></span>
              Live Dispatch Online
            </span>
          </div>
        </header>

        <div className="delivery-main-content">
          {error && tab === 'console' && <div className="error">{error}</div>}

          {tab === 'history' && <HistoryView user={user} />}
          {tab === 'profile' && <ProfileView user={user} onNameChange={(name) => setUser((u) => ({ ...u, name }))} />}

        {tab === 'console' && <section className="grid">
          <aside className="stack">
            <section className="metrics">
              {metrics.map((metric) => (
                <article className="metric" key={metric.label}>
                  <div className="row"><span className="eyebrow">{metric.label}</span></div>
                  <strong>{metric.value}</strong>
                  <p className="muted">{metric.detail}</p>
                </article>
              ))}
            </section>

            <section className="panel">
              <div className="row">
                <h2><FaClipboardList style={{ color: '#2563eb' }} /> Assigned Orders</h2>
              </div>
              <input className="search" placeholder="Search order, customer, status" value={query} onChange={(event) => setQuery(event.target.value)} />
              <div className="stack" style={{ marginTop: 14 }}>
                {filteredOrders.length === 0 ? <p className="muted">No delivery orders found.</p> : filteredOrders.map((order) => (
                  <button key={order.id} className={`order-button ${selectedOrder?.id === order.id ? 'active' : ''}`} onClick={() => setSelectedId(order.id)}>
                    <div className="row"><strong>{order.id}</strong><StatusPill status={order.deliveryStatus} /></div>
                    <p style={{ marginTop: 8 }}>{order.customerName}</p>
                    <p className="muted">{order.sellerName}</p>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          {selectedOrder ? (
            <section className="stack">
              <article className="card details">
                <div className="row">
                  <div>
                    <p className="eyebrow">Assigned order details</p>
                    <h2>{selectedOrder.id}</h2>
                  </div>
                  <StatusPill status={selectedOrder.deliveryStatus} large />
                </div>

                <div className="info-grid">
                  <Info label="Customer" value={selectedOrder.customerName} />
                  <Info label="Customer Phone" value={selectedOrder.customerPhone || 'Not available'} />
                  <Info label="Customer Address" value={selectedOrder.customerAddress || 'Not available'} />
                  <Info label="Seller" value={selectedOrder.sellerName || 'Not available'} />
                  <Info label="Seller Address" value={selectedOrder.sellerAddress || 'Not available'} />
                  <Info label="Items" value={(selectedOrder.items || []).map((item) => `${item.name} x${item.qty}`).join(', ') || 'No items'} />
                  <Info label="Amount" value={formatMoney(selectedOrder.amount)} />
                  <Info label="Payment" value={selectedOrder.paymentMethod || 'Not available'} />
                </div>
              </article>

              <Timeline status={selectedOrder.deliveryStatus} />

              <section className="actions">
                <ActionPanel title="Pickup Process" icon={<FaBoxOpen style={{ color: '#2563eb' }} />} actions={[
                  { label: 'View Seller Details', icon: <FaStore />, onClick: () => setDialog({ title: 'Seller Details', rows: sellerRows(selectedOrder) }) },
                  { label: 'Navigate to Seller', icon: <FaMapMarkerAlt />, onClick: () => openMaps(selectedOrder.sellerAddress) },
                  { label: 'Mark Accepted', icon: <FaCheck />, primary: selectedOrder.deliveryStatus === 'Assigned', disabled: statusIndex(selectedOrder.deliveryStatus) >= statusIndex('Accepted'), onClick: () => updateStatus(selectedOrder, 'Accepted') },
                  { label: 'Mark Picked Up', icon: <FaBox />, primary: selectedOrder.deliveryStatus === 'Accepted', disabled: statusIndex(selectedOrder.deliveryStatus) >= statusIndex('Picked Up') || statusIndex(selectedOrder.deliveryStatus) < statusIndex('Accepted'), onClick: () => updateStatus(selectedOrder, 'Picked Up') },
                ]} />
                <ActionPanel title="Delivery Process" icon={<FaTruck style={{ color: '#2563eb' }} />} actions={[
                  { label: 'View Customer Details', icon: <FaUser />, onClick: () => setDialog({ title: 'Customer Details', rows: customerRows(selectedOrder) }) },
                  { label: 'Navigate to Customer', icon: <FaDirections />, onClick: () => openMaps(selectedOrder.customerAddress) },
                  { label: 'Call Customer', icon: <FaPhoneAlt />, onClick: () => callNumber(selectedOrder.customerPhone) },
                  { label: 'Advance Status', icon: <FaArrowRight />, primary: selectedOrder.deliveryStatus !== 'Delivered', disabled: selectedOrder.deliveryStatus === 'Delivered', onClick: () => advanceStatus(selectedOrder) },
                  { label: 'Mark Delivered', icon: <FaCheckCircle />, primary: selectedOrder.deliveryStatus === 'Out For Delivery', disabled: selectedOrder.deliveryStatus === 'Delivered' || statusIndex(selectedOrder.deliveryStatus) < statusIndex('Out For Delivery'), onClick: () => updateStatus(selectedOrder, 'Delivered') },
                ]} />
              </section>
            </section>
          ) : <section className="card details"><p>No assigned orders yet.</p></section>}

          <aside className="stack">
                        <section className="panel">
              <h2>Route Contacts</h2>
              {selectedOrder ? <div className="stack" style={{ marginTop: 14 }}>
                <Info label="Seller" value={`${selectedOrder.sellerName || '-'} - ${selectedOrder.sellerAddress || '-'}`} />
                <Info label="Customer" value={`${selectedOrder.customerName || '-'} - ${selectedOrder.customerAddress || '-'}`} />
                <Info label="Delivery Partner" value={`${selectedOrder.deliveryPartnerName || user.name} - ${selectedOrder.deliveryPartnerPhone || '-'}`} />
              </div> : <p className="muted">No order selected.</p>}
            </section>
            <section className="panel">
              <h2>Latest Activity</h2>
              <div className="stack" style={{ marginTop: 14 }}>
                {(selectedOrder?.statusHistory || []).slice().reverse().map((item, index) => (
                  <div className="note" key={`${item.status}-${item.timestamp}-${index}`}>
                    <strong>{item.status}</strong>
                    <p className="muted">{formatDate(item.timestamp)}</p>
                  </div>
                ))}
                {(!selectedOrder?.statusHistory || selectedOrder.statusHistory.length === 0) && <p className="muted">No status history yet.</p>}
              </div>
            </section>
          </aside>
        </section>}
        </div>
      </main>

      {dialog && <Dialog dialog={dialog} close={() => setDialog(null)} />}
    </div>
  )
}

function sellerRows(order) {
  return [
    ['Seller', order.sellerName],
    ['Address', order.sellerAddress],
    ['Phone', order.sellerPhone],
    ['Order', order.id],
  ]
}

function customerRows(order) {
  return [
    ['Customer', order.customerName],
    ['Address', order.customerAddress],
    ['Phone', order.customerPhone],
    ['Email', order.customerEmail],
  ]
}

function StatusPill({ status, large = false }) {
  const done = status === 'Delivered'
  const active = ['Picked Up', 'In Transit', 'Out For Delivery'].includes(status)
  return <span className={`status ${done ? 'done' : active ? 'active' : ''}`} style={large ? { padding: '8px 12px' } : null}>{status || 'Unassigned'}</span>
}

function Info({ label, value }) {
  return <div className="info"><span>{label}</span><p>{value || 'Not available'}</p></div>
}

function Timeline({ status }) {
  const current = statusIndex(status)
  return <section className="card details"><p className="eyebrow">Order tracking</p><h2>Customer-visible timeline</h2><div className="timeline">{timelineSteps.map((step, index) => <div key={step} className={`step ${index <= current ? 'done' : ''}`}><div className="step-number">{index + 1}</div><strong>{step}</strong>{index === current && <p className="muted">Current</p>}</div>)}</div></section>
}

function ActionPanel({ title, icon, actions }) {
  return <section className="panel"><div className="row"><h2>{title}</h2><span>{icon}</span></div><div className="action-list">{actions.map((action) => <button key={action.label} className={action.primary ? 'primary' : ''} disabled={action.disabled} onClick={action.onClick}><span>{action.label}</span> <span>{action.icon}</span></button>)}</div></section>
}

function Dialog({ dialog, close }) {
  return <div className="dialog-backdrop" onClick={close}><section className="dialog" onClick={(event) => event.stopPropagation()}><div className="row"><div><p className="eyebrow">Details</p><h2>{dialog.title}</h2></div><button className="top-button" onClick={close} aria-label="Close"><FaTimes /></button></div><div className="stack" style={{ marginTop: 16 }}>{dialog.rows.map(([label, value]) => <Info key={label} label={label} value={value} />)}</div></section></div>
}

// ── shared helpers for History + Profile ─────────────────────────────
function deliveredTs(order) {
  const hops = (order.statusHistory || []).filter((h) => h.status === 'Delivered')
  return hops.length ? new Date(hops[hops.length - 1].timestamp) : new Date(order.createdAt)
}

function computeStats(orders, id) {
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  let delivered = 0, cancelled = 0, month = 0
  for (const o of orders) {
    if (o.deliveryStatus === 'Delivered') { delivered++; if (deliveredTs(o) >= monthStart) month++ }
    else if (o.cancellation?.status === 'Approved') cancelled++
  }
  const attempts = delivered + cancelled
  return { totalDelivered: delivered, totalCancelled: cancelled, thisMonthDeliveries: month, successRate: attempts ? Math.round((delivered / attempts) * 100) : 100 }
}

// ── History tab ──────────────────────────────────────────────────────
function HistoryView({ user }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true); setError('')
      try {
        const res = await fetch(`${API_BASE}/orders?history=true&deliveryPartnerId=${encodeURIComponent(user.id)}`)
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load history')
        if (!cancelled) { setOrders(data.orders || []); }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user])

  const rows = useMemo(() => {
    const list = []
    for (const o of orders) {
      const isDelivered = o.deliveryStatus === 'Delivered'
      const isCancelled = o.cancellation?.status === 'Approved' || ['Cancelled', 'Returned'].includes(o.sellerStatus)
      if (isDelivered) {
        list.push({ key: `o-${o.id}`, kind: 'delivered', id: o.id, customer: o.customerName, address: o.customerAddress, amount: o.amount, status: 'Delivered', date: deliveredTs(o) })
      } else if (isCancelled) {
        list.push({ key: `o-${o.id}`, kind: 'cancelled', id: o.id, customer: o.customerName, address: o.customerAddress, amount: o.amount, status: o.sellerStatus === 'Returned' ? 'Returned' : 'Cancelled', date: new Date(o.cancellation?.resolvedAt || o.createdAt) })
      }
    }
    return list.sort((a, b) => b.date - a.date)
  }, [orders])

  const filtered = rows.filter((r) => {
    if (status !== 'all' && r.kind !== status) return false
    if (from && r.date < new Date(from)) return false
    if (to && r.date > new Date(new Date(to).getTime() + 24 * 60 * 60 * 1000)) return false
    if (q) {
      const text = `${r.id} ${r.customer} ${r.address} ${r.status}`.toLowerCase()
      if (!text.includes(q.toLowerCase())) return false
    }
    return true
  })

  return (
    <section className="panel">
      <div className="row">
        <div>
          <p className="eyebrow">Past & cancelled work</p>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaHistory style={{ color: '#2563eb' }} /> Delivery History
          </h2>
        </div>
      </div>
      {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}

      <div className="filters">
        <input placeholder="Search order, customer, address" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All jobs</option>
          <option value="delivered">Completed deliveries</option>
          <option value="cancelled">Cancelled / returned</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="From date" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="To date" />
      </div>

      {loading ? (
        <p className="muted" style={{ marginTop: 16 }}>Loading history…</p>
      ) : filtered.length === 0 ? (
        <p className="muted" style={{ marginTop: 16 }}>No matching jobs in your history.</p>
      ) : (
        <table className="htable">
          <thead><tr><th>Reference</th><th>Customer</th><th>Address</th><th>Amount</th><th>Outcome</th><th>Date</th></tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.key}>
                <td><strong>{r.id}</strong></td>
                <td>{r.customer || '—'}</td>
                <td className="muted" style={{ maxWidth: 220 }}>{r.address || '—'}</td>
                <td>{formatMoney(r.amount)}</td>
                <td><span className={`chip ${r.kind}`}>{r.status}</span></td>
                <td className="muted">{formatDate(r.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted" style={{ marginTop: 12 }}>{filtered.length} of {rows.length} past jobs</p>
    </section>
  )
}

// ── Profile tab ──────────────────────────────────────────────────────
function fromPartner(p) {
  return {
    name: p.name || '',
    phone: p.phone || '',
    vehicle: p.vehicle || 'Bike',
    vehicleModel: p.vehicleModel || '',
    vehicleNumber: p.vehicleNumber || '',
    zone: p.zone || '',
    status: p.status || 'Active',
  }
}

function ProfileView({ user, onNameChange }) {
  const [partner, setPartner] = useState(null)
  const [stats, setStats] = useState(null)
  const [payslips, setPayslips] = useState([])
  const [form, setForm] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [previewDoc, setPreviewDoc] = useState(null)
  const canEdit = Boolean(user.token) && user.id !== 'delivery-demo'

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/delivery-partners/me`, { headers: authHeaders() })
        const data = await res.json()
        if (res.ok && data.success) {
          if (!cancelled) { setPartner(data.deliveryPartner); setStats(data.stats); setForm(fromPartner(data.deliveryPartner)) }
        } else { throw new Error('no profile') }
      } catch {
        // demo / no token: read-only identity + stats computed from history
        if (!cancelled) {
          const fallback = { id: user.id, name: user.name, email: user.email, phone: '', vehicle: '—', vehicleModel: '', vehicleNumber: '', zone: '—', status: 'Active', documents: [] }
          setPartner(fallback); setForm(fromPartner(fallback))
        }
        try {
          const res = await fetch(`${API_BASE}/orders?history=true&deliveryPartnerId=${encodeURIComponent(user.id)}`)
          const data = await res.json()
          if (res.ok && data.success && !cancelled) setStats(computeStats(data.orders, user.id))
        } catch { /* ignore */ }
      }
      try {
        const res = await fetch(`${API_BASE}/payroll?staffId=me`, { headers: authHeaders() })
        const data = await res.json()
        if (res.ok && data.success && !cancelled) setPayslips(data.payroll || [])
      } catch { /* payslips are real-partner only */ }
    })()
    return () => { cancelled = true }
  }, [user])

  async function save() {
    setSaving(true); setError(''); setMsg('')
    try {
      const res = await fetch(`${API_BASE}/delivery-partners/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          vehicle: form.vehicle,
          vehicleModel: form.vehicleModel,
          vehicleNumber: form.vehicleNumber ? form.vehicleNumber.trim().toUpperCase() : '',
          zone: form.zone,
          status: form.status,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not save profile')
      setPartner(data.deliveryPartner); setStats(data.stats); setEditing(false); setMsg('Profile updated successfully')
      onNameChange?.(data.deliveryPartner.name)
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  if (!partner || !form) return <section className="panel"><p className="muted">Loading profile…</p></section>

  const paidEarnings = payslips.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.netPay, 0)
  const latest = payslips[0]
  const tiles = [
    { label: 'Delivered', value: stats?.totalDelivered ?? '—', sub: 'Lifetime', color: '#4f46e5' },
    { label: 'Cancelled', value: stats?.totalCancelled ?? '—', sub: 'Lifetime', color: '#dc2626' },
    { label: 'Success rate', value: stats ? `${stats.successRate}%` : '—', sub: 'Delivered / attempts', color: '#0891b2' },
    { label: 'This month', value: stats?.thisMonthDeliveries ?? '—', sub: 'Deliveries', color: '#1d4ed8' },
    { label: 'Paid earnings', value: canEdit ? formatMoney(paidEarnings) : '—', sub: canEdit ? 'From payslips' : 'Sign in to view', color: '#059669' },
  ]

  const docsList = partner.documents || []

  return (
    <div className="stack">
      {error && <div className="error">{error}</div>}
      {msg && <div className="status active" style={{ padding: '10px 14px' }}>{msg}</div>}

      {/* Identity card */}
      <section className="card details">
        <div className="row" style={{ alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div className="avatar-lg">{partner.avatar ? <img src={partner.avatar} alt="" /> : (partner.name?.[0]?.toUpperCase() || 'D')}</div>
            <div>
              <p className="eyebrow">Delivery partner</p>
              <h2>{partner.name}</h2>
              <p className="muted">{partner.email}</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                <span className={`status ${partner.status === 'Active' ? 'active' : ''}`}>{partner.status}</span>
                {partner.vehicleNumber && (
                  <span className="brand-role-pill" style={{ textTransform: 'uppercase' }}>
                    {partner.vehicleNumber}
                  </span>
                )}
              </div>
            </div>
          </div>
          {canEdit && !editing && <button className="top-button primary" onClick={() => setEditing(true)}>Edit profile</button>}
        </div>

        <div className="form-grid" style={{ marginTop: 20 }}>
          <div className="field"><label>Full Name</label><input value={form.name} disabled={!editing} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div className="field"><label>Phone Number</label><input value={form.phone} disabled={!editing} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
          <div className="field"><label>Fleet Vehicle Type</label>
            <select value={form.vehicle} disabled={!editing} onChange={(e) => setForm((f) => ({ ...f, vehicle: e.target.value }))}>
              <option>Bike</option><option>Van</option><option>Truck</option><option>Bicycle</option>
            </select>
          </div>
          <div className="field"><label>Bike / Vehicle Model</label><input placeholder="e.g. Honda Activa 6G" value={form.vehicleModel} disabled={!editing} onChange={(e) => setForm((f) => ({ ...f, vehicleModel: e.target.value }))} /></div>
          <div className="field"><label>Vehicle Number Plate</label><input placeholder="e.g. TN-01-AB-1234" value={form.vehicleNumber} disabled={!editing} onChange={(e) => setForm((f) => ({ ...f, vehicleNumber: e.target.value.toUpperCase() }))} /></div>
          <div className="field"><label>Operating Zone</label><input value={form.zone} disabled={!editing} onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))} /></div>
          <div className="field"><label>Duty Status</label>
            <select value={form.status} disabled={!editing} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option>Active</option><option>On Delivery</option><option>Offline</option>
            </select>
          </div>
        </div>
        {editing && (
          <div className="action-list" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))', display: 'grid', marginTop: 14 }}>
            <button className="primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save changes'}</button>
            <button onClick={() => { setForm(fromPartner(partner)); setEditing(false) }}>Cancel</button>
          </div>
        )}
        {!canEdit && <p className="muted" style={{ marginTop: 14 }}>You're viewing the shared demo console — sign in as a real partner to edit your profile and see payslips.</p>}
      </section>

      {/* Uploaded Verification Documents */}
      <section className="panel">
        <div className="row">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaIdCard style={{ color: '#2563eb' }} /> Verification Documents (Driving License & RC Book)
          </h2>
        </div>
        {docsList.length === 0 ? (
          <p className="muted" style={{ marginTop: 12 }}>
            No verification documents were attached during registration.
          </p>
        ) : (
          <div className="doc-upload-grid" style={{ marginTop: 14 }}>
            {docsList.map((doc, idx) => {
              const isPdf = typeof doc.dataUrl === 'string' && doc.dataUrl.startsWith('data:application/pdf')
              return (
                <div className="doc-preview-card" key={idx}>
                  <div className="doc-preview-left">
                    <div className="doc-thumb-icon">
                      {isPdf ? <FaFilePdf /> : <FaFileAlt />}
                    </div>
                    <div className="doc-preview-info">
                      <div className="doc-preview-label">{doc.label || doc.type}</div>
                      <div className="doc-preview-file" title={doc.fileName || 'Uploaded file'}>
                        {doc.fileName || 'Document File'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="sidebar-btn primary"
                    style={{ width: 'auto', padding: '6px 14px', fontSize: 12 }}
                    onClick={() => setPreviewDoc({ ...doc, isPdf })}
                  >
                    View Document
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Lifetime stat tiles */}
      <div className="tiles">
        {tiles.map((t) => (
          <div className="tile" key={t.label}>
            <span className="eyebrow">{t.label}</span>
            <strong style={{ color: t.color }}>{t.value}</strong>
            <p className="sub">{t.sub}</p>
          </div>
        ))}
      </div>

      {/* Payslips */}
      <section className="panel">
        <div className="row">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaMoneyBillWave style={{ color: '#059669' }} /> Payslips
          </h2>
        </div>
        {payslips.length === 0 ? (
          <p className="muted" style={{ marginTop: 12 }}>{canEdit ? 'No payslips generated yet. Your admin generates payroll each month.' : 'Sign in as a real partner to view your payslips.'}</p>
        ) : (
          <>
            {latest && (
              <div className="note" style={{ marginTop: 12 }}>
                <div className="row"><strong>Latest · {latest.period}</strong><span className={`status ${latest.status === 'Paid' ? 'done' : 'active'}`}>{latest.status}</span></div>
                <div className="info-grid" style={{ marginTop: 12 }}>
                  <Info label="Base salary" value={formatMoney(latest.baseSalary)} />
                  <Info label="Deliveries" value={String(latest.deliveriesCount)} />
                  <Info label="Incentive" value={formatMoney(latest.incentiveTotal)} />
                  <Info label="Deductions" value={formatMoney(latest.deductions)} />
                  <Info label="Net pay" value={formatMoney(latest.netPay)} />
                  <Info label="Paid on" value={latest.paidAt ? formatDate(latest.paidAt) : 'Pending'} />
                </div>
              </div>
            )}
            <table className="htable">
              <thead><tr><th>Period</th><th>Deliveries</th><th>Net pay</th><th>Status</th></tr></thead>
              <tbody>
                {payslips.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.period}</strong></td>
                    <td>{p.deliveriesCount}</td>
                    <td>{formatMoney(p.netPay)}</td>
                    <td><span className={`chip ${p.status === 'Paid' ? 'delivered' : 'return'}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      {/* Document preview modal */}
      {previewDoc && (
        <div className="doc-modal-backdrop" onClick={() => setPreviewDoc(null)}>
          <div className="doc-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="doc-modal-header">
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>{previewDoc.label || 'Document Preview'}</h3>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <a
                  href={previewDoc.dataUrl}
                  download={previewDoc.fileName || 'document'}
                  className="sidebar-btn primary"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: 12, textDecoration: 'none' }}
                >
                  Download
                </a>
                <button
                  type="button"
                  className="top-button"
                  onClick={() => setPreviewDoc(null)}
                  style={{ padding: 6 }}
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            <div className="doc-modal-body">
              {previewDoc.isPdf ? (
                <iframe
                  title="Document Preview"
                  src={previewDoc.dataUrl}
                  style={{ width: '100%', height: '65vh', border: 'none', borderRadius: 8 }}
                />
              ) : (
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.label}
                  style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 8 }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
