import { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaTimes, FaBan, FaUndo, FaFileAlt, FaFilePdf, FaMotorcycle, FaExternalLinkAlt } from "react-icons/fa";
import {
  getDeliveryPartners,
  addDeliveryPartner,
  updateDeliveryPartner,
  removeDeliveryPartner,
  setPartnerAccountStatus,
  reviewUnsuspensionRequest,
} from "../../api/deliveryPartners";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  vehicle: "Bike",
  vehicleModel: "",
  vehicleNumber: "",
  pincode: "",
  zone: "",
};

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
  const [inspectPartner, setInspectPartner] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

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
      await addDeliveryPartner({
        ...newPartner,
        vehicleNumber: newPartner.vehicleNumber ? newPartner.vehicleNumber.trim().toUpperCase() : "",
      });
      setNewPartner(emptyForm);
      setShowAddForm(false);
      loadPartners();
    } catch (err) {
      alert(err.message || "Could not add delivery partner");
    }
  }

  function startEdit(partner) {
    setEditingId(partner.id);
    setEditForm({
      name: partner.name,
      phone: partner.phone,
      vehicle: partner.vehicle,
      vehicleModel: partner.vehicleModel || "",
      vehicleNumber: partner.vehicleNumber || "",
      status: partner.status,
      pincode: partner.pincode || "",
      zone: partner.zone || "",
    });
  }

  async function handleEditSave(id) {
    try {
      await updateDeliveryPartner(id, {
        ...editForm,
        vehicleNumber: editForm.vehicleNumber ? editForm.vehicleNumber.trim().toUpperCase() : "",
      });
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
            <option>Truck</option>
            <option>Bicycle</option>
          </select>
          <input placeholder="Bike / Vehicle Model (e.g. Honda Activa 6G)" value={newPartner.vehicleModel}
            onChange={(e) => setNewPartner({ ...newPartner, vehicleModel: e.target.value })}
            className="border border-slate-300 rounded-lg px-4 py-2" />
          <input placeholder="Vehicle Number Plate (e.g. TN-01-AB-1234)" value={newPartner.vehicleNumber}
            onChange={(e) => setNewPartner({ ...newPartner, vehicleNumber: e.target.value.toUpperCase() })}
            className="border border-slate-300 rounded-lg px-4 py-2" />
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
              <th className="px-6 py-3 text-left text-sm font-semibold">Contact</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Vehicle Fleet</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Reg Plate</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Documents</th>
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
                    <td className="px-6 py-3">
                      <div className="text-xs text-slate-500 mb-1">{partner.email}</div>
                      <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="Phone" className="border border-slate-300 rounded px-2 py-1 text-sm w-full" />
                    </td>
                    <td className="px-6 py-3">
                      <select value={editForm.vehicle} onChange={(e) => setEditForm({ ...editForm, vehicle: e.target.value })}
                        className="border border-slate-300 rounded px-2 py-1 text-sm w-full mb-1">
                        <option>Bike</option>
                        <option>Van</option>
                        <option>Truck</option>
                        <option>Bicycle</option>
                      </select>
                      <input value={editForm.vehicleModel} onChange={(e) => setEditForm({ ...editForm, vehicleModel: e.target.value })}
                        placeholder="Model" className="border border-slate-300 rounded px-2 py-1 text-sm w-full" />
                    </td>
                    <td className="px-6 py-3">
                      <input value={editForm.vehicleNumber} onChange={(e) => setEditForm({ ...editForm, vehicleNumber: e.target.value.toUpperCase() })}
                        placeholder="Number Plate" className="border border-slate-300 rounded px-2 py-1 text-sm w-full uppercase" />
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-400">
                      {partner.documents?.length || 0} Docs
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
                      <button className="text-green-600 hover:text-green-800 font-semibold text-sm" onClick={() => handleEditSave(partner.id)}>Save</button>
                      <button className="text-slate-500 hover:text-slate-700" onClick={() => setEditingId(null)}><FaTimes /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{partner.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-slate-700 font-medium">{partner.email}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{partner.phone || "No phone"}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      <span className="font-semibold">{partner.vehicle}</span>
                      {partner.vehicleModel && (
                        <div className="text-xs text-slate-500 mt-0.5">{partner.vehicleModel}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {partner.vehicleNumber ? (
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded border border-slate-200 uppercase">
                          {partner.vehicleNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not added</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {partner.documents?.length > 0 ? (
                        <button
                          onClick={() => setInspectPartner(partner)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer"
                        >
                          <FaFileAlt size={11} /> {partner.documents.length} File{partner.documents.length > 1 ? "s" : ""}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </td>
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

      {/* Verification Documents Inspection Modal */}
      {inspectPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setInspectPartner(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{inspectPartner.name} — Uploaded Documents</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {inspectPartner.vehicle} {inspectPartner.vehicleModel ? `(${inspectPartner.vehicleModel})` : ""} · {inspectPartner.vehicleNumber || "No plate"}
                </p>
              </div>
              <button onClick={() => setInspectPartner(null)} className="text-slate-400 hover:text-slate-600">
                <FaTimes size={16} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              {(!inspectPartner.documents || inspectPartner.documents.length === 0) ? (
                <p className="text-sm text-slate-500 text-center py-6">No documents were uploaded for this partner.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {inspectPartner.documents.map((doc, idx) => {
                    const isPdf = typeof doc.dataUrl === "string" && doc.dataUrl.startsWith("data:application/pdf");
                    return (
                      <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            {isPdf ? <FaFilePdf size={18} /> : <FaFileAlt size={18} />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm text-slate-900 truncate">{doc.label || doc.type}</h4>
                            <p className="text-xs text-slate-500 truncate">{doc.fileName || (isPdf ? "Document.pdf" : "Image")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                          <button
                            onClick={() => setPreviewDoc({ ...doc, isPdf })}
                            className="flex-1 text-center py-1.5 px-3 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                          >
                            Preview
                          </button>
                          <a
                            href={doc.dataUrl}
                            download={doc.fileName || `${doc.type || "doc"}`}
                            className="p-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-200/60 transition-colors"
                            title="Download"
                          >
                            <FaExternalLinkAlt size={13} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Single Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[88vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">{previewDoc.label || "Document Preview"}</h3>
              <div className="flex items-center gap-3">
                <a
                  href={previewDoc.dataUrl}
                  download={previewDoc.fileName || "document"}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1.5 font-medium"
                >
                  <FaExternalLinkAlt size={12} /> Download
                </a>
                <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-slate-600">
                  <FaTimes size={16} />
                </button>
              </div>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center overflow-auto flex-1">
              {previewDoc.isPdf ? (
                <iframe title="Document Preview" src={previewDoc.dataUrl} className="w-full h-[65vh] rounded-lg border border-slate-200 bg-white" />
              ) : (
                <img src={previewDoc.dataUrl} alt={previewDoc.label} className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-sm" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
