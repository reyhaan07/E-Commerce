import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { HiOutlineUser, HiOutlineTicket, HiOutlineHome, HiOutlineCreditCard, HiOutlinePencilSquare, HiOutlinePower } from 'react-icons/hi2';

const Profile = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
          
          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="h-24 bg-primary"></div>
                <div className="px-8 pb-8 -mt-12 text-center">
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 mx-auto overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80" alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-gray-900">Johnathan Doe</h2>
                    <p className="text-gray-400 text-sm font-medium">Customer since 2026</p>
                    <button className="mt-6 flex items-center gap-2 mx-auto text-primary font-bold hover:underline">
                        <HiOutlinePencilSquare /> Edit Profile
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
                <nav className="space-y-1">
                    {[
                        { name: 'My Profile', icon: <HiOutlineUser /> },
                        { name: 'My Orders', icon: <HiOutlineTicket /> },
                        { name: 'Address Book', icon: <HiOutlineHome /> },
                        { name: 'Payments', icon: <HiOutlineCreditCard /> },
                        { name: 'Logout', icon: <HiOutlinePower />, color: 'text-red-500' },
                    ].map((item, idx) => (
                        <button key={idx} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all hover:bg-gray-50 ${item.color || 'text-gray-600 hover:text-primary'}`}>
                            <span className="text-xl">{item.icon}</span>
                            {item.name}
                        </button>
                    ))}
                </nav>
            </div>
          </aside>

          {/* Main Info */}
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-8 border-b pb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name</p>
                        <p className="text-gray-900 font-medium">Johnathan Doe</p>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                        <p className="text-gray-900 font-medium">john.doe@example.com</p>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                        <p className="text-gray-900 font-medium">+91 98765 43210</p>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Birthday</p>
                        <p className="text-gray-900 font-medium">Jan 01, 1995</p>
                    </div>
                </div>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8 border-b pb-4">
                    <h3 className="text-xl font-bold text-gray-900">Default Address</h3>
                    <button className="text-primary font-bold hover:underline text-sm">+ Add New</button>
                </div>
                <div className="flex items-start gap-4 p-6 rounded-2xl border border-gray-100 bg-gray-50">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary flex-shrink-0 border">
                        <HiOutlineHome className="text-xl" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 mb-1">Home</p>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Sector 62, Noida, <br />
                            Near Electronics City Metro Station, <br />
                            Uttar Pradesh, 201309
                        </p>
                    </div>
                </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
