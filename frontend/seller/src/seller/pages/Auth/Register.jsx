import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiUser, FiMail, FiLock, FiPhone, FiHome, FiMapPin, FiFileText,
  FiCheck, FiEye, FiEyeOff, FiUpload, FiX, FiTrendingUp, FiArrowLeft, FiArrowRight,
} from 'react-icons/fi'

const API_BASE = 'http://localhost:5000/api'
const SHARED_LOGIN_URL = 'http://localhost:5177'
const STORAGE_KEY = 'seller_user'

// Same formats the backend enforces (POST /api/register/seller)
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2MB per document

const STEPS = ['Account', 'Business', 'Documents', 'Review']
const REQUIRED_DOCS = [
  { type: 'gst', label: 'GST Certificate', hint: 'Your GST registration certificate' },
  { type: 'pan', label: 'PAN Card', hint: 'Business or proprietor PAN' },
  { type: 'cheque', label: 'Cancelled Cheque / Bank Proof', hint: 'For payouts' },
  { type: 'id', label: 'Government ID', hint: 'Aadhaar, passport or driving licence' },
]

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function Field({ label, icon: Icon, error, helper, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <div className="relative">
        {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />}
        {children}
      </div>
      {error
        ? <p className="text-xs mt-1" style={{ color: 'var(--rose)' }}>{error}</p>
        : helper && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{helper}</p>}
    </div>
  )
}

