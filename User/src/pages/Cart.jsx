import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { HiPlus, HiMinus, HiOutlineTrash, HiArrowRight, HiOutlineShoppingBag } from 'react-icons/hi2';
import { Link } from 'react-router-dom';

const Cart = () => {
  const cartItems = [
    { id: 1, name: 'Wireless Headphones', price: 14999, quantity: 1, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=300', color: 'Midnight Black' },
    { id: 2, name: 'Minimalist Watch', price: 4999, quantity: 2, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=300', color: 'Silver' },
  ];

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = 20;
  const tax = subtotal * 0.05;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Shopping Cart ({cartItems.length} items)</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map(item => (
              <div key={item.id} className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-6 items-center">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-gray-500 text-sm mb-4">Color: {item.color}</p>
                    <div className="flex items-center border border-gray-200 rounded-lg w-fit overflow-hidden">
                        <button className="p-2 hover:bg-gray-100"><HiMinus className="text-sm" /></button>
                        <span className="px-4 font-bold text-gray-900">{item.quantity}</span>
                        <button className="p-2 hover:bg-gray-100"><HiPlus className="text-sm" /></button>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-xl font-bold text-gray-900 mb-4">₹{item.price * item.quantity}</p>
                    <button className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 text-sm font-bold uppercase tracking-widest">
                        <HiOutlineTrash /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {cartItems.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <HiOutlineShoppingBag className="mx-auto text-6xl text-gray-200 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                    <p className="text-gray-500 mb-8">Looks like you haven't added anything yet</p>
                    <Link to="/products" className="btn-primary">Start Shopping</Link>
                </div>
            )}
          </div>

          {/* Order Summary */}
          <aside className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Subtotal</span>
                  <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Shipping Fee</span>
                  <span className="text-gray-900">₹{shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Estimated Tax</span>
                  <span className="text-gray-900">₹{tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-4 flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-extrabold text-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>
              <Link to="/checkout" className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-lg shadow-lg shadow-primary/20">
                Proceed to Checkout <HiArrowRight />
              </Link>
              <div className="mt-8 pt-8 border-t border-dashed border-gray-200">
                  <p className="text-center text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">We Accept</p>
                  <div className="flex justify-center gap-4 opacity-50">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="Visa" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4" alt="Mastercard" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="Paypal" />
                  </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
