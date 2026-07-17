import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { HiPlus, HiMinus, HiOutlineShoppingBag, HiOutlineHeart, HiStar, HiCube, HiShieldCheck, HiArrowPath, HiBuildingStorefront } from 'react-icons/hi2';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getProduct, toCardProduct } from '../api/products';

// Browsing is public, but adding to cart needs an account — login lives on
// a different dev-server origin (frontend/login), so unauthenticated clicks
// hard-redirect there and come back to this exact product afterward.
const SHARED_LOGIN_URL = 'http://localhost:5177';

const ProductDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isWishlisted, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const [data, setData] = useState(null); // { product, seller, related, reviews }
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    setError('');
    setQuantity(1);
    getProduct(id)
      .then((payload) => {
        setData(payload);
        setMainImage(payload.product.images?.[0] || '');
        window.scrollTo(0, 0);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to="/products" className="btn-primary inline-block px-8 py-3">Browse products</Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-24 text-center text-gray-400 font-medium">Loading product…</main>
        <Footer />
      </div>
    );
  }

  const { product, seller, related, reviews } = data;
  const wishlisted = isWishlisted(product.id);
  const inStock = product.stock > 0;
  const lowStock = inStock && product.stock <= 5;
  const cartShape = { id: product.id, name: product.name, price: product.price, image: product.images?.[0] };

  function requireLogin() {
    window.location.href = `${SHARED_LOGIN_URL}?role=user&redirect=${encodeURIComponent(window.location.href)}`;
  }

  function handleAddToCart() {
    if (!user) return requireLogin();
    addItem(cartShape, quantity);
  }

  function handleToggleWishlist() {
    if (!user) return requireLogin();
    if (wishlisted) removeFromWishlist(product.id);
    else addToWishlist(cartShape);
  }

  const totalReviews = reviews.count || 0;

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Product Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-3xl overflow-hidden bg-gray-100 border border-gray-100">
              {mainImage && <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />}
            </div>
            {product.images?.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMainImage(img)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${mainImage === img ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-6">
              <span className="text-primary font-bold uppercase tracking-widest text-xs px-3 py-1 bg-primary/10 rounded-full">{product.category}</span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-4 mb-2">{product.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <HiStar key={i} className={`text-xl ${i < Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-200'}`} />)}
                  <span className="font-bold text-gray-900 ml-1">{product.rating || '—'}</span>
                </div>
                <span className="text-gray-400 text-sm">({totalReviews} Customer Review{totalReviews === 1 ? '' : 's'})</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl font-extrabold text-gray-900">₹{product.price}</span>
              {product.oldPrice && <span className="text-xl text-gray-400 line-through">₹{product.oldPrice}</span>}
              {product.discount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">SAVE {product.discount}%</span>}
            </div>

            <p className={`font-bold text-sm mb-6 ${inStock ? (lowStock ? 'text-amber-600' : 'text-green-600') : 'text-red-500'}`}>
              {inStock ? (lowStock ? `Only ${product.stock} left in stock — order soon` : 'In Stock') : 'Out of Stock'}
            </p>

            <p className="text-gray-600 mb-8 leading-relaxed text-lg">{product.description}</p>

            {product.specs?.length > 0 && (
              <ul className="grid grid-cols-2 gap-4 mb-8">
                {product.specs.map((spec) => (
                  <li key={spec.label} className="flex items-center gap-2 text-gray-700 font-medium">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div> {spec.label}: {spec.value}
                  </li>
                ))}
              </ul>
            )}

            {seller && (
              <div className="flex items-center gap-4 rounded-2xl bg-gray-50 border border-gray-100 p-4 mb-8">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <HiBuildingStorefront className="text-xl" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{seller.name}</p>
                  <p className="text-sm text-gray-500">
                    {seller.city} · {seller.rating ? `${seller.rating}★ seller rating (${seller.ratingCount})` : 'New seller'}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-6 mt-auto">
              <div className="flex items-center gap-6">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-4 hover:bg-gray-200 transition-colors"><HiMinus /></button>
                  <span className="w-12 text-center font-bold text-gray-900">{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(product.stock || 1, q + 1))} className="p-4 hover:bg-gray-200 transition-colors"><HiPlus /></button>
                </div>
                <button onClick={handleAddToCart} disabled={!inStock} className="flex-1 btn-primary py-4 flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50">
                  <HiOutlineShoppingBag className="text-xl" /> {inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
                <button onClick={handleToggleWishlist} className={`w-14 h-14 border rounded-xl flex items-center justify-center hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-all ${wishlisted ? 'bg-red-50 border-red-500 text-red-500' : 'border-gray-200'}`}>
                  <HiOutlineHeart className="text-2xl" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-gray-100">
                <div className="text-center">
                  <HiCube className="mx-auto text-2xl text-primary mb-2" />
                  <p className="text-[10px] font-bold uppercase text-gray-400">Free Delivery</p>
                </div>
                <div className="text-center">
                  <HiShieldCheck className="mx-auto text-2xl text-primary mb-2" />
                  <p className="text-[10px] font-bold uppercase text-gray-400">1 Year Warranty</p>
                </div>
                <div className="text-center">
                  <HiArrowPath className="mx-auto text-2xl text-primary mb-2" />
                  <p className="text-[10px] font-bold uppercase text-gray-400">7 Days Return</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-12 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Customer Reviews</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center md:border-r border-gray-100">
              <p className="text-5xl font-black text-gray-900">{reviews.average || '—'}</p>
              <div className="flex items-center justify-center gap-1 my-2">
                {[...Array(5)].map((_, i) => <HiStar key={i} className={`${i < Math.round(reviews.average) ? 'text-yellow-400' : 'text-gray-200'}`} />)}
              </div>
              <p className="text-sm text-gray-400">{totalReviews} review{totalReviews === 1 ? '' : 's'}</p>
            </div>
            <div className="md:col-span-2 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.distribution?.[star] || 0;
                const pct = totalReviews ? Math.round((count / totalReviews) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-sm">
                    <span className="w-10 font-bold text-gray-600">{star}★</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="w-8 text-gray-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {reviews.items?.length ? reviews.items.map((review) => (
              <div key={review.id} className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-gray-900">{review.userName || 'Customer'}</p>
                  <p className="font-bold text-yellow-500">{review.rating}/5 ★</p>
                </div>
                <p className="text-gray-600">{review.comment || 'No comment added.'}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
            )) : <p className="text-gray-400 text-sm">No reviews yet.</p>}
          </div>

          <p className="text-sm text-gray-400 mt-6">
            Bought this product? You can write a review from <Link to="/orders" className="text-primary font-bold hover:underline">My Orders</Link> once it's delivered.
          </p>
        </section>

        {/* Related products */}
        {related?.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">More in {product.category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {related.map((p) => <ProductCard key={p.id} product={toCardProduct(p)} />)}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetails;
