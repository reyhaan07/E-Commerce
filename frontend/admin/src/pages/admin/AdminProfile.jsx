import { useEffect, useRef, useState } from "react";
import { FaUserShield, FaCamera, FaEnvelope, FaPhone, FaBriefcase, FaClock } from "react-icons/fa";
import { apiRequest } from "../../api/client";

function Toggle({ enabled, onToggle, disabled }) {
  return (
    <button onClick={onToggle} disabled={disabled}
      className="relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none disabled:opacity-50"
      style={{ background: enabled ? "#1d4ed8" : "#cbd5e1" }}>
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
        style={{ left: enabled ? "1.4rem" : "0.125rem", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
    </button>
  );
}

export default function AdminProfile() {
  const [account, setAccount] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", jobTitle: "" });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const fileRef = useRef(null);

  function load() {
    apiRequest("/users/me")
      .then((d) => { setAccount(d.user); setForm({ name: d.user.name || "", phone: d.user.phone || "", jobTitle: d.user.jobTitle || "" }); })
      .catch((err) => setFeedback(err.message));
  }
  useEffect(load, []);

  async function save() {
    setSaving(true);
    setFeedback("");
    try {
      const d = await apiRequest("/users/me", { method: "PATCH", body: JSON.stringify(form) });
      setAccount(d.user);
      setEditing(false);
      setFeedback("Profile saved");
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleEmail() {
    const next = !account.notifyByEmail;
    setAccount((a) => ({ ...a, notifyByEmail: next }));
    try {
      const d = await apiRequest("/users/me", { method: "PATCH", body: JSON.stringify({ notifyByEmail: next }) });
      setAccount(d.user);
    } catch (err) {
      setAccount((a) => ({ ...a, notifyByEmail: !next }));
      setFeedback(err.message);
    }
  }

  async function handleAvatar(file) {
    if (!file) return;
    if (file.size > 1.4 * 1024 * 1024) { setFeedback("Image must be under 1.4MB"); return; }
    const dataUrl = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
    try {
      const d = await apiRequest("/users/me", { method: "PATCH", body: JSON.stringify({ avatar: dataUrl }) });
      setAccount(d.user);
      setFeedback("Photo updated");
    } catch (err) { setFeedback(err.message); }
  }

  if (!account) return <div className="text-slate-400">Loading profile… {feedback}</div>;

  const Info = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Icon size={14} /></div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
        <div className="text-sm text-slate-700 truncate">{value || "—"}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Profile</h1>
        {feedback && <span className="text-sm font-medium text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-3 py-1.5">{feedback}</span>}
      </div>

      {/* Header card */}
      <div className="rounded-2xl bg-white shadow-soft border border-slate-100 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-600 to-sky-accent" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl border-4 border-white bg-brand-600 text-white flex items-center justify-center text-2xl font-bold overflow-hidden shadow-card">
                {account.avatar ? <img src={account.avatar} alt="" className="w-full h-full object-cover" /> : <FaUserShield />}
              </div>
              <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow" title="Change photo">
                <FaCamera size={11} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatar(e.target.files?.[0])} />
            </div>
            {editing
              ? <div className="flex gap-2">
                  <button onClick={save} disabled={saving} className="btn-primary text-sm">{saving ? "Saving…" : "Save"}</button>
                  <button onClick={() => { setForm({ name: account.name, phone: account.phone || "", jobTitle: account.jobTitle || "" }); setEditing(false); }} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm">Cancel</button>
                </div>
              : <button onClick={() => setEditing(true)} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm">Edit Profile</button>}
          </div>
          <h2 className="text-xl font-bold text-slate-800">{account.name}</h2>
          <p className="text-sm text-slate-500">{account.jobTitle || "Administrator"}</p>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-6 space-y-5">
        <h3 className="font-bold text-slate-800">Account Details</h3>
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field mt-1" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Phone</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input-field mt-1" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Job Title</label>
              <input value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} className="input-field mt-1" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Email (read-only)</label>
              <input value={account.email} disabled className="input-field mt-1 bg-slate-50 text-slate-400" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Info icon={FaEnvelope} label="Email" value={account.email} />
            <Info icon={FaPhone} label="Phone" value={account.phone} />
            <Info icon={FaBriefcase} label="Job Title" value={account.jobTitle} />
            <Info icon={FaClock} label="Last Login" value={account.lastLogin ? new Date(account.lastLogin).toLocaleString() : "—"} />
          </div>
        )}
      </div>

      {/* Preferences */}
      <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-6">
        <h3 className="font-bold text-slate-800 mb-4">Notification Preferences</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-700">Email notifications</div>
            <div className="text-xs text-slate-400">Receive platform alerts and daily summaries by email</div>
          </div>
          <Toggle enabled={!!account.notifyByEmail} onToggle={toggleEmail} />
        </div>
      </div>
    </div>
  );
}
