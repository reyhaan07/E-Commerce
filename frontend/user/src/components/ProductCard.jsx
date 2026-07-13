import React from 'react';
import { HiStar } from 'react-icons/hi';
import { HiOutlineHeart, HiOutlineShoppingBag } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

// Browsing is public, but adding to cart needs an account — login lives on
// a different dev-server origin (frontend/admin), so unauthenticated clicks
// hard-redirect there and come back to this exact product afterward.
const SHARED_LOGIN_URL = 'http://localhost:5173/login';

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
      className="card-hover group border border-transparent hover:border-primary/10"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        <img 
          src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isNew && <span className="bg-primary text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm">New</span>}
            {product.discount && <span className="bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm">-{product.discount}%</span>}
        </div>
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur shadow-sm flex items-center justify-center transition-all duration-300 hover:text-red-500 ${wishlisted ? 'text-red-500 opacity-100' : 'opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0'}`}
        >
          <HiOutlineHeart className="text-xl" />
        </button>
        <div className="absolute bottom-4 left-4 right-4 flex gap-2 translate-y-20 group-hover:translate-y-0 transition-transform duration-300">
          <button onClick={handleAddToCart} className="flex-1 bg-primary text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-primary-dark shadow-lg">
            <HiOutlineShoppingBag /> Add to Cart
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">{product.category || 'Lifestyle'}</p>
        <h3 className="font-semibold text-gray-800 line-clamp-1 mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
        <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
                <HiStar key={i} className={`text-sm ${i < (product.rating || 4) ? 'text-yellow-400' : 'text-gray-200'}`} />
            ))}
            <span className="text-[10px] text-gray-400 ml-1">({product.reviews || 0})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
          {product.oldPrice && <span className="text-sm text-gray-400 line-through">₹{product.oldPrice}</span>}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
