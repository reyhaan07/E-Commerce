import React from 'react';
import { Link } from 'react-router-dom';
import { HiStar } from 'react-icons/hi';
import { HiOutlineHeart, HiOutlineShoppingBag } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

// Browsing is public, but adding to cart needs an account — login lives on
// a different dev-server origin (frontend/login), so unauthenticated clicks
// hard-redirect there and come back to this exact product afterward.
const SHARED_LOGIN_URL = 'http://localhost:5177';

const ProductCard = ({ product }) => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isWishlisted, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  function handleAddToCart() {
    if (!user) {
      window.location.href = `${SHARED_LOGIN_URL}?role=user&redirect=${encodeURIComponent(window.location.href)}`;
      return;
    }
    addItem(product, 1);
  }

  function handleToggleWishlist() {
    if (!user) {
      window.location.href = `${SHARED_LOGIN_URL}?role=user&redirect=${encodeURIComponent(window.location.href)}`;
      return;
    }
    if (wishlisted) removeFromWishlist(product.id);
    else addToWishlist(product);
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className="card-hover group"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
        <Link to={`/product/${product.id}`} className="block h-full">
          <img
            src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </Link>

        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {product.isNew && <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-sm">New</span>}
          {product.discount && <span className="rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-sm">-{product.discount}%</span>}
        </div>

        <button
          onClick={handleToggleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/80 text-slate-700 shadow-sm backdrop-blur-md transition-all duration-200 hover:scale-105 hover:text-red-500 ${wishlisted ? 'text-red-500 opacity-100' : 'opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0'}`}
        >
          <HiOutlineHeart className={`text-xl ${wishlisted ? 'fill-current' : ''}`} />
        </button>

        <div className="absolute inset-x-4 bottom-4 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button onClick={handleAddToCart} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 font-semibold text-white shadow-lg shadow-primary/20 transition-all duration-200 hover:bg-primary-dark">
            <HiOutlineShoppingBag className="text-lg" /> Add to Cart
          </button>
        </div>
      </div>

      <div className="p-4">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{product.category || 'Lifestyle'}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="mb-2 line-clamp-1 text-base font-semibold text-slate-800 transition-colors group-hover:text-primary">{product.name}</h3>
        </Link>

        <div className="mb-3 flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <HiStar key={i} className={`text-sm ${i < (product.rating || 4) ? 'text-amber-400' : 'text-slate-200'}`} />
          ))}
          <span className="ml-1 text-[10px] text-slate-400">({product.reviews || 0})</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-slate-900">₹{product.price}</span>
          {product.oldPrice && <span className="text-sm text-slate-400 line-through">₹{product.oldPrice}</span>}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
