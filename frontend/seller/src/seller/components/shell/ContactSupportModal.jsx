// Contact Support. This replaces a `mailto:` link in the sidebar that silently
// did nothing on machines without a mail client configured — the form posts to
// POST /api/support, which stores the request and notifies the admin team.

import React, { useState } from 'react'
import { FiX, FiLifeBuoy, FiSend } from 'react-icons/fi'
import { apiRequest } from '../../api/client'
import { useToast } from '../ui/Toast'

const CATEGORIES = ['Orders', 'Payments', 'Products', 'Account', 'Other']

export default function ContactSupportModal({ open, onClose }) {
  const toast = useToast()
  const [form, setForm] = useState({ category: 'Orders', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Validated here for an immediate message, and again on the server.
    if (!form.subject.trim()) { setError('Please add a subject.'); return }
    if (!form.message.trim()) { setError('Please describe the issue.'); return }

    setSending(true)
    try {
      await apiRequest('/support', { method: 'POST', body: JSON.stringify(form) })
      toast.success('Your request has been sent — the support team will get back to you.')
      setForm({ category: 'Orders', subject: '', message: '' })
      onClose()
    } catch (err) {
      // Network failures surface as a TypeError with no useful message.
      setError(err.message === 'Failed to fetch'
        ? 'Could not reach the server. Check your connection and try again.'
        : err.message || 'Could not send your request.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'var(--overlay)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <FiLifeBuoy size={18} style={{ color: 'var(--accent)' }} />
            <div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Contact Support</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>We usually reply within one business day.</div>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close"><FiX size={17} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="support-category" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-soft)' }}>Category</label>
            <select id="support-category" className="input" value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="support-subject" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-soft)' }}>Subject</label>
            <input id="support-subject" className="input" maxLength={150} value={form.subject} onChange={set('subject')}
              placeholder="Short summary of the issue" />
          </div>

          <div>
            <label htmlFor="support-message" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-soft)' }}>How can we help?</label>
            <textarea id="support-message" rows={5} className="input" maxLength={4000} value={form.message} onChange={set('message')}
              placeholder="Include order or product IDs where relevant." />
          </div>

          {error && (
            <div className="text-sm px-3 py-2 rounded-lg"
              style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger-bd)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={sending}>Cancel</button>
            <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={sending}>
              <FiSend size={15} /> {sending ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
