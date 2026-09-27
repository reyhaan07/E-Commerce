import { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaTimes, FaBan, FaUndo } from "react-icons/fa";
import {
  getDeliveryPartners,
  addDeliveryPartner,
  updateDeliveryPartner,
  removeDeliveryPartner,
  setPartnerAccountStatus,
  reviewUnsuspensionRequest,
} from "../../api/deliveryPartners";

const emptyForm = { name: "", email: "", password: "", phone: "", vehicle: "Bike", pincode: "", zone: "" };

// Account standing, separate from the operational Active / On Delivery /
// Offline duty status in the Status column.
const ACCOUNT_BADGE = {
  active: "bg-green-50 text-green-700",
  suspended: "bg-amber-50 text-amber-700",
  deactivated: "bg-red-50 text-red-700",
};

export default function DeliveryPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPartner, setNewPartner] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState("");

  function loadPartners() {
    setLoading(true);
    getDeliveryPartners()
      .then(setPartners)
      .finally(() => setLoading(false));
  }

  useEffect(loadPartners, []);

  async function handleAdd(e) {
    e.preventDefault();
    try {
      await addDeliveryPartner(newPartner);
      setNewPartner(emptyForm);
      setShowAddForm(false);
      loadPartners();
    } catch (err) {
      alert(err.message || "Could not add delivery partner");
    }
  }

  function startEdit(partner) {
    setEditingId(partner.id);
    setEditForm({ name: partner.name, phone: partner.phone, vehicle: partner.vehicle, status: partner.status, pincode: partner.pincode || "", zone: partner.zone || "" });
  }

  async function handleEditSave(id) {
    try {
      await updateDeliveryPartner(id, editForm);
      setEditingId(null);
      loadPartners();
    } catch (err) {
      alert(err.message || "Could not update delivery partner");
    }
  }

  async function handleRemove(id) {
    if (!confirm("Deactivate this delivery partner? They lose access immediately and any open deliveries are un-assigned. Their record and delivery history are kept, so you can reactivate them later.")) return;
    try {
      await removeDeliveryPartner(id);
      setFeedback("Delivery partner deactivated — they will see an account-deactivated notice in the app.");
      loadPartners();
    } catch (err) {
      alert(err.message || "Could not deactivate delivery partner");
    }
  }

  async function handleAccountStatus(partner, accountStatus) {
    const verb = { active: "reactivate", suspended: "suspend", deactivated: "deactivate" }[accountStatus];
    let reason;
    if (accountStatus === "suspended") {
      reason = prompt("Reason for suspending this partner (shown to them in the app):", "");
      if (reason === null) return;
    } else if (!confirm(`Are you sure you want to ${verb} ${partner.name}?`)) {
      return;
    }
    try {
      await setPartnerAccountStatus(partner.id, accountStatus, reason);
      setFeedback(`${partner.name} is now ${accountStatus}.`);
      loadPartners();
    } catch (err) {
      alert(err.message || "Could not update account status");
    }
  }

  async function handleReview(partner, decision) {
    const reason = prompt(
      decision === "approved"
        ? "Optional note for the partner (they will see this):"
        : "Why is this request being declined? (shown to the partner)",
      ""
    );
    if (reason === null) return;
    try {
      await reviewUnsuspensionRequest(partner.id, decision, reason);
      setFeedback(
        decision === "approved"
          ? `${partner.name} has been reinstated.`
          : `${partner.name}'s request was declined — the account stays suspended.`
      );
      loadPartners();
    } catch (err) {
      alert(err.message || "Could not review the request");
    }
  }

  const pendingRequests = partners.filter((p) => p.unsuspensionRequest?.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Delivery Partners</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddForm((v) => !v)}>
          <FaPlus size={12} /> {showAddForm ? "Cancel" : "Add Delivery Partner"}
        </button>
      </div>

      {feedback && <p className="text-sm font-medium text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-4 py-2">{feedback}</p>}

      {/* Reinstatement requests from suspended partners */}
      {pendingRequests.length > 0 && (
        <div className="rounded-lg bg-white shadow border border-amber-200">
          <div className="px-6 py-3 border-b border-amber-100 bg-amber-50 rounded-t-lg">
            <h2 className="font-semibold text-amber-800">Unsuspension requests ({pendingRequests.length})</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {pendingRequests.map((partner) => (
              <li key={partner.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{partner.name} <span className="text-sm text-slate-500">· {partner.email}</span></p>
                  <p className="text-sm text-slate-600 mt-1">
                    {partner.unsuspensionRequest?.message || <span className="text-slate-400">No message provided.</span>}
                  </p>
                  {partner.unsuspensionRequest?.requestedAt && (
                    <p className="text-xs text-slate-400 mt-1">
                      Requested {new Date(partner.unsuspensionRequest.requestedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-3 shrink-0">
                  <button className="text-sm font-semibold text-green-600 hover:text-green-800" onClick={() => handleReview(partner, "approved")}>Approve</button>
                  <button className="text-sm font-semibold text-red-600 hover:text-red-800" onClick={() => handleReview(partner, "rejected")}>Reject</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAdd} className="rounded-lg bg-white p-6 shadow border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input required placeholder="Full name" value={newPartner.name}
            onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
            className="border border-slate-300 rounded-lg px-4 py-2" />
          <input placeholder="Base PIN code (decides which sellers they can serve)" value={newPartner.pincode}
            onChange={(e) => setNewPartner({ ...newPartner, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
            inputMode="numeric"
            className="border border-slate-300 rounded-lg px-4 py-2" />
          <input required type="email" placeholder="Email" value={newPartner.email}
            onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
            className="border border-slate-300 rounded-lg px-4 py-2" />
          <input required type="password" placeholder="Password" value={newPartner.password}
            onChange={(e) => setNewPartner({ ...newPartner, password: e.target.value })}
            className="border border-slate-300 rounded-lg px-4 py-2" />
          <input placeholder="Phone" value={newPartner.phone}
            onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
            className="border border-slate-300 rounded-lg px-4 py-2" />
          <select value={newPartner.vehicle}
            onChange={(e) => setNewPartner({ ...newPartner, vehicle: e.target.value })}
            className="border border-slate-300 rounded-lg px-4 py-2">
            <option>Bike</option>
            <option>Van</option>
            <option>Bicycle</option>
          </select>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">Create Partner</button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Vehicle</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Account</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && partners.map((partner) => (
              <tr key={partner.id} className="border-b border-slate-100 hover:bg-slate-50">
                {editingId === partner.id ? (
                  <>
                    <td className="px-6 py-3">
                      <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="border border-slate-300 rounded px-2 py-1 text-sm w-full" />
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-500">{partner.email}</td>
                    <td className="px-6 py-3">
                      <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="border border-slate-300 rounded px-2 py-1 text-sm w-full" />
                    </td>
                    <td className="px-6 py-3">
                      <select value={editForm.vehicle} onChange={(e) => setEditForm({ ...editForm, vehicle: e.target.value })}
                        className="border border-slate-300 rounded px-2 py-1 text-sm w-full">
                        <option>Bike</option>
                        <option>Van</option>
                        <option>Bicycle</option>
                      </select>
                    </td>
                    <td className="px-6 py-3">
                      <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="border border-slate-300 rounded px-2 py-1 text-sm w-full mb-1">
                        <option>Active</option>
                        <option>On Delivery</option>
                        <option>Offline</option>
                      </select>
                      <input value={editForm.pincode}
                        onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                        placeholder="Base PIN"
                        inputMode="numeric"
                        title="Base PIN — decides which seller warehouses this partner can serve"
                        className="border border-slate-300 rounded px-2 py-1 text-sm w-full" />
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-400">—</td>
                    <td className="px-6 py-3 flex gap-3">
                      <button className="text-green-600 hover:text-green-800" onClick={() => handleEditSave(partner.id)}>Save</button>
                      <button className="text-slate-500 hover:text-slate-700" onClick={() => setEditingId(null)}><FaTimes /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 text-sm font-medium">{partner.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{partner.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{partner.phone}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{partner.vehicle}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        partner.status === "Active" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"
                      }`}>
                        {partner.status}
                      </span>
                      <div className="text-xs text-slate-500 mt-1 font-mono">
                        {partner.pincode ? `PIN ${partner.pincode}` : <span className="text-amber-600">no base PIN</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        ACCOUNT_BADGE[partner.accountStatus || "active"]
                      }`}>
                        {partner.accountStatus || "active"}
                      </span>
                      {partner.unsuspensionRequest?.status === "pending" && (
                        <span className="ml-2 text-xs font-medium text-amber-700">appeal pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex gap-3">
                      <button className="text-blue-600 hover:text-blue-800" title="Edit" onClick={() => startEdit(partner)}><FaEdit /></button>
                      {(partner.accountStatus || "active") === "active" ? (
                        <button className="text-amber-600 hover:text-amber-800" title="Suspend account" onClick={() => handleAccountStatus(partner, "suspended")}><FaBan /></button>
                      ) : (
                        <button className="text-green-600 hover:text-green-800" title="Reactivate account" onClick={() => handleAccountStatus(partner, "active")}><FaUndo /></button>
                      )}
                      {(partner.accountStatus || "active") !== "deactivated" && (
                        <button className="text-red-600 hover:text-red-800" title="Deactivate account" onClick={() => handleRemove(partner.id)}><FaTrash /></button>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && partners.length === 0 && (
          <p className="text-center text-slate-500 py-10 text-sm">No delivery partners yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}
