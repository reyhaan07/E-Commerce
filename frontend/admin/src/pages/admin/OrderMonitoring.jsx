import { useState } from "react";
import { FaEye, FaCheckCircle, FaHourglassHalf, FaTruck } from "react-icons/fa";

export default function OrderMonitoring() {
  const [orders] = useState([
    { id: "ORD001", customer: "John Doe", products: 3, amount: "₹8,499", status: "delivered", date: "2024-05-10" },
    { id: "ORD002", customer: "Jane Smith", products: 1, amount: "₹2,499", status: "in_transit", date: "2024-05-15" },
    { id: "ORD003", customer: "Mike Johnson", products: 2, amount: "₹5,998", status: "processing", date: "2024-05-18" },
    { id: "ORD004", customer: "Sarah Williams", products: 5, amount: "₹12,450", status: "delivered", date: "2024-05-08" },
    { id: "ORD005", customer: "Tom Brown", products: 1, amount: "₹999", status: "in_transit", date: "2024-05-17" },
    { id: "ORD006", customer: "Emma Davis", products: 4, amount: "₹11,890", status: "processing", date: "2024-05-19" },
  ]);

  const [selectedOrders, setSelectedOrders] = useState([]);

  const toggleOrderSelect = (id) => {
    setSelectedOrders(prev =>
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const toggleAllOrders = () => {
    setSelectedOrders(selectedOrders.length === orders.length ? [] : orders.map(o => o.id));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "delivered":
        return <FaCheckCircle className="text-green-600" />;
      case "in_transit":
        return <FaTruck className="text-blue-600" />;
      case "processing":
        return <FaHourglassHalf className="text-yellow-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Order Monitoring</h1>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Total Orders</p>
          <p className="text-3xl font-bold mt-2">{orders.length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Delivered</p>
          <p className="text-3xl font-bold mt-2">{orders.filter(o => o.status === "delivered").length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">In Transit</p>
          <p className="text-3xl font-bold mt-2">{orders.filter(o => o.status === "in_transit").length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Processing</p>
          <p className="text-3xl font-bold mt-2">{orders.filter(o => o.status === "processing").length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedOrders.length === orders.length && orders.length > 0}
                  onChange={toggleAllOrders}
                  className="w-4 h-4"
                />
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Order ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Products</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => toggleOrderSelect(order.id)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="px-6 py-4 text-sm font-medium">{order.id}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{order.customer}</td>
                <td className="px-6 py-4 text-sm text-center">{order.products}</td>
                <td className="px-6 py-4 text-sm font-semibold">{order.amount}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === "delivered"
                      ? "bg-green-50 text-green-700"
                      : order.status === "in_transit"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-yellow-50 text-yellow-700"
                  }`}>
                    {getStatusIcon(order.status)}
                    {order.status === "delivered" ? "Delivered" : order.status === "in_transit" ? "In Transit" : "Processing"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{order.date}</td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-800">
                    <FaEye />
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