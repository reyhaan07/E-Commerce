import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { HiOutlineFilter, HiOutlineChevronDown, HiSearch } from 'react-icons/hi';

const ProductListing = () => {
  const products = [
    { id: 1, name: 'Premium Wireless Headphones', price: 14999, oldPrice: 19999, rating: 5, reviews: 128, isNew: true, discount: 25, category: 'Electronics', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800' },
    { id: 2, name: 'Minimalist Analog Watch', price: 4999, rating: 4, reviews: 85, category: 'Fashion', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800' },
    { id: 3, name: 'Portable Bluetooth Speaker', price: 2499, oldPrice: 3499, discount: 28, rating: 4, reviews: 42, category: 'Electronics', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800' },
    { id: 4, name: 'Smart Home Controller', price: 8999, rating: 5, reviews: 210, isNew: true, category: 'Gadgets', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=800' },
    { id: 5, name: 'Ergonomic Desk Chair', price: 12999, rating: 4, reviews: 54, category: 'Home Decor', image: 'https://images.unsplash.com/photo-1505797149-43c0c19629f6?q=80&w=800' },
    { id: 6, name: '4K Ultra HD Monitor', price: 24999, oldPrice: 29999, rating: 5, reviews: 32, category: 'Electronics', image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800' },
    { id: 7, name: 'Designer Leather Bag', price: 7999, rating: 4, reviews: 18, category: 'Fashion', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800' },
    { id: 8, name: 'Smart Fitness Tracker', price: 3499, rating: 4, reviews: 156, isNew: true, category: 'Electronics', image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?q=80&w=800' },
  ];

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
                  {['Electronics', 'Fashion', 'Home & Decor', 'Gadgets', 'Sports'].map(cat => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 transition-colors" />
                      <span className="text-gray-600 group-hover:text-primary transition-colors">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t font-medium">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Price Range</p>
                <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                <div className="flex justify-between mt-2 text-sm font-bold text-gray-900">
                    <span>₹0</span>
                    <span>₹1000</span>
                </div>
              </div>

              <div className="pt-6 border-t font-medium">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Ratings</p>
                {[4, 3, 2].map(star => (
                    <label key={star} className="flex items-center gap-2 cursor-pointer group mb-2">
                        <input type="checkbox" className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 transition-colors" />
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
                    <h2 className="text-xl font-bold text-gray-900">Electronics Collection</h2>
                    <p className="text-sm text-gray-500">Showing 1-12 of 48 results</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative group">
                        <button className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2 font-medium hover:border-primary transition-colors">
                            Sort By: Newest <HiOutlineChevronDown />
                        </button>
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-16 flex justify-center gap-2">
                {[1, 2, 3, '...', 10].map((page, idx) => (
                    <button 
                        key={idx} 
                        className={`w-10 h-10 rounded-lg font-bold transition-all ${page === 1 ? 'bg-primary text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}
                    >
                        {page}
                    </button>
                ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductListing;
