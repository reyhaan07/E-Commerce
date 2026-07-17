import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { HiOutlineFilter, HiOutlineChevronDown } from 'react-icons/hi';
import { listProducts, getCategories, toCardProduct } from '../api/products';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

const MAX_PRICE = 30000;

const ProductListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 12 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minRating = searchParams.get('minRating') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page'), 10) || 1;

  // updates one query param and resets to page 1, keeping the rest intact
  function setParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value === null) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  }

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    listProducts({ q, category, maxPrice, minRating, sort, page, limit: 12 })
      .then(({ products, pagination }) => {
        setProducts(products.map(toCardProduct));
        setPagination(pagination);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [q, category, maxPrice, minRating, sort, page]);

  const heading = q ? `Results for “${q}”` : category ? `${category} Collection` : 'All Products';
  const from = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const to = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <HiOutlineFilter /> Filters
                </h3>
                <div className="space-y-3 font-medium">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Category</p>
                  {categories.map((cat) => (
                    <label key={cat.name} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={category === cat.name}
                        onChange={() => setParam('category', category === cat.name ? '' : cat.name)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 transition-colors"
                      />
                      <span className="text-gray-600 group-hover:text-primary transition-colors">
                        {cat.name} <span className="text-xs text-gray-400">({cat.count})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t font-medium">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Max Price</p>
                <input
                  type="range"
                  min="500"
                  max={MAX_PRICE}
                  step="500"
                  value={maxPrice || MAX_PRICE}
                  onChange={(e) => setParam('maxPrice', Number(e.target.value) >= MAX_PRICE ? '' : e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between mt-2 text-sm font-bold text-gray-900">
                  <span>₹0</span>
                  <span>{maxPrice ? `₹${maxPrice}` : 'Any'}</span>
                </div>
              </div>

              <div className="pt-6 border-t font-medium">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Ratings</p>
                {[4, 3, 2].map((star) => (
                  <label key={star} className="flex items-center gap-2 cursor-pointer group mb-2">
                    <input
                      type="checkbox"
                      checked={minRating === String(star)}
                      onChange={() => setParam('minRating', minRating === String(star) ? '' : String(star))}
                      className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 transition-colors"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-primary transition-colors flex items-center">{star}+ ⭐</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <section className="flex-1">
            {/* Header / Sort */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{heading}</h2>
                <p className="text-sm text-gray-500">
                  {loading ? 'Loading…' : `Showing ${from}-${to} of ${pagination.total} results`}
                </p>
              </div>
              <div className="flex gap-4">
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setParam('sort', e.target.value)}
                    className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg font-medium hover:border-primary transition-colors outline-none bg-white cursor-pointer"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>Sort By: {opt.label}</option>
                    ))}
                  </select>
                  <HiOutlineChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 font-medium mb-6">{error}</p>}

            {/* Product Grid */}
            {!loading && products.length === 0 && !error ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-200">
                <p className="text-xl font-bold text-gray-900 mb-2">No products found</p>
                <p className="text-gray-500">Try a different search or clear some filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-16 flex justify-center gap-2">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setParam('page', String(p))}
                    className={`w-10 h-10 rounded-lg font-bold transition-all ${p === pagination.page ? 'bg-primary text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductListing;
