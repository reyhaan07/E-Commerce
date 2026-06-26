import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaTruck, FaShieldAlt, FaUndo, FaHeadset } from "react-icons/fa";
import Banner from "../components/Banner";
import CategoryCard from "../components/CategoryCard";
import ProductCard from "../components/ProductCard";
import Rating from "../components/Rating";
import { ProductCardSkeleton } from "../components/StateHelpers";
import { categories, products, formatPrice } from "../data/dummyData";

const perks = [
  { icon: <FaTruck />, title: "Free Delivery", subtitle: "On orders above ₹499" },
  { icon: <FaUndo />, title: "Easy Returns", subtitle: "7-day return policy" },
  { icon: <FaShieldAlt />, title: "Secure Payments", subtitle: "100% protected" },
  { icon: <FaHeadset />, title: "24/7 Support", subtitle: "Dedicated support" },
];

function ProductListSection({ title, items, loading }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="section-title">{title}</h2>
        <Link to="/products" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
          View All <FaArrowRight size={12} />
        </Link>
      </div>
      <div className="space-y-3 bg-white rounded-lg p-4 shadow-soft">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-20 rounded" />)
          : items.slice(0, 10).map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors"
              >
                <img src={p.image} alt={p.name} className="h-16 w-16 object-cover rounded-md flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-ink truncate">{p.name}</h3>
                  <p className="text-xs text-slate-600">{p.brand}</p>
                  <Rating value={p.rating} reviews={p.reviews} size="text-xs" />
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-ink">{formatPrice(p.price)}</p>
                  {p.discount > 0 && (
                    <p className="text-xs text-slate-400 line-through">{formatPrice(p.originalPrice)}</p>
                  )}
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const featured = products.filter((p) => p.isFeatured);
  const trending = products.filter((p) => p.isTrending);
  const newArrivals = products.filter((p) => p.isNew);

  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 py-5">
        <Banner />
      </div>

      {/* Perks strip */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white p-5 shadow-soft sm:grid-cols-4">
          {perks.map((perk) => (
            <div key={perk.title} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-lg text-brand-600">
                {perk.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{perk.title}</p>
                <p className="text-xs text-slate-400">{perk.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="section-title mb-5">Shop by Category</h2>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8 sm:gap-4">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      <ProductListSection title="Featured Products" items={featured} loading={loading} />

      {/* Promo banner */}
      <section className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-brand-700 to-sky-accent p-8 text-center text-white sm:flex-row sm:text-left">
          <div>
            <h3 className="font-display text-xl font-bold sm:text-2xl">Get 20% off your first order</h3>
            <p className="mt-1 text-sm text-brand-100">Use code WELCOME20 at checkout</p>
          </div>
          <Link to="/products" className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-lift transition-transform hover:scale-105 shrink-0">
            Shop Now
          </Link>
        </div>
      </section>

      <ProductListSection title="Trending Now" items={trending} loading={loading} />
      <ProductListSection title="New Arrivals" items={newArrivals} loading={loading} />
    </div>
  );
}
