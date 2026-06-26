import { useState } from "react";
import { FaCheck, FaHourglassHalf, FaTimes } from "react-icons/fa";

export default function RefundTracking() {
  const [refunds] = useState([
    { id: "REF001", orderID: "ORD001", customer: "John Doe", amount: "₹2,499", reason: "Product Damaged", status: "approved", date: "2024-05-12" },
    { id: "REF002", orderID: "ORD002", customer: "Jane Smith", amount: "₹1,999", reason: "Wrong Item", status: "pending", date: "2024-05-16" },
    { id: "REF003", orderID: "ORD003", customer: "Mike Johnson", amount: "₹2,999", reason: "Not as Described", status: "approved", date: "2024-05-14" },
    { id: "REF004", orderID: "ORD004", customer: "Sarah Williams", amount: "₹3,450", reason: "Changed Mind", status: "rejected", date: "2024-05-11" },
    { id: "REF005", orderID: "ORD005", customer: "Tom Brown", amount: "₹999", reason: "Quality Issue", status: "pending", date: "2024-05-18" },
  ]);

  const [selectedRefunds, setSelectedRefunds] = useState([]);

  const toggleRefundSelect = (id) => {
    setSelectedRefunds(prev =>
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  const toggleAllRefunds = () => {
    setSelectedRefunds(selectedRefunds.length === refunds.length ? [] : refunds.map(r => r.id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Refund Tracking</h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Total Refunds</p>
          <p className="text-3xl font-bold mt-2">{refunds.length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Approved</p>
          <p className="text-3xl font-bold mt-2">{refunds.filter(r => r.status === "approved").length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Pending</p>
          <p className="text-3xl font-bold mt-2">{refunds.filter(r => r.status === "pending").length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Total Amount</p>
          <p className="text-2xl font-bold mt-2">₹11,946</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedRefunds.length === refunds.length && refunds.length > 0}
                  onChange={toggleAllRefunds}
                  className="w-4 h-4"
                />
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Refund ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Order ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Reason</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map((refund) => (
              <tr key={refund.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedRefunds.includes(refund.id)}
                    onChange={() => toggleRefundSelect(refund.id)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="px-6 py-4 text-sm font-medium">{refund.id}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{refund.orderID}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{refund.customer}</td>
                <td className="px-6 py-4 text-sm font-semibold">{refund.amount}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{refund.reason}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                    refund.status === "approved"
                      ? "bg-green-50 text-green-700"
                      : refund.status === "pending"
                      ? "bg-yellow-50 text-yellow-700"
                      : "bg-red-50 text-red-700"
                  }`}>
                    {refund.status === "approved" ? <FaCheck /> : refund.status === "pending" ? <FaHourglassHalf /> : <FaTimes />}
                    {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{refund.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}