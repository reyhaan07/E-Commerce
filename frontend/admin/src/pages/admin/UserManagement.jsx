import { useEffect, useState } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { apiRequest } from "../../api/client";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState("");

  function refresh() {
    apiRequest("/admin/accounts?role=user")
      .then((data) => setUsers(data.accounts))
      .catch((err) => setFeedback(err.message));
  }

  useEffect(refresh, []);

  async function toggleStatus(user) {
    const status = user.status === "active" ? "suspended" : "active";
    try {
      await apiRequest(`/admin/accounts/${user.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setFeedback(`${user.name} is now ${status}`);
      refresh();
    } catch (err) {
      setFeedback(err.message);
    }
  }

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>
        <input
          className="border border-slate-200 rounded-lg px-4 py-2 w-72"
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1 rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Total Users</p>
          <p className="text-3xl font-bold mt-2">{users.length}</p>
        </div>
        <div className="flex-1 rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Active</p>
          <p className="text-3xl font-bold mt-2">{users.filter((u) => u.status === "active").length}</p>
        </div>
        <div className="flex-1 rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Suspended</p>
          <p className="text-3xl font-bold mt-2">{users.filter((u) => u.status !== "active").length}</p>
        </div>
      </div>

      {feedback && <p className="text-sm font-medium text-blue-700">{feedback}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">City</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Loyalty</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium">{user.name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{user.phone}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{user.addresses?.[0]?.city || "—"}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{user.loyaltyPoints} pts</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    user.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}>
                    {user.status === "active" ? <FaCheckCircle /> : <FaTimesCircle />}
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleStatus(user)}
                    className={`text-sm font-semibold ${user.status === "active" ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}`}
                  >
                    {user.status === "active" ? "Suspend" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-400">No users match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
