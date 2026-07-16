import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { HiPlus, HiMinus, HiOutlineShoppingBag, HiOutlineHeart, HiStar, HiCube, HiShieldCheck, HiArrowPath } from 'react-icons/hi2';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { apiRequest } from '../api/client';

// Browsing is public, but adding to cart needs an account — login lives on
// a different dev-server origin (frontend/login), so unauthenticated clicks
// hard-redirect there and come back to this exact product afterward.
const SHARED_LOGIN_URL = 'http://localhost:5177';

const ProductDetails = () => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isWishlisted, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviews, setReviews] = useState([]);
  const [reviewMessage, setReviewMessage] = useState('');

  const product = {
    id: 'BC-HP-001',
    name: 'Premium Wireless Over-Ear Headphones',
    price: 14999,
    oldPrice: 19999,
    rating: 4.8,
    reviews: 1250,
    sku: 'BC-HP-001',
    category: 'Electronics',
    description: 'Experience pure sound with our flagship model. Designed for professional musicians and audiophiles alike, these headphones deliver stunning clarity and deep bass performance with active noise cancellation technology.',
    specs: ['Battery: 40 hrs', 'Noise Cancellation', 'Bluetooth 5.2', 'Weight: 250g'],
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200',
      'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?q=80&w=1200',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1200',
    ]
  };
  const wishlisted = isWishlisted(product.id);

  useEffect(() => {
    if (!user) return;
    apiRequest(`/users/${user.id}/reviews`)
      .then((data) => setReviews(data.reviews.filter((review) => review.productId === product.id)))
      .catch(() => {});
  }, [user]);

  function handleAddToCart() {
    if (!user) {
      window.location.href = `${SHARED_LOGIN_URL}?role=user&redirect=${encodeURIComponent(window.location.href)}`;
      return;
    }
    addItem({ id: product.id, name: product.name, price: product.price, image: product.images[0] }, quantity);
  }

  function handleToggleWishlist() {
    if (!user) {
      window.location.href = `${SHARED_LOGIN_URL}?role=user&redirect=${encodeURIComponent(window.location.href)}`;
      return;
    }
    if (wishlisted) removeFromWishlist(product.id);
    else addToWishlist({ id: product.id, name: product.name, price: product.price, image: product.images[0] });
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!user) {
      window.location.href = `${SHARED_LOGIN_URL}?role=user&redirect=${encodeURIComponent(window.location.href)}`;
      return;
    }
    const data = await apiRequest(`/users/${user.id}/reviews`, {
      method: 'POST',
      body: JSON.stringify({
        productId: product.id,
        productName: product.name,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      }),
    });
    setReviews(data.reviews.filter((review) => review.productId === product.id));
    setReviewForm({ rating: 5, comment: '' });
    setReviewMessage('Review submitted');
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Product Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-3xl overflow-hidden bg-gray-100 border border-gray-100">
              <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
            </div>
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
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-6">
              <span className="text-primary font-bold uppercase tracking-widest text-xs px-3 py-1 bg-primary/10 rounded-full">{product.category}</span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-4 mb-2">{product.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => <HiStar key={i} className={`text-xl ${i < 4 ? 'text-yellow-400' : 'text-gray-200'}`} />)}
                    <span className="font-bold text-gray-900 ml-1">{product.rating}</span>
                </div>
                <span className="text-gray-400 text-sm">({product.reviews} Customer Reviews)</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <span className="text-4xl font-extrabold text-gray-900">₹{product.price}</span>
              <span className="text-xl text-gray-400 line-through">₹{product.oldPrice}</span>
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">SAVE 25%</span>
            </div>

            <p className="text-gray-600 mb-8 leading-relaxed text-lg">
              {product.description}
            </p>

            <ul className="grid grid-cols-2 gap-4 mb-8">
                {product.specs.map(spec => (
                    <li key={spec} className="flex items-center gap-2 text-gray-700 font-medium">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div> {spec}
                    </li>
                ))}
            </ul>

            <div className="space-y-6 mt-auto">
              <div className="flex items-center gap-6">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                  <button onClick={() => setQuantity(q => Math.max(1, q-1))} className="p-4 hover:bg-gray-200 transition-colors"><HiMinus /></button>
                  <span className="w-12 text-center font-bold text-gray-900">{quantity}</span>
                  <button onClick={() => setQuantity(q => q+1)} className="p-4 hover:bg-gray-200 transition-colors"><HiPlus /></button>
                </div>
                <button onClick={handleAddToCart} className="flex-1 btn-primary py-4 flex items-center justify-center gap-2 shadow-xl shadow-primary/20">
                  <HiOutlineShoppingBag className="text-xl" /> Add to Cart
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

        <section className="mt-12 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Customer Reviews</h2>
          <form onSubmit={submitReview} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })} className="px-4 py-3 rounded-xl border border-gray-200 outline-none">
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} Stars</option>)}
            </select>
            <input value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Share your experience" className="md:col-span-3 px-4 py-3 rounded-xl border border-gray-200 outline-none" />
            <button className="btn-primary">Submit Review</button>
          </form>
          {reviewMessage && <p className="text-green-600 font-bold text-sm mb-4">{reviewMessage}</p>}
          <div className="space-y-4">
            {reviews.length ? reviews.map((review) => (
              <div key={review._id} className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
                <p className="font-bold text-yellow-500 mb-1">{review.rating}/5 Stars</p>
                <p className="text-gray-600">{review.comment || 'No comment added.'}</p>
              </div>
            )) : <p className="text-gray-400 text-sm">No reviews yet.</p>}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetails;
