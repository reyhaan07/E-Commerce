import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { HiOutlineCube, HiOutlineCheckCircle, HiOutlineClock, HiOutlineTruck, HiOutlineStar } from 'react-icons/hi2';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../api/client';

// Orders have separate seller/delivery statuses server-side - this just
// picks whichever one is more relevant to show the customer as one badge.
function statusBadge(order) {
  const status = order.deliveryStatus || order.sellerStatus;
  if (status === 'Delivered') return { label: 'Delivered', color: 'text-green-500', bg: 'bg-green-50', icon: <HiOutlineCheckCircle /> };
  if (['Out For Delivery', 'In Transit', 'Picked Up', 'Shipped'].includes(status)) {
    return { label: status, color: 'text-blue-500', bg: 'bg-blue-50', icon: <HiOutlineTruck /> };
  }
  if (status === 'Cancelled' || status === 'Returned') {
    return { label: status, color: 'text-red-500', bg: 'bg-red-50', icon: <HiOutlineCube /> };
  }
  return { label: status || 'Processing', color: 'text-amber-500', bg: 'bg-amber-50', icon: <HiOutlineClock /> };
}

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    apiRequest(`/orders?userId=${encodeURIComponent(user.id)}`)
      .then((data) => setOrders(data.orders))
      .catch(() => {});
  }, [user]);

  function updateReviewDraft(orderId, changes) {
    setReviewDrafts((current) => ({
      ...current,
      [orderId]: { rating: 5, productId: '', productName: '', comment: '', ...current[orderId], ...changes },
    }));
  }

  async function submitOrderReview(e, order) {
    e.preventDefault();
    const firstItem = order.items[0];
    const draft = reviewDrafts[order.id] || {};
    const productName = draft.productName || firstItem?.name || order.id;
    const productId = draft.productId || productName;

    await apiRequest(`/users/${user.id}/reviews`, {
      method: 'POST',
      body: JSON.stringify({
        productId,
        productName,
        rating: Number(draft.rating || 5),
        comment: draft.comment || '',
      }),
    });
    setReviewDrafts((current) => ({ ...current, [order.id]: { rating: 5, productId: '', productName: '', comment: '' } }));
    setReviewMessage(`Review submitted for ${productName}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">My Orders</h1>
            
            <div className="space-y-6 max-w-4xl mx-auto">
                {orders.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <HiOutlineCube className="mx-auto text-6xl text-gray-200 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
                        <p className="text-gray-500">Orders you place will show up here</p>
                    </div>
                )}
                {orders.map(order => {
                    const badge = statusBadge(order);
                    return (
                    <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center text-center md:text-left">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gray-50 flex-shrink-0 flex items-center justify-center">
                                <HiOutlineCube className="text-4xl text-gray-300" />
                            </div>

                            <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        <h3 className="text-xl font-extrabold text-gray-900">{order.id}</h3>
                                    </div>
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${badge.bg} ${badge.color}`}>
                                        {badge.icon} {badge.label}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-50">
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total</p>
                                        <p className="font-extrabold text-gray-900">₹{order.amount}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Items</p>
                                        <p className="font-extrabold text-gray-900">{order.items.length} Items</p>
                                    </div>
                                    <div className="md:col-span-2 flex justify-end gap-6">
                                        <Link to={`/track-order/${order.id}`} className="text-primary font-bold hover:underline">Track Order</Link>
                                    </div>
                                </div>
                                {(order.deliveryStatus === 'Delivered' || order.sellerStatus === 'Delivered') && (
                                    <form onSubmit={(e) => submitOrderReview(e, order)} className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-3 rounded-2xl bg-gray-50 border border-gray-100 p-4">
                                        <select
                                            className="px-4 py-3 rounded-xl border border-gray-200 outline-none"
                                            value={reviewDrafts[order.id]?.productName || order.items[0]?.name || ''}
                                            onChange={(e) => updateReviewDraft(order.id, { productName: e.target.value, productId: e.target.value })}
                                        >
                                            {order.items.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
                                        </select>
                                        <select
                                            className="px-4 py-3 rounded-xl border border-gray-200 outline-none"
                                            value={reviewDrafts[order.id]?.rating || 5}
                                            onChange={(e) => updateReviewDraft(order.id, { rating: e.target.value })}
                                        >
                                            {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} Stars</option>)}
                                        </select>
                                        <input
                                            className="md:col-span-2 px-4 py-3 rounded-xl border border-gray-200 outline-none"
                                            placeholder="Write a review"
                                            value={reviewDrafts[order.id]?.comment || ''}
                                            onChange={(e) => updateReviewDraft(order.id, { comment: e.target.value })}
                                        />
                                        <button className="btn-primary flex items-center justify-center gap-2"><HiOutlineStar /> Submit</button>
                                    </form>
                                )}
                                {reviewMessage && <p className="mt-3 text-sm font-bold text-green-600">{reviewMessage}</p>}
                            </div>
                        </div>
                    </div>
                    );
                })}
            </div>
        </main>
        <Footer />
    </div>
  );
};

export default Orders;
