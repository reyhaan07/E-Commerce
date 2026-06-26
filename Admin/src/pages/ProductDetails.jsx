import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FaHeart, FaRegHeart, FaTruck, FaUndo, FaShieldAlt } from "react-icons/fa";
import Rating from "../components/Rating";
import ProductCard from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/StateHelpers";
import { products, formatPrice } from "../data/dummyData";
import { useShop } from "../context/ShopContext";

export default function ProductDetails() {
  const { id } = useParams();
  const product = products.find((p) => p.id === Number(id)) || products[0];
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toggleWishlist, isWishlisted } = useShop();
  const wishlisted = isWishlisted(product.id);

  useEffect(() => {
    setLoading(true);
    setActiveImg(0);
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, [id]);

  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 6);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="skeleton aspect-square rounded-2xl" />
          <div className="flex flex-col gap-4">
            <div className="skeleton h-4 w-1/4" />
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-5 w-1/3" />
            <div className="skeleton h-10 w-1/2" />
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl bg-slate-50 shadow-soft">
            <img
              src={product.images[activeImg]}
              alt={product.name}
              className="h-full w-full object-cover transition-all duration-300"
            />
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                  activeImg === i ? "border-brand-600" : "border-transparent opacity-70"
                }`}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-500">{product.brand}</span>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">{product.name}</h1>

          <div className="mt-3">
            <Rating value={product.rating} reviews={product.reviews} size="text-base" />
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-ink">{formatPrice(product.price)}</span>
            {product.discount > 0 && (
              <>
                <span className="text-lg text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-600">
                  {product.discount}% off
                </span>
              </>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-slate-600">{product.description}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => toggleWishlist(product)}
              className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-slate-200 text-lg transition-colors hover:bg-slate-50 hover:border-rose-500"
              aria-label="Toggle wishlist"
            >
              {wishlisted ? <FaHeart className="text-rose-500" /> : <FaRegHeart className="text-slate-400" />}
              <span className="text-sm font-medium">
                {wishlisted ? "Added to Wishlist" : "Add to Wishlist"}
              </span>
            </button>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-3 rounded-2xl bg-brand-50 p-4 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <FaTruck className="text-brand-600" />
              <span className="text-xs font-medium text-slate-600">Free Delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <FaUndo className="text-brand-600" />
              <span className="text-xs font-medium text-slate-600">7-Day Returns</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <FaShieldAlt className="text-brand-600" />
              <span className="text-xs font-medium text-slate-600">Secure Payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="section-title mb-5">Related Products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
