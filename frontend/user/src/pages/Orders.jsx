import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { HiOutlineCube, HiOutlineCheckCircle, HiOutlineClock, HiOutlineTruck } from 'react-icons/hi2';

const Orders = () => {
  const orders = [
    { 
        id: '#ORD-992182', 
        date: 'June 12, 2026', 
        status: 'Delivered', 
        total: 14999, 
        items: 1, 
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200',
        color: 'text-green-500',
        bg: 'bg-green-50',
        icon: <HiOutlineCheckCircle />
    },
    { 
        id: '#ORD-881273', 
        date: 'June 15, 2026', 
        status: 'In Transit', 
        total: 9999, 
        items: 2, 
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200',
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        icon: <HiOutlineTruck />
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">My Orders</h1>
            
            <div className="space-y-6 max-w-4xl mx-auto">
                {orders.map(order => (
                    <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center text-center md:text-left">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                                <img src={order.image} className="w-full h-full object-cover" alt="" />
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{order.date}</p>
                                        <h3 className="text-xl font-extrabold text-gray-900">{order.id}</h3>
                                    </div>
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${order.bg} ${order.color}`}>
                                        {order.icon} {order.status}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-50">
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total</p>
                                        <p className="font-extrabold text-gray-900">₹{order.total}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Items</p>
                                        <p className="font-extrabold text-gray-900">{order.items} Items</p>
                                    </div>
                                    <div className="md:col-span-2 flex justify-end gap-6">
                                        <Link to={`/track-order/${order.id.replace('#', '')}`} className="text-primary font-bold hover:underline">Track Order</Link>
                                        <button className="text-primary font-bold hover:underline">Download Invoice</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Order Timeline Preview */}
                        <div className="bg-gray-50/50 px-8 py-6 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest overflow-x-auto gap-4">
                            <div className="flex items-center gap-2 text-primary whitespace-nowrap"><HiOutlineCube className="text-lg" /> Order Placed</div>
                            <div className="h-px bg-gray-200 flex-1 min-w-[20px]"></div>
                            <div className="flex items-center gap-2 text-primary whitespace-nowrap"><HiOutlineCheckCircle className="text-lg" /> Confirmed</div>
                            <div className="h-px bg-gray-200 flex-1 min-w-[20px]"></div>
                            <div className="flex items-center gap-2 text-gray-300 whitespace-nowrap"><HiOutlineTruck className="text-lg" /> Shipped</div>
                            <div className="h-px bg-gray-200 flex-1 min-w-[20px]"></div>
                            <div className="flex items-center gap-2 text-gray-300 whitespace-nowrap"><HiOutlineCheckCircle className="text-lg" /> Delivered</div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
        <Footer />
    </div>
  );
};

export default Orders;
