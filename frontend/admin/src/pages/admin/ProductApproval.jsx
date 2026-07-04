import { useState } from "react";
import { FaCheck, FaTimes, FaEye } from "react-icons/fa";

export default function ProductApproval() {
  const [products] = useState([
    { id: 1, name: "Premium Headphones", seller: "Tech Store", category: "Electronics", price: "₹3,999", submitted: "2024-05-15", status: "pending" },
    { id: 2, name: "Organic Face Cream", seller: "Beauty World", category: "Beauty", price: "₹599", submitted: "2024-05-14", status: "pending" },
    { id: 3, name: "Wool Sweater", seller: "Fashion Hub", category: "Fashion", price: "₹1,499", submitted: "2024-05-10", status: "approved" },
    { id: 4, name: "Kitchen Blender", seller: "Home Essentials", category: "Home", price: "₹2,499", submitted: "2024-05-08", status: "rejected" },
    { id: 5, name: "Sports Jacket", seller: "Fashion Hub", category: "Fashion", price: "₹1,899", submitted: "2024-05-16", status: "pending" },
  ]);

  const [selectedProducts, setSelectedProducts] = useState([]);

  const toggleProductSelect = (id) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const toggleAllProducts = () => {
    setSelectedProducts(selectedProducts.length === products.length ? [] : products.map(p => p.id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Product Approval</h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Pending Approval</p>
          <p className="text-3xl font-bold mt-2">{products.filter(p => p.status === "pending").length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Approved</p>
          <p className="text-3xl font-bold mt-2">{products.filter(p => p.status === "approved").length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Rejected</p>
          <p className="text-3xl font-bold mt-2">{products.filter(p => p.status === "rejected").length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Total Products</p>
          <p className="text-3xl font-bold mt-2">{products.length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onChange={toggleAllProducts}
                  className="w-4 h-4"
                />
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Product Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Seller</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Submitted</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => toggleProductSelect(product.id)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="px-6 py-4 text-sm font-medium">{product.name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{product.seller}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{product.category}</td>
                <td className="px-6 py-4 text-sm font-semibold">{product.price}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    product.status === "approved"
                      ? "bg-green-50 text-green-700"
                      : product.status === "pending"
                      ? "bg-yellow-50 text-yellow-700"
                      : "bg-red-50 text-red-700"
                  }`}>
                    {product.status === "approved" ? <FaCheck /> : product.status === "pending" ? <FaEye /> : <FaTimes />}
                    {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{product.submitted}</td>
                <td className="px-6 py-4 flex gap-2">
                  {product.status === "pending" && (
                    <>
                      <button className="text-green-600 hover:text-green-800 text-lg">
                        <FaCheck />
                      </button>
                      <button className="text-red-600 hover:text-red-800 text-lg">
                        <FaTimes />
                      </button>
                    </>
                  )}
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