function Stepper({ step }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
      {STEPS.map((label, i) => {
        const done = i < step
        const active = i === step
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200"
                style={{
                  background: done || active ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(99,102,241,0.08)',
                  color: done || active ? 'white' : 'var(--text-muted)',
                  boxShadow: active ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
                  border: done || active ? 'none' : '1px solid var(--border)',
                }}>
                {done ? <FiCheck size={16} /> : i + 1}
              </div>
              <span className="text-[11px] font-medium hidden sm:block" style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 rounded-full min-w-[16px] max-w-[80px] mb-4 sm:mb-5" style={{ background: done ? 'var(--accent)' : 'var(--border)' }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    businessName: '', businessAddress: '', gstin: '', panNumber: '',
  })
  const [docs, setDocs] = useState({}) // type -> { fileName, dataUrl, isPdf }
  const [errors, setErrors] = useState({})

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  function validateStep(s) {
    const e = {}
    if (s === 0) {
      if (!form.name.trim()) e.name = 'Full name is required'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
      if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    }
    if (s === 1) {
      if (!form.businessName.trim()) e.businessName = 'Business / legal name is required'
      if (!form.businessAddress.trim()) e.businessAddress = 'Business address is required'
      if (!GSTIN_RE.test(form.gstin.toUpperCase().trim())) e.gstin = 'Enter a valid 15-character GSTIN (e.g. 27ABCDE1234F1Z5)'
      if (!PAN_RE.test(form.panNumber.toUpperCase().trim())) e.panNumber = 'Enter a valid 10-character PAN (e.g. ABCDE1234F)'
    }
    if (s === 2) {
      for (const d of REQUIRED_DOCS) {
        if (!docs[d.type]) e[d.type] = `${d.label} is required`
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function next() {
    if (validateStep(step)) { setStep((s) => Math.min(s + 1, STEPS.length - 1)); setSubmitError('') }
  }
  function back() { setStep((s) => Math.max(s - 1, 0)); setSubmitError('') }

  async function handleUpload(type, file) {
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      setErrors((e) => ({ ...e, [type]: 'File must be under 2MB' }))
      return
    }
    const dataUrl = await readFileAsDataUrl(file)
    setDocs((d) => ({ ...d, [type]: { fileName: file.name, dataUrl, isPdf: file.type === 'application/pdf' } }))
    setErrors((e) => { const n = { ...e }; delete n[type]; return n })
  }

  function removeDoc(type) {
    setDocs((d) => { const n = { ...d }; delete n[type]; return n })
  }

  async function submit() {
    if (!validateStep(2)) { setStep(2); return }
    setSubmitting(true)
    setSubmitError('')
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        businessName: form.businessName.trim(),
        businessAddress: form.businessAddress.trim(),
        gstin: form.gstin.toUpperCase().trim(),
        panNumber: form.panNumber.toUpperCase().trim(),
        documents: REQUIRED_DOCS.map((d) => ({
          type: d.type, label: d.label,
          fileName: docs[d.type]?.fileName, dataUrl: docs[d.type]?.dataUrl,
        })),
      }
      const res = await fetch(`${API_BASE}/register/seller`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not submit application')

      // keep the returned session so the seller can continue straight into the
      // (verification-gated) dashboard
      if (data.token) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: data.id, name: data.name, email: data.email, token: data.token }))
      }
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
        <div className="glass w-full max-w-md p-8 text-center animate-scale-in" style={{ borderRadius: 24 }}>
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(5,150,105,0.1)', color: 'var(--emerald)' }}>
            <FiCheck size={30} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Application submitted</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Thanks, {form.name.split(' ')[0]}! Your seller application is now <b>pending admin approval</b>. We'll notify you once your store is verified — you can sign in in the meantime.
          </p>
          <div className="flex flex-col gap-2">
            <button className="btn-primary w-full justify-center" onClick={() => navigate('/seller/dashboard')}>Continue to dashboard</button>
            <a className="btn-ghost w-full justify-center" href={`${SHARED_LOGIN_URL}/login/seller`}>Go to sign in</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-10" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-2xl">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #0891b2)' }}>
            <FiTrendingUp size={18} color="white" />
          </div>
          <div>
            <div className="text-base font-bold leading-none" style={{ color: 'var(--text-primary)' }}>ShopSphere</div>
            <div className="text-xs leading-none mt-0.5" style={{ color: 'var(--text-muted)' }}>Seller onboarding</div>
          </div>
        </div>

        <div className="glass p-6 sm:p-8" style={{ borderRadius: 24 }}>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Become a ShopSphere seller</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Complete all steps — your store goes live once an admin verifies your documents.</p>
          </div>

          <Stepper step={step} />

          {submitError && (
            <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(225,29,72,0.08)', color: 'var(--rose)', border: '1px solid rgba(225,29,72,0.2)' }}>
              {submitError}
            </div>
          )}

          {/* Step 1 — Account */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <Field label="Full name" icon={FiUser} error={errors.name}>
                <input className="input pl-10" placeholder="Jane Doe" value={form.name} onChange={(e) => set('name', e.target.value)} />
              </Field>
              <Field label="Email" icon={FiMail} error={errors.email}>
                <input className="input pl-10" type="email" placeholder="you@store.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </Field>
              <Field label="Password" icon={FiLock} error={errors.password} helper="At least 8 characters">
                <input className="input pl-10 pr-10" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={(e) => set('password', e.target.value)} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </Field>
              <Field label="Phone (optional)" icon={FiPhone}>
                <input className="input pl-10" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </Field>
            </div>
          )}

          {/* Step 2 — Business */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <Field label="Legal / business name" icon={FiHome} error={errors.businessName}>
                <input className="input pl-10" placeholder="Nimbus Traders Pvt Ltd" value={form.businessName} onChange={(e) => set('businessName', e.target.value)} />
              </Field>
              <Field label="Business address" icon={FiMapPin} error={errors.businessAddress}>
                <input className="input pl-10" placeholder="42 Trade Center, Mumbai, Maharashtra" value={form.businessAddress} onChange={(e) => set('businessAddress', e.target.value)} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="GSTIN" icon={FiFileText} error={errors.gstin} helper="15 characters, e.g. 27ABCDE1234F1Z5">
                  <input className="input pl-10 uppercase" placeholder="27ABCDE1234F1Z5" maxLength={15} value={form.gstin} onChange={(e) => set('gstin', e.target.value.toUpperCase())} />
                </Field>
                <Field label="PAN" icon={FiFileText} error={errors.panNumber} helper="10 characters, e.g. ABCDE1234F">
                  <input className="input pl-10 uppercase" placeholder="ABCDE1234F" maxLength={10} value={form.panNumber} onChange={(e) => set('panNumber', e.target.value.toUpperCase())} />
                </Field>
              </div>
            </div>
          )}

          {/* Step 3 — Documents */}
          {step === 2 && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Upload each document as an image or PDF (max 2MB). All four are required.</p>
              {REQUIRED_DOCS.map((d) => {
                const doc = docs[d.type]
                return (
                  <div key={d.type} className="glass-flat p-3.5 flex items-center gap-3" style={{ borderColor: errors[d.type] ? 'rgba(225,29,72,0.3)' : undefined }}>
                    {doc ? (
                      doc.isPdf
                        ? <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--accent)' }}><FiFileText size={20} /></div>
                        : <img src={doc.dataUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" style={{ border: '1px solid var(--border)' }} />
                    ) : (
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(99,112,145,0.08)', color: 'var(--text-muted)' }}><FiUpload size={18} /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                        {d.label} <span style={{ color: 'var(--rose)' }}>*</span>
                        {doc && <span className="badge badge-success" style={{ fontSize: 10 }}><FiCheck size={10} /> Attached</span>}
                      </div>
                      <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{doc ? doc.fileName : (errors[d.type] || d.hint)}</div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      <label className="btn-ghost text-xs cursor-pointer" style={{ padding: '6px 10px' }}>
                        {doc ? 'Replace' : 'Upload'}
                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleUpload(d.type, e.target.files?.[0])} />
                      </label>
                      {doc && <button className="btn-icon" style={{ width: 30, height: 30, color: 'var(--rose)' }} onClick={() => removeDoc(d.type)}><FiX size={14} /></button>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Step 4 — Review */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="glass-flat p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Account</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  <Row k="Name" v={form.name} /><Row k="Email" v={form.email} />
                  <Row k="Phone" v={form.phone || '—'} /><Row k="Password" v={'•'.repeat(form.password.length)} />
                </dl>
              </div>
              <div className="glass-flat p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Business</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  <Row k="Business name" v={form.businessName} /><Row k="Address" v={form.businessAddress} />
                  <Row k="GSTIN" v={form.gstin} /><Row k="PAN" v={form.panNumber} />
                </dl>
              </div>
              <div className="glass-flat p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Documents</h3>
                <div className="flex flex-wrap gap-2">
                  {REQUIRED_DOCS.map((d) => (
                    <span key={d.type} className="badge badge-success"><FiCheck size={11} /> {d.label}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex items-center justify-between gap-3 mt-7">
            {step > 0
              ? <button className="btn-ghost" onClick={back}><FiArrowLeft size={15} /> Back</button>
              : <a className="btn-ghost" href={`${SHARED_LOGIN_URL}/login/seller`}><FiArrowLeft size={15} /> Sign in</a>}
            {step < STEPS.length - 1
              ? <button className="btn-primary" onClick={next}>Next <FiArrowRight size={15} /></button>
              : <button className="btn-primary" onClick={submit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit application'} <FiCheck size={15} /></button>}
          </div>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
          Already a seller? <a href={`${SHARED_LOGIN_URL}/login/seller`} className="font-semibold" style={{ color: 'var(--accent)' }}>Sign in here</a>
        </p>
      </div>
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs" style={{ color: 'var(--text-muted)' }}>{k}</dt>
      <dd className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{v}</dd>
    </div>
  )
}
