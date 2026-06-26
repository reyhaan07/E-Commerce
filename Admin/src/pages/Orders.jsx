import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaBoxOpen, FaCheckCircle, FaTruck, FaShippingFast, FaTimesCircle } from "react-icons/fa";
import { orders, formatPrice } from "../data/dummyData";
import { EmptyState } from "../components/StateHelpers";

const statusStyles = {
  Delivered: "bg-emerald-50 text-emerald-600",
  "Out for Delivery": "bg-amber-50 text-amber-600",
  Shipped: "bg-brand-50 text-brand-600",
  Cancelled: "bg-rose-50 text-rose-600",
};

const stepIcons = [FaCheckCircle, FaShippingFast, FaTruck, FaBoxOpen];

function OrderTimeline({ order }) {
  if (order.cancelled) {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
        <FaTimesCircle /> Order Cancelled
      </div>
    );
  }

  return (
    <div className="mt-5 flex items-center">
      {order.timeline.map((step, i) => {
        const Icon = stepIcons[i] || FaBoxOpen;
        const done = i < order.currentStep;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors ${
                  done ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                <Icon size={12} />
              </div>
              <span className={`text-[11px] font-medium ${done ? "text-brand-600" : "text-slate-400"}`}>
                {step}
              </span>
            </div>
            {i < order.timeline.length - 1 && (
              <div className={`mx-1 h-0.5 flex-1 ${i < order.currentStep - 1 ? "bg-brand-600" : "bg-slate-100"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function Orders() {
  const [filter, setFilter] = useState("All");
  const tabs = ["All", "Delivered", "Shipped", "Out for Delivery", "Cancelled"];
  const filteredOrders = filter === "All" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 animate-fade-in">
      <h1 className="mb-5 font-display text-2xl font-bold text-ink">My Orders</h1>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === tab ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={<FaBoxOpen />}
          title="No orders found"
          subtitle="You don't have any orders in this category yet."
          actionLabel="Start Shopping"
          actionTo="/products"
        />
      ) : (
        <div className="flex flex-col gap-5">
          {filteredOrders.map((order) => (
            <div key={order.id} className="rounded-2xl bg-white p-6 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink">Order #{order.id}</p>
                  <p className="text-xs text-slate-400">Placed on {new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[order.status]}`}>
                  {order.status}
                </span>
              </div>

              <div className="mt-4 flex gap-3 overflow-x-auto">
                {order.items.map((item) => (
                  <Link key={item.id} to={`/product/${item.id}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </Link>
                ))}
              </div>

              <OrderTimeline order={order} />

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-sm text-slate-500">{order.items.length} item(s)</span>
                <span className="text-base font-bold text-ink">{formatPrice(order.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
