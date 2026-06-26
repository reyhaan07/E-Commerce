import React from "react";
import { Link } from "react-router-dom";
import { FaShoppingBag, FaTag } from "react-icons/fa";
import CartItem from "../components/CartItem";
import { EmptyState } from "../components/StateHelpers";
import { formatPrice } from "../data/dummyData";
import { useShop } from "../context/ShopContext";

export default function Cart() {
  const { cart, cartTotal, cartCount } = useShop();
  const shipping = cartTotal > 499 || cartTotal === 0 ? 0 : 49;
  const discount = Math.round(cartTotal * 0.05);
  const total = cartTotal + shipping - discount;

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={<FaShoppingBag />}
          title="Your cart is empty"
          subtitle="Looks like you haven't added anything yet. Explore our products and find something you love."
          actionLabel="Start Shopping"
          actionTo="/products"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 animate-fade-in">
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">
        Shopping Cart <span className="text-base font-medium text-slate-400">({cartCount} items)</span>
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white p-5 shadow-soft">
            {cart.map((item) => <CartItem key={item.id} item={item} />)}
          </div>
        </div>

        <div className="h-fit rounded-2xl bg-white p-6 shadow-soft lg:sticky lg:top-24">
          <h2 className="mb-4 font-display text-lg font-bold text-ink">Price Summary</h2>

          <div className="mb-4 flex items-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50 px-3 py-2.5">
            <FaTag className="text-brand-500" />
            <input
              type="text"
              placeholder="Apply coupon code"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <button className="text-sm font-semibold text-brand-600 hover:text-brand-700">Apply</button>
          </div>

          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Discount (5%)</span>
              <span>-{formatPrice(discount)}</span>
            </div>
            <div className="my-2 h-px bg-slate-100" />
            <div className="flex justify-between text-base font-bold text-ink">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <Link to="/checkout" className="btn-primary mt-6 block w-full text-center">
            Proceed to Checkout
          </Link>
          <Link to="/products" className="mt-3 block text-center text-sm font-medium text-brand-600 hover:text-brand-700">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
