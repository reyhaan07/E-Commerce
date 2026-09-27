import React, { useState } from 'react';
import { HiXMark, HiLifebuoy, HiPaperAirplane } from 'react-icons/hi2';
import { apiRequest } from '../api/client';
import { useAuth } from '../hooks/useAuth';

const CATEGORIES = ['Orders', 'Payments', 'Products', 'Account', 'Other'];

export default function ContactSupportModal({ open, onClose }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ category: 'Orders', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!user) {
      window.location.href = 'http://localhost:5177?role=user';
      return;
    }

    if (!form.subject.trim()) {
      setError('Please provide a subject');
      return;
    }
    if (!form.message.trim()) {
      setError('Please describe your inquiry or problem');
      return;
    }

    setSending(true);
    try {
      await apiRequest('/support', {
        method: 'POST',
        body: JSON.stringify({
          category: form.category,
          subject: form.subject.trim(),
          message: form.message.trim(),
        }),
      });
      setSuccess(true);
      setForm({ category: 'Orders', subject: '', message: '' });
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Could not send support request. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <HiLifebuoy className="text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Contact Support / Admin</h3>
              <p className="text-xs text-slate-500">Our support team is here to assist you.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <HiXMark className="text-xl" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h4 className="text-lg font-bold text-slate-900">Message Sent to Admin</h4>
            <p className="text-sm text-slate-500">
              Your inquiry has been received. Our team will review and respond promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Inquiry Category
              </label>
              <select
                value={form.category}
                onChange={handleChange('category')}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Subject
              </label>
              <input
                type="text"
                maxLength={150}
                value={form.subject}
                onChange={handleChange('subject')}
                placeholder="Brief summary of your question or issue"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Message / Details
              </label>
              <textarea
                rows={4}
                maxLength={4000}
                value={form.message}
                onChange={handleChange('message')}
                placeholder="Describe how we can help. Include order or product details if applicable."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
              >
                <HiPaperAirplane className="text-base" /> {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
