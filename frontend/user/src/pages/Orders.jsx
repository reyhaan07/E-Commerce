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

function isDelivered(order) {
  return order.deliveryStatus === 'Delivered' || order.sellerStatus === 'Delivered';
}

// Reasons the API accepts. Keep in step with backend/utils/cancellation.js.
const CANCEL_REASONS = [
  'Ordered by mistake',
  'Found a better price',
  'No longer needed',
  'Wrong product ordered',
  'Delivery taking too long',
  'Other',
];

// Mirrors canCancelItem() on the server (backend/utils/cancellation.js): the
// window closes when the courier actually collects the parcel, not when it is
// packed. Only decides whether to OFFER the button — the backend re-checks at
// the moment of the write, so an item collected while this page was open is
// refused there.
const CANCELLABLE_SELLER_STATUSES = ['Processing', 'Accepted', 'Packed', 'Ready For Dispatch'];
const PRE_PICKUP_DELIVERY_STATUSES = [null, undefined, '', 'Assigned', 'Accepted'];

function canCancelItem(order, item) {
  if (!order || !item || item.cancelled) return false;
  if (!PRE_PICKUP_DELIVERY_STATUSES.includes(order.deliveryStatus)) return false;
  return CANCELLABLE_SELLER_STATUSES.includes(order.sellerStatus);
}

const Orders = ({ embedded = false }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [messages, setMessages] = useState({}); // per-order feedback text
  // Per-item cancellation: the line being cancelled plus the modal's draft.
  const [cancelTarget, setCancelTarget] = useState(null); // { order, item }
  const [itemReason, setItemReason] = useState(CANCEL_REASONS[0]);
  const [itemNote, setItemNote] = useState('');
  const [itemBusy, setItemBusy] = useState(false);
  const [itemError, setItemError] = useState('');

  function setMessage(orderId, text, isError = false) {
    setMessages((current) => ({ ...current, [orderId]: { text, isError } }));
  }

  async function refresh() {
    if (!user) return;
    try {
      const data = await apiRequest(`/orders?userId=${encodeURIComponent(user.id)}`);
      setOrders(data.orders);
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

  function openItemCancel(order, item) {
    setCancelTarget({ order, item });
    setItemReason(CANCEL_REASONS[0]);
    setItemNote('');
    setItemError('');
  }

  async function confirmItemCancel() {
    if (!cancelTarget) return;
    const { order, item } = cancelTarget;
    setItemBusy(true);
    setItemError('');
    try {
      await apiRequest(`/orders/${order.id}/items/${item.itemId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: itemReason, note: itemNote }),
      });
      setCancelTarget(null);
      await refresh(); // re-read from the server rather than guessing the new state
    } catch (err) {
      setItemError(err.message || 'Unable to cancel this item. Please try again.');
    } finally {
      setItemBusy(false);
    }
  }

  const content = (
    <>
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

                  {/* Per-item lines, so a single product can be cancelled */}
                  <div className="mb-4 divide-y divide-gray-50">
                    {order.items.map((item, idx) => (
                      <div key={item.itemId || `${item.name}-${idx}`} className="flex items-start gap-3 py-2.5">
                        {item.image
                          ? <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-gray-50 shrink-0" />
                          : <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${item.cancelled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{item.name}</p>
                          <p className="text-xs text-gray-400">Quantity: {item.qty}</p>
                          {item.cancelled && (
                            <div className="mt-1 text-xs space-y-0.5">
                              <p className="font-bold text-red-500">Cancelled</p>
                              {item.cancellationReason && (
                                <p className="text-gray-500">
                                  Reason: {item.cancellationReason}
                                  {item.cancellationNote ? ` — ${item.cancellationNote}` : ''}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        {canCancelItem(order, item) && (
                          <button
                            onClick={() => openItemCancel(order, item)}
                            className="shrink-0 text-xs font-bold text-red-500 border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
                          >
                            Cancel Item
                          </button>
                        )}
                      </div>
                    ))}
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

                  {/* Cancellation state. The action itself is per item, on each
                      line above — the same shape Flipkart and Amazon use. Orders
                      raised through the older whole-order request flow can still
                      be sitting here awaiting review, so keep showing that. */}
                  {pendingCancel && (
                    <p className="mt-4 text-sm font-bold text-amber-600 flex items-center gap-2"><HiOutlineClock /> Cancellation requested — awaiting review</p>
                  )}
                  {order.cancellation?.status === 'Rejected' && (
                    <p className="mt-4 text-sm font-bold text-red-500">Cancellation was declined{order.cancellation.resolutionNote ? `: ${order.cancellation.resolutionNote}` : ''}</p>
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

      <CancelItemModal
        target={cancelTarget}
        reason={itemReason}
        note={itemNote}
        onReason={setItemReason}
        onNote={setItemNote}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmItemCancel}
        busy={itemBusy}
        error={itemError}
      />
    </>
  );

  // Embedded inside the Profile layout (keeps the account sidebar visible).
  if (embedded) return content;

  // Standalone /orders route — full page with its own chrome.
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        {content}
      </main>
      <Footer />
    </div>
  );
};


function CancelItemModal({ target, reason, note, onReason, onNote, onClose, onConfirm, busy, error }) {
  if (!target) return null;
  const { order, item } = target;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[88vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-extrabold text-gray-900">Cancel this item?</h3>
          <p className="text-sm text-gray-500 mt-0.5">Order {order.id}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            {item.image
              ? <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-gray-50" />
              : <div className="w-16 h-16 rounded-xl bg-gray-100" />}
            <div>
              <p className="font-bold text-gray-900">{item.name}</p>
              <p className="text-sm text-gray-500">Quantity: {item.qty}</p>
            </div>
          </div>

          <div>
            <label htmlFor="cancel-reason" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Reason</label>
            <select
              id="cancel-reason"
              value={reason}
              onChange={(e) => onReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm"
            >
              {CANCEL_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {reason === 'Other' && (
            <textarea
              rows={3}
              value={note}
              onChange={(e) => onNote(e.target.value)}
              placeholder="Tell us a little more"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm"
            />
          )}

          <p className="text-sm font-bold text-red-500">This cannot be undone.</p>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} disabled={busy} className="px-5 py-3 rounded-xl border-2 border-gray-100 font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            Keep Order
          </button>
          <button onClick={onConfirm} disabled={busy} className="px-5 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 disabled:opacity-50">
            {busy ? 'Cancelling…' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Orders;
