import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StatusBadge from '../components/StatusBadge';
import StatusTimeline from '../components/StatusTimeline';
import { getOrder } from '../api/orders';
import { useAuth } from '../hooks/useAuth';
import { HiOutlineSearch, HiOutlinePhone, HiOutlineUser } from 'react-icons/hi';

const SOCKET_URL = 'http://localhost:5000';

const TrackOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orderId, setOrderId] = useState(id || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [liveNote, setLiveNote] = useState('');
  const orderRef = useRef(null);
  orderRef.current = order;

  useEffect(() => {
    if (id) {
      handleLookup(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Feature 8: each delivery-status change is broadcast over Socket.io, so
  // the timeline refreshes itself without a manual reload.
  useEffect(() => {
    const socket = io(SOCKET_URL, { query: { role: 'user', userId: user?.id || '' } });
    socket.on('order-updated', (payload) => {
      const current = orderRef.current;
      if (current && payload.orderId === current.id) {
        getOrder(current.id).then((fresh) => {
          setOrder(fresh);
          setLiveNote(`Updated live at ${new Date().toLocaleTimeString()}`);
        }).catch(() => {});
      }
    });
    return () => socket.disconnect();
  }, [user]);

  async function handleLookup(lookupId) {
    const targetId = (lookupId || orderId).trim();
    if (!targetId) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const data = await getOrder(targetId);
      setOrder(data);
      navigate(`/track-order/${encodeURIComponent(targetId)}`, { replace: true });
    } catch (err) {
      setError('We could not find an order with that ID. Please check and try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    handleLookup(orderId);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Track Your Order</h1>
        <p className="text-gray-500 mb-8">Enter your order ID to see its current delivery status.</p>

        <form onSubmit={handleSubmit} className="flex gap-3 mb-10">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. ORD-1001"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary px-8 disabled:opacity-70">
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {error && <p className="text-red-500 font-medium mb-8">{error}</p>}

        {order && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <h3 className="text-xl font-extrabold text-gray-900">{order.id}</h3>
                  {order.trackingId && <p className="text-xs font-bold text-primary mt-1">Tracking id: {order.trackingId}</p>}
                  {liveNote && <p className="text-[11px] text-green-600 font-bold mt-1">● {liveNote}</p>}
                </div>
                <StatusBadge status={order.deliveryStatus} />
              </div>

              <div className="pt-6 border-t border-gray-100">
                <StatusTimeline currentStatus={order.deliveryStatus} statusHistory={order.statusHistory} />
              </div>
            </div>

            <div className="bg-gray-50/50 px-6 md:px-8 py-6 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Delivery Partner Information</p>
              {order.deliveryPartnerId ? (
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                  <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <HiOutlineUser className="text-lg text-primary" /> {order.deliveryPartnerName}
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <HiOutlinePhone className="text-lg text-primary" /> {order.deliveryPartnerPhone}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Not yet assigned to a delivery partner.</p>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default TrackOrder;
