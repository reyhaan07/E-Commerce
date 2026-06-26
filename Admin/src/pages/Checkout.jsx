import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaCreditCard, FaMoneyBillWave, FaMobileAlt, FaUniversity, FaCheckCircle } from "react-icons/fa";
import { addresses, formatPrice } from "../data/dummyData";
import { useShop } from "../context/ShopContext";

const paymentMethods = [
  { id: "card", label: "Credit / Debit Card", icon: <FaCreditCard /> },
  { id: "upi", label: "UPI", icon: <FaMobileAlt /> },
  { id: "netbanking", label: "Net Banking", icon: <FaUniversity /> },
  { id: "cod", label: "Cash on Delivery", icon: <FaMoneyBillWave /> },
];

export default function Checkout() {
  const { cart, cartTotal } = useShop();
  const [selectedAddress, setSelectedAddress] = useState(addresses[0].id);
  const [payment, setPayment] = useState("card");
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();
  const shipping = cartTotal > 499 ? 0 : 49;
  const total = cartTotal + shipping;

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    setPlacing(true);
    setTimeout(() => {
      navigate("/orders");
    }, 1200);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 animate-fade-in">
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Shipping Address */}
          <div className="rounded-2xl bg-white p-6 shadow-soft">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink">
              <FaMapMarkerAlt className="text-brand-500" /> Shipping Address
            </h2>

            <div className="flex flex-col gap-3">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                    selectedAddress === addr.id ? "border-brand-500 bg-brand-50" : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddress === addr.id}
                    onChange={() => setSelectedAddress(addr.id)}
                    className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{addr.name} • {addr.phone}</p>
                    <p className="text-sm text-slate-500">
                      {addr.line1}, {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <button type="button" className="mt-4 text-sm font-semibold text-brand-600 hover:text-brand-700">
              + Add New Address
            </button>
          </div>

          {/* Payment method */}
          <div className="rounded-2xl bg-white p-6 shadow-soft">
            <h2 className="mb-4 font-display text-lg font-bold text-ink">Payment Method</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
                    payment === method.id ? "border-brand-500 bg-brand-50" : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === method.id}
                    onChange={() => setPayment(method.id)}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-brand-600">{method.icon}</span>
                  <span className="text-sm font-medium text-ink">{method.label}</span>
                </label>
              ))}
            </div>

            {payment === "card" && (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input placeholder="Card Number" className="input-field sm:col-span-2" />
                <input placeholder="MM/YY" className="input-field" />
                <input placeholder="CVV" className="input-field" />
              </div>
            )}
          </div>
        </div>

        {/* Order summary */}
        <div className="h-fit rounded-2xl bg-white p-6 shadow-soft lg:sticky lg:top-24">
          <h2 className="mb-4 font-display text-lg font-bold text-ink">Order Summary</h2>

          <div className="flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="line-clamp-2 text-xs font-medium text-ink">{item.name}</p>
                  <p className="text-xs text-slate-400">Qty: {item.qty}</p>
                </div>
                <span className="text-sm font-semibold text-ink">{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>

          <div className="my-4 h-px bg-slate-100" />

          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            <div className="my-2 h-px bg-slate-100" />
            <div className="flex justify-between text-base font-bold text-ink">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <button type="submit" disabled={placing} className="btn-primary mt-6 flex w-full items-center justify-center gap-2">
            {placing ? (
              <>Placing Order...</>
            ) : (
              <><FaCheckCircle /> Place Order</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
