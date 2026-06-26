import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import Rating from "./Rating";
import { formatPrice } from "../data/dummyData";
import { useShop } from "../context/ShopContext";

export default function ProductCard({ product }) {
  const { toggleWishlist, isWishlisted } = useShop();
  const [imgLoaded, setImgLoaded] = useState(false);
  const wishlisted = isWishlisted(product.id);

  return (
    <div className="card group relative flex flex-col overflow-hidden animate-fade-in">
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(product);
        }}
        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-soft backdrop-blur transition-transform hover:scale-110"
        aria-label="Toggle wishlist"
      >
        {wishlisted ? (
          <FaHeart className="text-rose-500" />
        ) : (
          <FaRegHeart className="text-slate-400" />
        )}
      </button>

      {product.discount > 0 && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-bold text-white shadow-soft">
          {product.discount}% OFF
        </span>
      )}

      <Link to={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-slate-50">
        {!imgLoaded && <div className="skeleton absolute inset-0" />}
        <img
          src={product.image}
          alt={product.name}
          onLoad={() => setImgLoaded(true)}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-brand-500">
          {product.brand}
        </span>
        <Link to={`/product/${product.id}`}>
          <h3 className="line-clamp-2 text-sm font-semibold text-ink hover:text-brand-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <Rating value={product.rating} reviews={product.reviews} />

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-lg font-bold text-ink">{formatPrice(product.price)}</span>
          {product.discount > 0 && (
            <span className="text-sm text-slate-400 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {!product.inStock && (
          <span className="mt-1 text-xs font-semibold text-rose-500">Out of Stock</span>
        )}
      </div>
    </div>
  );
}
