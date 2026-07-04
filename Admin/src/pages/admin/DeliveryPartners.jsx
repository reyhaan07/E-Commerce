import { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaTimes } from "react-icons/fa";
import {
  getDeliveryPartners,
  addDeliveryPartner,
  updateDeliveryPartner,
  removeDeliveryPartner,
} from "../../api/deliveryPartners";

const emptyForm = { name: "", email: "", password: "", phone: "", vehicle: "Bike" };

export default function DeliveryPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPartner, setNewPartner] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

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
    setEditForm({ name: partner.name, phone: partner.phone, vehicle: partner.vehicle, status: partner.status });
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
    if (!confirm("Remove this delivery partner? Any assigned orders will be un-assigned.")) return;
    try {
      await removeDeliveryPartner(id);
      loadPartners();
    } catch (err) {
      alert(err.message || "Could not remove delivery partner");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Delivery Partners</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddForm((v) => !v)}>
          <FaPlus size={12} /> {showAddForm ? "Cancel" : "Add Delivery Partner"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="rounded-lg bg-white p-6 shadow border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input required placeholder="Full name" value={newPartner.name}
            onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
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
                        className="border border-slate-300 rounded px-2 py-1 text-sm w-full">
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </td>
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
                    </td>
                    <td className="px-6 py-4 flex gap-3">
                      <button className="text-blue-600 hover:text-blue-800" onClick={() => startEdit(partner)}><FaEdit /></button>
                      <button className="text-red-600 hover:text-red-800" onClick={() => handleRemove(partner.id)}><FaTrash /></button>
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
