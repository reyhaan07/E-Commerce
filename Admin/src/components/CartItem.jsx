import React from "react";
import { Link } from "react-router-dom";
import { FaTrash, FaMinus, FaPlus } from "react-icons/fa";
import { formatPrice } from "../data/dummyData";
import { useShop } from "../context/ShopContext";

export default function CartItem({ item }) {
  const { updateQty, removeFromCart } = useShop();

  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 py-5 sm:flex-row sm:items-center animate-fade-in">
      <Link to={`/product/${item.id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-50">
        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
      </Link>

      <div className="flex-1">
        <Link to={`/product/${item.id}`} className="text-sm font-semibold text-ink hover:text-brand-600">
          {item.name}
        </Link>
        <p className="mt-1 text-xs text-slate-400">{item.brand}</p>
        <p className="mt-2 text-base font-bold text-ink">{formatPrice(item.price)}</p>
      </div>

      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-2 py-1">
          <button
            onClick={() => updateQty(item.id, item.qty - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Decrease quantity"
          >
            <FaMinus size={10} />
          </button>
          <span className="w-5 text-center text-sm font-semibold">{item.qty}</span>
          <button
            onClick={() => updateQty(item.id, item.qty + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Increase quantity"
          >
            <FaPlus size={10} />
          </button>
        </div>

        <button
          onClick={() => removeFromCart(item.id)}
          className="flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-600"
        >
          <FaTrash size={11} /> Remove
        </button>
      </div>

      <p className="hidden w-24 text-right text-base font-bold text-ink sm:block">
        {formatPrice(item.price * item.qty)}
      </p>
    </div>
  );
}
