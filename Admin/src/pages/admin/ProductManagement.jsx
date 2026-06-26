import { useState } from "react";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";

export default function ProductManagement() {
  const [products] = useState([
    { id: 1, name: "Wireless Headphones", category: "Electronics", seller: "Tech Store", price: "₹2,499", stock: 45, status: "active", added: "2024-01-10" },
    { id: 2, name: "Blue Denim Jeans", category: "Fashion", seller: "Fashion Hub", price: "₹999", stock: 120, status: "active", added: "2024-02-15" },
    { id: 3, name: "Coffee Maker", category: "Home", seller: "Home Essentials", price: "₹1,899", stock: 0, status: "out_of_stock", added: "2024-03-01" },
    { id: 4, name: "Smart Watch", category: "Electronics", seller: "Tech Store", price: "₹4,999", stock: 32, status: "active", added: "2024-01-20" },
    { id: 5, name: "Face Serum", category: "Beauty", seller: "Beauty World", price: "₹899", stock: 200, status: "active", added: "2024-04-05" },
    { id: 6, name: "Running Shoes", category: "Fashion", seller: "Fashion Hub", price: "₹3,499", stock: 15, status: "active", added: "2024-04-10" },
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <button className="btn-primary">Add New Product</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Total Products</p>
          <p className="text-3xl font-bold mt-2">{products.length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Active</p>
          <p className="text-3xl font-bold mt-2">{products.filter(p => p.status === "active").length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Out of Stock</p>
          <p className="text-3xl font-bold mt-2">{products.filter(p => p.status === "out_of_stock").length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Low Stock</p>
          <p className="text-3xl font-bold mt-2">{products.filter(p => p.stock < 50 && p.stock > 0).length}</p>
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
              <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Seller</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Stock</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
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
                <td className="px-6 py-4 text-sm text-slate-600">{product.category}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{product.seller}</td>
                <td className="px-6 py-4 text-sm font-semibold">{product.price}</td>
                <td className="px-6 py-4 text-sm">{product.stock}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                    product.status === "active" 
                      ? "bg-green-50 text-green-700" 
                      : "bg-red-50 text-red-700"
                  }`}>
                    {product.status === "active" ? "Active" : "Out of Stock"}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-3">
                  <button className="text-slate-600 hover:text-slate-800">
                    <FaEye />
                  </button>
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