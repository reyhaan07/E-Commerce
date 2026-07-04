import { useState } from "react";
import { FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

export default function UserManagement() {
  const [users] = useState([
    { id: 1, name: "John Doe", email: "john@example.com", phone: "9876543210", status: "active", joined: "2024-01-15" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "9876543211", status: "active", joined: "2024-02-20" },
    { id: 3, name: "Mike Johnson", email: "mike@example.com", phone: "9876543212", status: "inactive", joined: "2024-03-10" },
    { id: 4, name: "Sarah Williams", email: "sarah@example.com", phone: "9876543213", status: "active", joined: "2024-01-25" },
    { id: 5, name: "Tom Brown", email: "tom@example.com", phone: "9876543214", status: "active", joined: "2024-04-05" },
    { id: 6, name: "Emma Davis", email: "emma@example.com", phone: "9876543215", status: "inactive", joined: "2024-02-14" },
  ]);

  const [selectedUsers, setSelectedUsers] = useState([]);

  const toggleUserSelect = (id) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const toggleAllUsers = () => {
    setSelectedUsers(selectedUsers.length === users.length ? [] : users.map(u => u.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <button className="btn-primary">Add New User</button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Total Users</p>
          <p className="text-3xl font-bold mt-2">{users.length}</p>
        </div>
        <div className="flex-1 rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Active Users</p>
          <p className="text-3xl font-bold mt-2">{users.filter(u => u.status === "active").length}</p>
        </div>
        <div className="flex-1 rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Inactive Users</p>
          <p className="text-3xl font-bold mt-2">{users.filter(u => u.status === "inactive").length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={toggleAllUsers}
                  className="w-4 h-4"
                />
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUserSelect(user.id)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="px-6 py-4 text-sm font-medium">{user.name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{user.phone}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    user.status === "active" 
                      ? "bg-green-50 text-green-700" 
                      : "bg-red-50 text-red-700"
                  }`}>
                    {user.status === "active" ? <FaCheckCircle /> : <FaTimesCircle />}
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{user.joined}</td>
                <td className="px-6 py-4 flex gap-3">
                  <button className="text-blue-600 hover:text-blue-800">
                    <FaEdit />
                  </button>
                  <button className="text-red-600 hover:text-red-800">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}