import { useState } from "react";
import { FaChartLine, FaArrowUp, FaArrowDown } from "react-icons/fa";

export default function AnalyticsDashboard() {
  const [chartData] = useState({
    monthlyRevenue: [
      { month: "Jan", revenue: 45000 },
      { month: "Feb", revenue: 52000 },
      { month: "Mar", revenue: 48000 },
      { month: "Apr", revenue: 61000 },
      { month: "May", revenue: 75000 },
    ],
    topSellingProducts: [
      { name: "Wireless Headphones", sales: 234, revenue: "₹58,500" },
      { name: "Smart Watch", sales: 189, revenue: "₹94,500" },
      { name: "Blue Denim Jeans", sales: 145, revenue: "₹1,44,500" },
      { name: "Running Shoes", sales: 98, revenue: "₹3,42,700" },
    ],
    categoryStats: [
      { category: "Electronics", percentage: 35, revenue: "₹2,62,500" },
      { category: "Fashion", percentage: 28, revenue: "₹2,10,000" },
      { category: "Home", percentage: 22, revenue: "₹1,65,000" },
      { category: "Beauty", percentage: 15, revenue: "₹1,12,500" },
    ]
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Revenue</p>
              <p className="text-3xl font-bold mt-2">₹7,50,000</p>
            </div>
            <FaChartLine className="text-4xl text-blue-600 opacity-20" />
          </div>
          <div className="mt-3 flex items-center gap-1 text-green-600">
            <FaArrowUp size={12} /> 12% increase
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Orders</p>
              <p className="text-3xl font-bold mt-2">8,245</p>
            </div>
            <FaChartLine className="text-4xl text-green-600 opacity-20" />
          </div>
          <div className="mt-3 flex items-center gap-1 text-green-600">
            <FaArrowUp size={12} /> 8% increase
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Avg Order Value</p>
              <p className="text-3xl font-bold mt-2">₹910</p>
            </div>
            <FaChartLine className="text-4xl text-purple-600 opacity-20" />
          </div>
          <div className="mt-3 flex items-center gap-1 text-red-600">
            <FaArrowDown size={12} /> 3% decrease
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">New Customers</p>
              <p className="text-3xl font-bold mt-2">2,156</p>
            </div>
            <FaChartLine className="text-4xl text-orange-600 opacity-20" />
          </div>
          <div className="mt-3 flex items-center gap-1 text-green-600">
            <FaArrowUp size={12} /> 15% increase
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">Monthly Revenue</h3>
          <div className="space-y-4">
            {chartData.monthlyRevenue.map((data) => (
              <div key={data.month}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{data.month}</span>
                  <span className="text-sm text-slate-600">₹{(data.revenue / 1000).toFixed(0)}K</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(data.revenue / 75000) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
          <div className="space-y-3">
            {chartData.topSellingProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100">
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-slate-600">{product.sales} sales</p>
                </div>
                <span className="text-sm font-semibold">{product.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
        <div className="space-y-4">
          {chartData.categoryStats.map((category) => (
            <div key={category.category}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{category.category}</span>
                <span className="text-sm font-semibold">{category.revenue}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-600 to-blue-400 h-3 rounded-full"
                  style={{ width: `${category.percentage}%` }}
                ></div>
              </div>
              <span className="text-xs text-slate-600">{category.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}