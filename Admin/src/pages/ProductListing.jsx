import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FaFilter, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ProductCard from "../components/ProductCard";
import { ProductCardSkeleton, EmptyState } from "../components/StateHelpers";
import { categories, products } from "../data/dummyData";
import { FaBoxOpen } from "react-icons/fa";

const PAGE_SIZE = 9;

export default function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get("category") ? [searchParams.get("category")] : []
  );
  const [maxPrice, setMaxPrice] = useState(10000);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("relevance");
  const [page, setPage] = useState(1);

  const searchQuery = searchParams.get("search") || "";

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [selectedCategories, maxPrice, minRating, sortBy, page]);

  const toggleCategory = (name) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
    setPage(1);
  };

  const filtered = useMemo(() => {
    let list = [...products];
    if (searchQuery) {
      list = list.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (selectedCategories.length) {
      list = list.filter((p) => selectedCategories.includes(p.category));
    }
    list = list.filter((p) => p.price <= maxPrice && p.rating >= minRating);

    if (sortBy === "price-low") list.sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") list.sort((a, b) => b.price - a.price);
    if (sortBy === "rating") list.sort((a, b) => b.rating - a.rating);
    if (sortBy === "newest") list.sort((a, b) => b.isNew - a.isNew);

    return list;
  }, [searchQuery, selectedCategories, maxPrice, minRating, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clearFilters = () => {
    setSelectedCategories([]);
    setMaxPrice(10000);
    setMinRating(0);
    setSearchParams({});
    setPage(1);
  };

  const FilterPanel = () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-sm font-bold text-ink">Category</h3>
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.name)}
                onChange={() => toggleCategory(cat.name)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              {cat.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-ink">Max Price: ₹{maxPrice.toLocaleString("en-IN")}</h3>
        <input
          type="range"
          min="500"
          max="10000"
          step="500"
          value={maxPrice}
          onChange={(e) => { setMaxPrice(Number(e.target.value)); setPage(1); }}
          className="w-full accent-brand-600"
        />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-ink">Minimum Rating</h3>
        <div className="flex flex-col gap-2">
          {[4, 3, 2, 0].map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="radio"
                name="rating"
                checked={minRating === r}
                onChange={() => { setMinRating(r); setPage(1); }}
                className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              {r === 0 ? "All Ratings" : `${r}★ & above`}
            </label>
          ))}
        </div>
      </div>

      <button onClick={clearFilters} className="btn-outline text-sm">
        Clear Filters
      </button>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            {searchQuery ? `Results for "${searchQuery}"` : "All Products"}
          </h1>
          <p className="text-sm text-slate-500">{filtered.length} products found</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field w-auto py-2 text-sm"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
            <option value="newest">Newest First</option>
          </select>
          <button
            onClick={() => setShowFilters(true)}
            className="btn-outline flex items-center gap-2 !px-3 !py-2 text-sm lg:hidden"
          >
            <FaFilter size={12} /> Filters
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 rounded-2xl bg-white p-5 shadow-soft lg:block h-fit sticky top-24">
          <h2 className="mb-4 font-display text-lg font-bold text-ink">Filters</h2>
          <FilterPanel />
        </aside>

        {/* Mobile filter drawer */}
        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
            <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] animate-slide-up overflow-y-auto bg-white p-5 shadow-lift">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-ink">Filters</h2>
                <button onClick={() => setShowFilters(false)}><FaTimes /></button>
              </div>
              <FilterPanel />
              <button onClick={() => setShowFilters(false)} className="btn-primary mt-6 w-full">
                Apply Filters
              </button>
            </div>
          </div>
        )}

        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : pageItems.length === 0 ? (
            <EmptyState
              icon={<FaBoxOpen />}
              title="No products found"
              subtitle="Try adjusting your filters or search for something else."
              actionLabel="Clear Filters"
              actionTo="/products"
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
                {pageItems.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-slate-50"
                >
                  <FaChevronLeft size={12} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${
                      page === i + 1 ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-slate-50"
                >
                  <FaChevronRight size={12} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
