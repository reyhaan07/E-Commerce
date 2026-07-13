import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { HiOutlineUser, HiOutlineTicket, HiOutlineHome, HiOutlineCreditCard, HiOutlinePencilSquare, HiOutlinePower } from 'react-icons/hi2';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../api/client';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user) return;
    apiRequest(`/users/${user.id}`)
      .then((data) => setProfile(data.user))
      .catch(() => {});
  }, [user]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  const defaultAddress = profile?.addresses?.find((a) => a.isDefault) || profile?.addresses?.[0];

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
                    <h2 className="mt-4 text-xl font-bold text-gray-900">{profile?.name || 'Loading...'}</h2>
                    <p className="text-gray-400 text-sm font-medium">
                      {profile?.createdAt ? `Customer since ${new Date(profile.createdAt).getFullYear()}` : ''}
                    </p>
                    <button className="mt-6 flex items-center gap-2 mx-auto text-primary font-bold hover:underline">
                        <HiOutlinePencilSquare /> Edit Profile
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
                <nav className="space-y-1">
                    {[
                        { name: 'My Profile', icon: <HiOutlineUser /> },
                        { name: 'My Orders', icon: <HiOutlineTicket />, onClick: () => navigate('/orders') },
                        { name: 'Address Book', icon: <HiOutlineHome /> },
                        { name: 'Payments', icon: <HiOutlineCreditCard /> },
                        { name: 'Logout', icon: <HiOutlinePower />, color: 'text-red-500', onClick: handleLogout },
                    ].map((item, idx) => (
                        <button key={idx} onClick={item.onClick} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all hover:bg-gray-50 ${item.color || 'text-gray-600 hover:text-primary'}`}>
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
                        <p className="text-gray-900 font-medium">{profile?.name || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                        <p className="text-gray-900 font-medium">{profile?.email || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                        <p className="text-gray-900 font-medium">{profile?.phone || '-'}</p>
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
                {defaultAddress ? (
                    <div className="flex items-start gap-4 p-6 rounded-2xl border border-gray-100 bg-gray-50">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary flex-shrink-0 border">
                            <HiOutlineHome className="text-xl" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 mb-1">{defaultAddress.label || 'Home'}</p>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                {defaultAddress.line1}{defaultAddress.line2 ? `, ${defaultAddress.line2}` : ''}, <br />
                                {defaultAddress.state}, {defaultAddress.pincode}
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-400 text-sm p-6">No saved address yet.</p>
                )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
