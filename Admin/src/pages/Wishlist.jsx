import React from "react";
import { FaHeart } from "react-icons/fa";
import ProductCard from "../components/ProductCard";
import { EmptyState } from "../components/StateHelpers";
import { useShop } from "../context/ShopContext";

export default function Wishlist() {
  const { wishlist } = useShop();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 animate-fade-in">
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">
        My Wishlist <span className="text-base font-medium text-slate-400">({wishlist.length} items)</span>
      </h1>

      {wishlist.length === 0 ? (
        <EmptyState
          icon={<FaHeart />}
          title="Your wishlist is empty"
          subtitle="Save items you love so you can find them easily later."
          actionLabel="Discover Products"
          actionTo="/products"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {wishlist.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
