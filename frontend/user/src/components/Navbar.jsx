import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineUser, HiOutlineShoppingBag, HiOutlineHeart, HiOutlineSearch, HiOutlineMenuAlt4 } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const Navbar = () => {
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">S</div>
          <span className="hidden sm:inline">ShopSphere</span>
        </Link>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8 relative">
          <input
            type="text"
            placeholder="Search for products, brands and more..."
            className="w-full px-4 py-2 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none"
          />
          <HiOutlineSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl cursor-pointer hover:text-primary transition-colors" />
        </div>

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
    </nav>
  );
};

export default Navbar;
