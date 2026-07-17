import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { HiOutlineCube, HiOutlineCheckCircle, HiOutlineClock, HiOutlineTruck, HiOutlineStar, HiOutlineXCircle, HiOutlineArrowUturnLeft } from 'react-icons/hi2';
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

function isDelivered(order) {
  return order.deliveryStatus === 'Delivered' || order.sellerStatus === 'Delivered';
}

function canCancel(order) {
  return ['Processing', 'Ready For Dispatch'].includes(order.sellerStatus)
    && !(order.cancellation?.requested && order.cancellation?.status === 'Requested')
    && order.sellerStatus !== 'Cancelled';
}

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [messages, setMessages] = useState({}); // per-order feedback text
  const [cancelDrafts, setCancelDrafts] = useState({}); // orderId -> reason being typed
  const [returnDrafts, setReturnDrafts] = useState({});

  function setMessage(orderId, text, isError = false) {
    setMessages((current) => ({ ...current, [orderId]: { text, isError } }));
  }

  async function refresh() {
    if (!user) return;
    try {
      const data = await apiRequest(`/orders?userId=${encodeURIComponent(user.id)}`);
      setOrders(data.orders);
      const ret = await apiRequest('/returns');
      setReturns(ret.returns);
    } catch (e) { /* not fatal for the page */ }
  }

  useEffect(() => { refresh(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateReviewDraft(orderId, changes) {
    setReviewDrafts((current) => ({
      ...current,
      [orderId]: { rating: 5, productId: '', comment: '', ...current[orderId], ...changes },
    }));
  }

  async function submitOrderReview(e, order) {
    e.preventDefault();
    const draft = reviewDrafts[order.id] || {};
    const productId = draft.productId || order.items[0]?.productId;
    if (!productId) {
      setMessage(order.id, 'This order has no reviewable products', true);
      return;
    }
    try {
      await apiRequest('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          productId,
          orderId: order.id,
          rating: Number(draft.rating || 5),
          comment: draft.comment || '',
        }),
      });
      setReviewDrafts((current) => ({ ...current, [order.id]: { rating: 5, productId: '', comment: '' } }));
      setMessage(order.id, 'Review submitted — it will appear on the product page once approved');
    } catch (err) {
      setMessage(order.id, err.message, true);
    }
  }

  async function requestCancellation(order) {
    const reason = (cancelDrafts[order.id] || '').trim();
    if (!reason) {
      setMessage(order.id, 'Please add a short reason for the cancellation', true);
      return;
    }
    try {
      await apiRequest(`/orders/${order.id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });
      setCancelDrafts((current) => ({ ...current, [order.id]: '' }));
      setMessage(order.id, 'Cancellation requested — we will notify you once it is reviewed');
      refresh();
    } catch (err) {
      setMessage(order.id, err.message, true);
    }
  }

  async function requestReturn(order) {
    const reason = (returnDrafts[order.id] || '').trim();
    if (!reason) {
      setMessage(order.id, 'Please add a short reason for the return', true);
      return;
    }
    try {
      await apiRequest('/returns', { method: 'POST', body: JSON.stringify({ orderId: order.id, reason }) });
      setReturnDrafts((current) => ({ ...current, [order.id]: '' }));
      setMessage(order.id, 'Return requested — track its progress below');
      refresh();
    } catch (err) {
      setMessage(order.id, err.message, true);
    }
  }

  function openReturnFor(order) {
    return returns.find((r) => r.orderId === order.id && r.status !== 'Rejected');
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
          {orders.map((order) => {
            const badge = statusBadge(order);
            const message = messages[order.id];
            const pendingCancel = order.cancellation?.requested && order.cancellation?.status === 'Requested';
            const activeReturn = openReturnFor(order);
            return (
              <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</p>
                      <h3 className="text-xl font-extrabold text-gray-900">{order.id}</h3>
                      {order.trackingId && <p className="text-xs font-bold text-primary mt-1">Tracking: {order.trackingId}</p>}
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${badge.bg} ${badge.color}`}>
                      {badge.icon} {badge.label}
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 mb-4">
                    {order.items.map((item) => `${item.name} × ${item.qty}`).join(' · ')}
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-50 items-center">
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total</p>
                      <p className="font-extrabold text-gray-900">₹{order.amount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Payment</p>
                      <p className="font-extrabold text-gray-900">{order.paymentMethod}</p>
                    </div>
                    <div className="lg:col-span-2 flex justify-end gap-6">
                      <Link to={`/track-order/${order.id}`} className="text-primary font-bold hover:underline">Track Order</Link>
                    </div>
                  </div>

                  {/* Cancellation state / action (Feature 10) */}
                  {pendingCancel && (
                    <p className="mt-4 text-sm font-bold text-amber-600 flex items-center gap-2"><HiOutlineClock /> Cancellation requested — awaiting review</p>
                  )}
                  {order.cancellation?.status === 'Rejected' && (
                    <p className="mt-4 text-sm font-bold text-red-500">Cancellation was declined{order.cancellation.resolutionNote ? `: ${order.cancellation.resolutionNote}` : ''}</p>
                  )}
                  {canCancel(order) && !pendingCancel && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                      <input
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm"
                        placeholder="Reason for cancellation"
                        value={cancelDrafts[order.id] || ''}
                        onChange={(e) => setCancelDrafts((current) => ({ ...current, [order.id]: e.target.value }))}
                      />
                      <button onClick={() => requestCancellation(order)} className="px-5 py-3 rounded-xl border-2 border-red-100 text-red-500 font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                        <HiOutlineXCircle /> Cancel Order
                      </button>
                    </div>
                  )}

                  {/* Return state / action (Feature 11) */}
                  {activeReturn && (
                    <p className="mt-4 text-sm font-bold text-blue-600 flex items-center gap-2">
                      <HiOutlineArrowUturnLeft /> Return {activeReturn.id}: {activeReturn.status}
                      {activeReturn.status === 'Refunded' && activeReturn.refund?.amount ? ` — ₹${activeReturn.refund.amount} refunded` : ''}
                    </p>
                  )}
                  {isDelivered(order) && !activeReturn && order.sellerStatus !== 'Returned' && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                      <input
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm"
                        placeholder="Reason for return"
                        value={returnDrafts[order.id] || ''}
                        onChange={(e) => setReturnDrafts((current) => ({ ...current, [order.id]: e.target.value }))}
                      />
                      <button onClick={() => requestReturn(order)} className="px-5 py-3 rounded-xl border-2 border-blue-100 text-blue-600 font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                        <HiOutlineArrowUturnLeft /> Request Return
                      </button>
                    </div>
                  )}

                  {/* Review form — delivered orders only (Feature 9) */}
                  {isDelivered(order) && (
                    <form onSubmit={(e) => submitOrderReview(e, order)} className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-3 rounded-2xl bg-gray-50 border border-gray-100 p-4">
                      <select
                        className="px-4 py-3 rounded-xl border border-gray-200 outline-none"
                        value={reviewDrafts[order.id]?.productId || order.items[0]?.productId || ''}
                        onChange={(e) => updateReviewDraft(order.id, { productId: e.target.value })}
                      >
                        {order.items.map((item) => <option key={item.productId || item.name} value={item.productId || ''}>{item.name}</option>)}
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

                  {message && (
                    <p className={`mt-3 text-sm font-bold ${message.isError ? 'text-red-500' : 'text-green-600'}`}>{message.text}</p>
                  )}
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
