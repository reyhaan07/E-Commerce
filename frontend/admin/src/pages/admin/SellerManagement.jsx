import { useState } from "react";
import { FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

export default function SellerManagement() {
  const [sellers] = useState([
    { id: 1, name: "Tech Store", email: "tech@example.com", phone: "9876543210", status: "active", revenue: "₹2,50,000", joined: "2023-12-01" },
    { id: 2, name: "Fashion Hub", email: "fashion@example.com", phone: "9876543211", status: "active", revenue: "₹1,80,000", joined: "2024-01-10" },
    { id: 3, name: "Home Essentials", email: "home@example.com", phone: "9876543212", status: "pending", revenue: "₹45,000", joined: "2024-05-15" },
    { id: 4, name: "Electronics Plus", email: "electronics@example.com", phone: "9876543213", status: "active", revenue: "₹3,20,000", joined: "2023-11-20" },
    { id: 5, name: "Beauty World", email: "beauty@example.com", phone: "9876543214", status: "suspended", revenue: "₹1,10,000", joined: "2024-02-05" },
  ]);

  const [selectedSellers, setSelectedSellers] = useState([]);

  const toggleSellerSelect = (id) => {
    setSelectedSellers(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const toggleAllSellers = () => {
    setSelectedSellers(selectedSellers.length === sellers.length ? [] : sellers.map(s => s.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Seller Management</h1>
        <button className="btn-primary">Add New Seller</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Total Sellers</p>
          <p className="text-3xl font-bold mt-2">{sellers.length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Active Sellers</p>
          <p className="text-3xl font-bold mt-2">{sellers.filter(s => s.status === "active").length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Pending</p>
          <p className="text-3xl font-bold mt-2">{sellers.filter(s => s.status === "pending").length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Total Revenue</p>
          <p className="text-2xl font-bold mt-2">₹8,95,000</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedSellers.length === sellers.length && sellers.length > 0}
                  onChange={toggleAllSellers}
                  className="w-4 h-4"
                />
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Store Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Revenue</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((seller) => (
              <tr key={seller.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedSellers.includes(seller.id)}
                    onChange={() => toggleSellerSelect(seller.id)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="px-6 py-4 text-sm font-medium">{seller.name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{seller.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    seller.status === "active" 
                      ? "bg-green-50 text-green-700" 
                      : seller.status === "pending"
                      ? "bg-yellow-50 text-yellow-700"
                      : "bg-red-50 text-red-700"
                  }`}>
                    <FaCheckCircle />
                    {seller.status.charAt(0).toUpperCase() + seller.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-semibold">{seller.revenue}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{seller.joined}</td>
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