import React from "react";
import { Link } from "react-router-dom";
import { FaEdit, FaMapMarkerAlt, FaPlus, FaBoxOpen, FaSignOutAlt } from "react-icons/fa";
import { currentUser, addresses, orders, formatPrice } from "../data/dummyData";

export default function Profile() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 animate-fade-in">
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">My Profile</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* User info card */}
        <div className="rounded-2xl bg-white p-6 text-center shadow-soft lg:col-span-1">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-brand-50"
          />
          <h2 className="mt-4 font-display text-lg font-bold text-ink">{currentUser.name}</h2>
          <p className="text-sm text-slate-500">{currentUser.email}</p>
          <p className="text-sm text-slate-500">{currentUser.phone}</p>
          <p className="mt-1 text-xs text-slate-400">Member since {currentUser.joined}</p>

          <button className="btn-outline mt-5 flex w-full items-center justify-center gap-2 text-sm">
            <FaEdit size={13} /> Edit Profile
          </button>
          <button className="mt-3 flex w-full items-center justify-center gap-2 text-sm font-medium text-rose-500 hover:text-rose-600">
            <FaSignOutAlt size={13} /> Logout
          </button>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Addresses */}
          <div className="rounded-2xl bg-white p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                <FaMapMarkerAlt className="text-brand-500" /> Saved Addresses
              </h2>
              <button className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
                <FaPlus size={11} /> Add New
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {addresses.map((addr) => (
                <div key={addr.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-ink">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-slate-600">{addr.name}</p>
                  <p className="text-sm text-slate-500">{addr.line1}, {addr.city}, {addr.state} - {addr.pincode}</p>
                  <p className="text-sm text-slate-500">{addr.phone}</p>
                  <div className="mt-3 flex gap-3">
                    <button className="text-xs font-semibold text-brand-600 hover:text-brand-700">Edit</button>
                    <button className="text-xs font-semibold text-rose-500 hover:text-rose-600">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent orders */}
          <div className="rounded-2xl bg-white p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                <FaBoxOpen className="text-brand-500" /> Recent Orders
              </h2>
              <Link to="/orders" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                View All
              </Link>
            </div>

            <div className="flex flex-col divide-y divide-slate-100">
              {orders.slice(0, 3).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <img src={order.items[0].image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    <div>
                      <p className="text-sm font-semibold text-ink">#{order.id}</p>
                      <p className="text-xs text-slate-400">{order.status}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-ink">{formatPrice(order.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
