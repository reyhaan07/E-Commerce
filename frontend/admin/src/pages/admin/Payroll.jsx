import { useEffect, useState } from "react";
import { FaMoneyBillWave, FaCheck, FaTimes, FaSyncAlt, FaEdit, FaTruck, FaUserShield } from "react-icons/fa";
import { apiRequest } from "../../api/client";

function currentPeriod() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const ROLE_BADGE = {
  delivery: { cls: "bg-sky-50 text-sky-700", Icon: FaTruck, label: "Delivery" },
  admin: { cls: "bg-violet-50 text-violet-700", Icon: FaUserShield, label: "Admin/Staff" },
};

export default function Payroll() {
  const [period, setPeriod] = useState(currentPeriod());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");

  function load(p = period) {
    setLoading(true);
    apiRequest(`/payroll?period=${p}`)
      .then((d) => setRows(d.payroll || []))
      .catch((err) => setFeedback(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(period); }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  async function generate() {
    setGenerating(true);
    setFeedback("");
    try {
      const d = await apiRequest("/payroll/generate", { method: "POST", body: JSON.stringify({ period }) });
      setRows(d.payroll || []);
      setFeedback(`Payroll generated for ${period} — ${d.payroll.length} staff, delivery counts pulled from real orders`);
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setGenerating(false);
    }
  }

  function startEdit(row) {
    setEditingId(row.id);
    setEditForm({ baseSalary: row.baseSalary, incentivePerDelivery: row.incentivePerDelivery, deductions: row.deductions });
  }

  async function patchRow(row, body, note) {
    setBusyId(row.id);
    setFeedback("");
    try {
      const d = await apiRequest(`/payroll/${row.id}`, { method: "PATCH", body: JSON.stringify(body) });
      setRows((rs) => rs.map((r) => (r.id === row.id ? d.payroll : r)));
      if (note) setFeedback(note);
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function saveEdit(row) {
    await patchRow(row, {
      baseSalary: Number(editForm.baseSalary),
      incentivePerDelivery: Number(editForm.incentivePerDelivery),
      deductions: Number(editForm.deductions),
    }, `${row.staffName}'s payroll updated`);
    setEditingId(null);
  }

  const markPaid = (row) => patchRow(row, { status: "Paid" }, `${row.staffName} marked Paid — they've been notified`);

  const filtered = rows.filter((r) => roleFilter === "all" || r.staffRole === roleFilter);
  const totalPayroll = rows.reduce((s, r) => s + r.netPay, 0);
  const paidRows = rows.filter((r) => r.status === "Paid");
  const paidTotal = paidRows.reduce((s, r) => s + r.netPay, 0);
  const pendingTotal = totalPayroll - paidTotal;

  const Tile = ({ label, value, sub, color }) => (
    <div className="rounded-2xl bg-white shadow-soft border border-slate-100 p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Payroll</h1>
          <p className="text-slate-500 text-sm">Salary, incentives and payouts for delivery partners and staff</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <button onClick={generate} disabled={generating}
            className="btn-primary flex items-center gap-2">
            <FaSyncAlt size={12} className={generating ? "animate-spin" : ""} /> {generating ? "Generating…" : "Generate payroll"}
          </button>
        </div>
      </div>

      {feedback && <p className="text-sm font-medium text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-4 py-2">{feedback}</p>}

      {/* Summary tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Tile label="Total payroll" value={inr(totalPayroll)} sub={`${rows.length} staff for ${period}`} color="#1d4ed8" />
        <Tile label="Paid" value={inr(paidTotal)} sub={`${paidRows.length} paid`} color="#059669" />
        <Tile label="Pending" value={inr(pendingTotal)} sub={`${rows.length - paidRows.length} awaiting payout`} color="#d97706" />
      </div>

      {/* Role filter */}
      <div className="flex items-center gap-2">
        {["all", "delivery", "admin"].map((f) => (
          <button key={f} onClick={() => setRoleFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${roleFilter === f ? "bg-brand-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {f === "all" ? "All staff" : f === "delivery" ? "Delivery Partners" : "Admin/Staff"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {["Staff", "Role", "Base Salary", "Deliveries", "Incentive/Del.", "Incentive", "Deductions", "Net Pay", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400 text-sm">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400 text-sm">
                No payroll for {period} yet. Click <b>Generate payroll</b> to build it from staff records and delivered orders.
              </td></tr>
            ) : filtered.map((row) => {
              const editing = editingId === row.id;
              const rb = ROLE_BADGE[row.staffRole] || ROLE_BADGE.admin;
              return (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 text-sm">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{row.staffName}<div className="text-[11px] text-slate-400 font-mono">{row.staffId}</div></td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${rb.cls}`}><rb.Icon size={10} /> {rb.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    {editing
                      ? <input type="number" min="0" value={editForm.baseSalary} onChange={(e) => setEditForm((f) => ({ ...f, baseSalary: e.target.value }))} className="border border-slate-300 rounded px-2 py-1 text-sm w-24" />
                      : inr(row.baseSalary)}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">{row.deliveriesCount}</td>
                  <td className="px-4 py-3">
                    {editing
                      ? <input type="number" min="0" value={editForm.incentivePerDelivery} onChange={(e) => setEditForm((f) => ({ ...f, incentivePerDelivery: e.target.value }))} className="border border-slate-300 rounded px-2 py-1 text-sm w-20" />
                      : inr(row.incentivePerDelivery)}
                  </td>
                  <td className="px-4 py-3">{inr(row.incentiveTotal)}</td>
                  <td className="px-4 py-3 text-rose-600">
                    {editing
                      ? <input type="number" min="0" value={editForm.deductions} onChange={(e) => setEditForm((f) => ({ ...f, deductions: e.target.value }))} className="border border-slate-300 rounded px-2 py-1 text-sm w-20" />
                      : (row.deductions ? `- ${inr(row.deductions)}` : "—")}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">{inr(row.netPay)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${row.status === "Paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{row.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {editing ? (
                        <>
                          <button onClick={() => saveEdit(row)} disabled={busyId === row.id} className="text-green-600 hover:text-green-800" title="Save"><FaCheck /></button>
                          <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600" title="Cancel"><FaTimes /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(row)} className="text-blue-600 hover:text-blue-800" title="Edit"><FaEdit /></button>
                          {row.status !== "Paid" && (
                            <button onClick={() => markPaid(row)} disabled={busyId === row.id}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-semibold disabled:opacity-50">
                              <FaMoneyBillWave size={11} /> Pay
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
