import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HiOutlineUser, HiOutlineShoppingBag, HiOutlineHeart, HiOutlineSearch, HiOutlineMenuAlt4 } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import CategoryMenu from './CategoryMenu';

const Navbar = () => {
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  function handleSearch(e) {
    e.preventDefault();
    navigate(query.trim() ? `/products?q=${encodeURIComponent(query.trim())}` : '/products');
  }

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">S</div>
            <span className="hidden sm:inline">ShopSphere</span>
          </Link>
          <div className="hidden lg:block">
            <CategoryMenu />
          </div>
        </div>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products, brands and more..."
            className="w-full px-4 py-2 pr-11 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md text-gray-400 hover:text-primary transition-colors"
          >
            <HiOutlineSearch className="text-xl" />
          </button>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/profile" className="flex flex-col items-center group">
            <HiOutlineUser className="text-2xl group-hover:text-primary transition-colors" />
            <span className="text-[10px] uppercase font-bold text-gray-500 group-hover:text-primary transition-colors hidden sm:block">Profile</span>
          </Link>
          <Link to="/wishlist" className="flex flex-col items-center group relative">
            <HiOutlineHeart className="text-2xl group-hover:text-primary transition-colors" />
            {wishlistItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold italic">{wishlistItems.length}</span>
            )}
            <span className="text-[10px] uppercase font-bold text-gray-500 group-hover:text-primary transition-colors hidden sm:block">Wishlist</span>
          </Link>
          <Link to="/cart" className="flex flex-col items-center group relative">
            <HiOutlineShoppingBag className="text-2xl group-hover:text-primary transition-colors" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold italic">{itemCount}</span>
            )}
            <span className="text-[10px] uppercase font-bold text-gray-500 group-hover:text-primary transition-colors hidden sm:block">Cart</span>
          </Link>
          <button className="md:hidden">
            <HiOutlineMenuAlt4 className="text-2xl" />
          </button>
        </div>
      </div>

      {/* Search Bar - Mobile (the desktop bar is hidden below md) */}
      <form onSubmit={handleSearch} className="md:hidden px-4 pb-3 relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for products, brands and more..."
          className="w-full px-4 py-2 pr-11 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-5 top-1/2 -translate-y-[calc(50%+6px)] p-2 rounded-md text-gray-400 hover:text-primary transition-colors"
        >
          <HiOutlineSearch className="text-xl" />
        </button>
      </form>
    </nav>
  );
};

export default Navbar;
