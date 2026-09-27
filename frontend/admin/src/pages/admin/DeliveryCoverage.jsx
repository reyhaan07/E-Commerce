// Delivery Coverage — gate 2 of serviceability.
//
// A seller's serviceable PIN list decides whether an order *can* be delivered
// (gate 1, managed by the seller). This screen decides *who* can carry it: a
// delivery partner is only matched to an order if their base PIN sits in the
// same catchment as the seller's dispatch PIN. Those catchments used to be
// hard-coded in backend/data/pincodes.js.

import { useEffect, useState } from "react";
import { FaPlus, FaTimes, FaTrash, FaSearch } from "react-icons/fa";
import { getCoverage, createZone, updateZone, deleteZone, previewCoverage } from "../../api/coverage";

const emptyZone = { city: "", hub: "", near: [], outliers: [] };

// A list of PIN chips with an add box. Used for both `near` and `outliers`.
function PinEditor({ label, pins, onChange, tone = "brand", hint }) {
  const [draft, setDraft] = useState("");

  function add() {
    const pin = draft.trim();
    if (!/^\d{6}$/.test(pin)) return;
    if (!pins.includes(pin)) onChange([...pins, pin]);
    setDraft("");
  }

  const chip = tone === "muted"
    ? "bg-slate-100 text-slate-600"
    : "bg-brand-50 text-brand-700";

  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1.5">
        {label} ({pins.length})
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {pins.length === 0 && <span className="text-xs text-slate-400">None yet.</span>}
        {pins.map((pin) => (
          <span key={pin} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${chip}`}>
            {pin}
            <button type="button" onClick={() => onChange(pins.filter((p) => p !== pin))} className="hover:text-red-600">
              <FaTimes size={9} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="6-digit PIN"
          inputMode="numeric"
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-40"
        />
        <button type="button" onClick={add} className="text-sm font-semibold text-brand-600 hover:text-brand-800">Add</button>
      </div>
      {hint && <p className="text-xs text-slate-400 mt-1.5">{hint}</p>}
    </div>
  );
}

export default function DeliveryCoverage() {
  const [zones, setZones] = useState([]);
  const [orphans, setOrphans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [editing, setEditing] = useState(null); // zone being edited
  const [creating, setCreating] = useState(null); // new zone draft
  const [busy, setBusy] = useState(false);
  const [probe, setProbe] = useState("");
  const [probeResult, setProbeResult] = useState(null);

  function refresh() {
    setLoading(true);
    getCoverage()
      .then((d) => { setZones(d.clusters); setOrphans(d.orphanPartners || []); })
      .catch((err) => setFeedback(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function save() {
    const draft = editing || creating;
    if (!draft.city.trim()) { setFeedback("Give the zone a city name."); return; }
    if (!/^\d{6}$/.test(String(draft.hub || "").trim())) { setFeedback("The hub must be a 6-digit PIN code."); return; }
    setBusy(true);
    try {
      if (editing) {
        await updateZone(editing.id, { city: draft.city, hub: draft.hub, near: draft.near, outliers: draft.outliers });
        setFeedback(`${draft.city} coverage updated — partner matching uses it immediately.`);
      } else {
        await createZone(draft);
        setFeedback(`${draft.city} coverage zone created.`);
      }
      setEditing(null);
      setCreating(null);
      refresh();
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(zone) {
    if (!confirm(`Delete the ${zone.city} coverage zone? Delivery partners in it will stop being matched to any order.`)) return;
    try {
      await deleteZone(zone.id);
      setFeedback(`${zone.city} zone deleted.`);
      refresh();
    } catch (err) {
      setFeedback(err.message);
    }
  }

  async function runProbe(e) {
    e.preventDefault();
    setProbeResult(null);
    try {
      setProbeResult(await previewCoverage(probe.trim()));
    } catch (err) {
      setFeedback(err.message);
    }
  }

  const draft = editing || creating;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Delivery Coverage</h1>
          <p className="text-sm text-slate-500 mt-1">
            PIN codes grouped into catchments. A delivery partner can only be assigned to an order
            when their base PIN is in the same zone as the seller&apos;s dispatch PIN.
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setCreating({ ...emptyZone }); setEditing(null); }}>
          <FaPlus size={12} /> Add zone
        </button>
      </div>

      {feedback && <p className="text-sm font-medium text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-4 py-2">{feedback}</p>}

      {orphans.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-800">
            {orphans.length} delivery partner{orphans.length > 1 ? "s sit" : " sits"} on a PIN no zone covers — they can never be assigned an order.
          </p>
          <p className="text-sm text-amber-700 mt-1">
            {orphans.map((o) => `${o.name} (${o.pincode})`).join(", ")}
          </p>
        </div>
      )}

      {/* Coverage probe — check a warehouse PIN without opening an order */}
      <form onSubmit={runProbe} className="rounded-lg bg-white shadow border border-slate-200 p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1.5">Check a dispatch PIN</label>
          <input
            value={probe}
            onChange={(e) => setProbe(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="e.g. 500001"
            inputMode="numeric"
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-44"
          />
        </div>
        <button type="submit" className="flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-800 pb-2">
          <FaSearch size={12} /> Who can deliver from here?
        </button>
        {probeResult && (
          <div className="text-sm text-slate-600 pb-1.5">
            Reaches <span className="font-semibold">{probeResult.nearby.join(", ")}</span> ·{" "}
            {probeResult.partners.length === 0
              ? <span className="text-red-600 font-semibold">no partners in this catchment</span>
              : <span className="font-semibold text-green-700">{probeResult.partners.map((p) => `${p.name} (${p.status})`).join(", ")}</span>}
          </div>
        )}
      </form>

      {/* Create / edit form */}
      {draft && (
        <div className="rounded-lg bg-white shadow border border-slate-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">{editing ? `Edit ${editing.city}` : "New coverage zone"}</h2>
            <button onClick={() => { setEditing(null); setCreating(null); }} className="text-slate-400 hover:text-slate-600"><FaTimes /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1.5">City</label>
              <input
                value={draft.city}
                onChange={(e) => (editing ? setEditing : setCreating)({ ...draft, city: e.target.value })}
                placeholder="Hyderabad"
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1.5">Hub PIN</label>
              <input
                value={draft.hub}
                onChange={(e) => (editing ? setEditing : setCreating)({ ...draft, hub: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                placeholder="500001"
                inputMode="numeric"
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full"
              />
              <p className="text-xs text-slate-400 mt-1.5">Always part of the catchment.</p>
            </div>
          </div>

          <PinEditor
            label="Catchment PINs"
            pins={draft.near}
            onChange={(near) => (editing ? setEditing : setCreating)({ ...draft, near })}
            hint="Partners based on any of these PINs can serve sellers dispatching from any of them."
          />
          <PinEditor
            label="Excluded PINs"
            pins={draft.outliers}
            tone="muted"
            onChange={(outliers) => (editing ? setEditing : setCreating)({ ...draft, outliers })}
            hint="Same city, deliberately outside the catchment. Recorded for clarity; they are simply not in the list above."
          />

          <div className="flex justify-end gap-3">
            <button onClick={() => { setEditing(null); setCreating(null); }} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm">Cancel</button>
            <button onClick={save} disabled={busy} className="btn-primary disabled:opacity-50">{busy ? "Saving…" : "Save zone"}</button>
          </div>
        </div>
      )}

      {/* Zones */}
      <div className="rounded-lg bg-white shadow border border-slate-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">City</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Hub</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Catchment PINs</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Partners</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Sellers</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && zones.map((z) => (
              <tr key={z.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium">{z.city}</td>
                <td className="px-6 py-4 text-sm font-mono text-slate-600">{z.hub}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {z.near.map((p) => (
                      <span key={p} className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-xs font-mono">{p}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={z.availablePartnerCount === 0 ? "text-red-600 font-semibold" : "text-slate-700"}>
                    {z.availablePartnerCount} available
                  </span>
                  <span className="text-slate-400"> / {z.partnerCount}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{z.sellerCount}</td>
                <td className="px-6 py-4 flex gap-3">
                  <button className="text-sm font-semibold text-blue-600 hover:text-blue-800" onClick={() => { setEditing({ ...z }); setCreating(null); }}>Edit</button>
                  <button className="text-red-600 hover:text-red-800" title="Delete zone" onClick={() => remove(z)}><FaTrash size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="text-center text-slate-500 py-10 text-sm">Loading coverage…</p>}
        {!loading && zones.length === 0 && (
          <p className="text-center text-slate-500 py-10 text-sm">No coverage zones yet. Add one so delivery partners can be matched to orders.</p>
        )}
      </div>
    </div>
  );
}
