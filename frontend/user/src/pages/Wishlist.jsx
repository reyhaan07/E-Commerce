import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { HiOutlineHeart } from 'react-icons/hi2';

const Wishlist = () => {
    const products = [
        { id: 1, name: 'Premium Wireless Headphones', price: 14999, rating: 5, reviews: 128, category: 'Electronics', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800' },
        { id: 2, name: 'Minimalist Analog Watch', price: 4999, rating: 4, reviews: 85, category: 'Fashion', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800' },
    ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                <HiOutlineHeart className="text-primary" /> My Wishlist
            </h1>
            <p className="text-gray-500 font-bold">{products.length} Items Saved</p>
        </div>

        {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        ) : (
            <div className="text-center py-32 bg-white rounded-3xl shadow-sm border border-dashed border-gray-200 mt-8">
                <HiOutlineHeart className="mx-auto text-6xl text-gray-200 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">Your wishlist is empty</h2>
                <p className="text-gray-500 mb-8 mt-2">Save items you love to find them later easily</p>
                <button className="btn-primary">Browse Products</button>
            </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Wishlist;
