import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { HiCreditCard, HiCheckCircle, HiHome, HiPhone, HiUser } from 'react-icons/hi2';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../api/client';

const PAYMENT_METHOD_MAP = { card: 'Prepaid', upi: 'Prepaid', cod: 'Cash on Delivery' };

const Checkout = () => {
  const { items: cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = cartItems.length ? 200 : 0;
  const total = subtotal + shipping;

  const [address, setAddress] = useState({ street: '', city: '', pincode: '', state: '' });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  async function handlePlaceOrder() {
    setError('');
    if (!user) {
      setError('Please log in to place an order');
      return;
    }
    if (cartItems.length === 0) return;

    setPlacing(true);
    try {
      await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          customerName: user.name,
          customerEmail: user.email,
          customerAddress: `${address.street}, ${address.city}, ${address.state} ${address.pincode}`,
          items: cartItems.map((i) => ({ name: i.name, qty: i.quantity })),
          amount: total,
          paymentMethod: PAYMENT_METHOD_MAP[paymentMethod] || 'Prepaid',
        }),
      });
      clearCart();
      navigate('/orders');
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-10">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Forms */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Shipping Address */}
              <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <HiHome className="text-xl" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
                </div>

                <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Street Address</label>
                    <input type="text" className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="123 Shopping Avenue" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">City</label>
                    <input type="text" className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Noida" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Pincode</label>
                    <input type="text" className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="201301" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">State</label>
                    <input type="text" className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Uttar Pradesh" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
                  </div>
                </form>
              </section>

              {/* Payment Method */}
              <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <HiCreditCard className="text-xl" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                      { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
                      { id: 'upi', name: 'UPI / Wallet', icon: '📱' },
                      { id: 'cod', name: 'Cash on Delivery', icon: '💵' },
                  ].map(method => (
                      <label key={method.id} className="relative border-2 border-gray-100 p-6 rounded-2xl cursor-pointer hover:border-primary transition-all group overflow-hidden">
                          <input type="radio" name="payment" className="sr-only peer" checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} />
                          <div className="peer-checked:text-primary transition-colors">
                              <span className="text-3xl block mb-2">{method.icon}</span>
                              <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">{method.name}</p>
                          </div>
                          <div className="absolute top-3 right-3 opacity-0 peer-checked:opacity-100 transition-opacity">
                              <HiCheckCircle className="text-primary text-2xl" />
                          </div>
                      </label>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column: Summary */}
            <aside className="lg:col-span-4">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6 uppercase tracking-widest text-sm">Review Order</h2>
                <div className="space-y-4 mb-8">
                    {cartItems.length === 0 ? (
                        <p className="text-sm text-gray-400">Your cart is empty.</p>
                    ) : cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                            <div>
                                <p className="font-bold text-gray-900">{item.name}</p>
                                <p className="text-gray-400">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-extrabold text-gray-900">₹{item.price * item.quantity}</p>
                        </div>
                    ))}
                </div>

                <div className="border-t border-dashed border-gray-200 pt-6 space-y-4 mb-8">
                    <div className="flex justify-between text-gray-500 font-medium">
                        <span>Subtotal</span>
                        <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 font-medium">
                        <span>Shipping</span>
                        <span className="text-gray-900">₹{shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-4 border-t border-gray-100">
                        <span className="text-lg font-extrabold text-gray-900">Total</span>
                        <span className="text-2xl font-black text-primary">₹{total.toFixed(2)}</span>
                    </div>
                </div>

                {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
                <button onClick={handlePlaceOrder} disabled={placing || cartItems.length === 0} className="w-full btn-primary py-4 text-xl shadow-xl shadow-primary/20 disabled:opacity-60">
                  {placing ? 'Placing Order...' : 'Place Order Now'}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
