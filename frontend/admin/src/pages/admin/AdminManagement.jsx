import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";

// Roster of platform administrators. Every endpoint behind this page is
// SUPER_ADMIN-only; a plain ADMIN never sees the nav entry, and the server
// rejects them anyway if they deep-link here.

const emptyCreate = { name: "", email: "", password: "", confirmPassword: "", adminRole: "ADMIN", phone: "", jobTitle: "" };

export default function AdminManagement() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [pwId, setPwId] = useState(null);
  const [pwForm, setPwForm] = useState({ password: "", confirmPassword: "" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (statusFilter) params.set("status", statusFilter);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [search, statusFilter]);

  function loadAdmins() {
    setLoading(true);
    setError("");
    apiRequest(`/admin/admins${query}`)
      .then((data) => setAdmins(data.admins || []))
      .catch((err) => setError(err.message || "Could not load admins"))
      .finally(() => setLoading(false));
  }

  // Re-runs on every search/filter keystroke; the list is small enough that
  // server-side filtering per keystroke is fine here.
  useEffect(loadAdmins, [query]);

  async function run(fn, successMessage) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await fn();
      setNotice(successMessage);
      loadAdmins();
      return true;
    } catch (err) {
      setError(err.message || "Something went wrong");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (createForm.password !== createForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    const ok = await run(
      () => apiRequest("/admin/admins", { method: "POST", body: JSON.stringify(createForm) }),
      `${createForm.name} was added as an administrator`
    );
    if (ok) setCreateForm(emptyCreate);
  }

  function startEdit(admin) {
    setEditId(admin.id);
    setPwId(null);
    setEditForm({
      name: admin.name || "",
      email: admin.email || "",
      adminRole: admin.adminRole || "ADMIN",
      phone: admin.phone || "",
      jobTitle: admin.jobTitle || "",
      status: admin.status || "active",
    });
  }

  async function saveEdit(e) {
    e.preventDefault();
    const ok = await run(
      () => apiRequest(`/admin/admins/${editId}`, { method: "PATCH", body: JSON.stringify(editForm) }),
      "Administrator updated"
    );
    if (ok) setEditId(null);
  }

  async function savePassword(e) {
    e.preventDefault();
    if (pwForm.password !== pwForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    const ok = await run(
      () => apiRequest(`/admin/admins/${pwId}/password`, { method: "PATCH", body: JSON.stringify(pwForm) }),
      "Password updated"
    );
    if (ok) {
      setPwId(null);
      setPwForm({ password: "", confirmPassword: "" });
    }
  }

  function toggleStatus(admin) {
    const status = admin.status === "active" ? "suspended" : "active";
    run(
      () => apiRequest(`/admin/admins/${admin.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
      `${admin.name} is now ${status}`
    );
  }

  function removeAdmin(admin) {
    if (!window.confirm(`Remove ${admin.name}? This cannot be undone.`)) return;
    run(() => apiRequest(`/admin/admins/${admin.id}`, { method: "DELETE" }), `${admin.name} was removed`);
  }

  const fieldClass = "border border-slate-200 rounded-lg px-3 py-2 w-full";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Admin Management</h1>
          <p className="text-sm text-slate-500">Add, edit and suspend platform administrators.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="border border-slate-200 rounded-lg px-4 py-2 w-64"
            placeholder="Search name, email or job title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="border border-slate-200 rounded-lg px-3 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-700 bg-red-50 rounded-lg px-4 py-2">{error}</p>}
      {notice && <p className="text-sm font-medium text-blue-700 bg-blue-50 rounded-lg px-4 py-2">{notice}</p>}

      {/* Add a new administrator */}
      <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-5 space-y-4">
        <h2 className="font-bold text-lg">Add administrator</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className={fieldClass} placeholder="Full name" value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required />
          <input className={fieldClass} type="email" placeholder="Email" value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required />
          <input className={fieldClass} placeholder="Job title" value={createForm.jobTitle}
            onChange={(e) => setCreateForm({ ...createForm, jobTitle: e.target.value })} />
          <input className={fieldClass} type="password" placeholder="Password (min 8 chars)" value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} minLength={8} required />
          <input className={fieldClass} type="password" placeholder="Confirm password" value={createForm.confirmPassword}
            onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })} minLength={8} required />
          <input className={fieldClass} placeholder="Phone (optional)" value={createForm.phone}
            onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
          <select className={fieldClass} value={createForm.adminRole}
            onChange={(e) => setCreateForm({ ...createForm, adminRole: e.target.value })}>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>
        <button type="submit" disabled={saving} className="bg-slate-900 text-white rounded-lg px-5 py-2 font-medium disabled:opacity-60">
          {saving ? "Saving…" : "Add administrator"}
        </button>
      </form>

      {/* Roster */}
      {loading ? (
        <p className="text-slate-500">Loading administrators…</p>
      ) : admins.length === 0 ? (
        <p className="text-slate-500">No administrators match those filters.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Tier</th>
                <th className="px-5 py-3">Job title</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => {
                const isSelf = admin.id === user?.id;
                return (
                  <tr key={admin.id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-medium">
                      {admin.name}
                      {isSelf && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{admin.email}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        admin.adminRole === "SUPER_ADMIN" ? "bg-purple-50 text-purple-700" : "bg-slate-100 text-slate-600"
                      }`}>
                        {admin.adminRole === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{admin.jobTitle || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        admin.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>{admin.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <button className="text-blue-700 font-medium" onClick={() => startEdit(admin)}>Edit</button>
                        <button className="text-blue-700 font-medium" onClick={() => { setPwId(admin.id); setEditId(null); }}>Password</button>
                        <button className="text-amber-700 font-medium" disabled={saving} onClick={() => toggleStatus(admin)}>
                          {admin.status === "active" ? "Suspend" : "Reactivate"}
                        </button>
                        <button className="text-red-700 font-medium" disabled={saving || isSelf} onClick={() => removeAdmin(admin)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit drawer */}
      {editId && (
        <form onSubmit={saveEdit} className="bg-white rounded-xl shadow p-5 space-y-4">
          <h2 className="font-bold text-lg">Edit administrator</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className={fieldClass} placeholder="Full name" value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            <input className={fieldClass} type="email" placeholder="Email" value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            <input className={fieldClass} placeholder="Job title" value={editForm.jobTitle}
              onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })} />
            <input className={fieldClass} placeholder="Phone" value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            <select className={fieldClass} value={editForm.adminRole}
              onChange={(e) => setEditForm({ ...editForm, adminRole: e.target.value })}>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
            <select className={fieldClass} value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="bg-slate-900 text-white rounded-lg px-5 py-2 font-medium disabled:opacity-60">
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button type="button" className="text-slate-500 font-medium" onClick={() => setEditId(null)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Password reset */}
      {pwId && (
        <form onSubmit={savePassword} className="bg-white rounded-xl shadow p-5 space-y-4">
          <h2 className="font-bold text-lg">Set a new password</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className={fieldClass} type="password" placeholder="New password (min 8 chars)" value={pwForm.password}
              onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })} minLength={8} required />
            <input className={fieldClass} type="password" placeholder="Confirm password" value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} minLength={8} required />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="bg-slate-900 text-white rounded-lg px-5 py-2 font-medium disabled:opacity-60">
              {saving ? "Saving…" : "Update password"}
            </button>
            <button type="button" className="text-slate-500 font-medium" onClick={() => setPwId(null)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
