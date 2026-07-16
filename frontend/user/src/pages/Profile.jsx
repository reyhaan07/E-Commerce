import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineCreditCard,
  HiOutlineHome,
  HiOutlinePencilSquare,
  HiOutlinePhoto,
  HiOutlinePower,
  HiOutlineStar,
  HiOutlineTicket,
  HiOutlineTrash,
  HiOutlineUser,
} from 'react-icons/hi2';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../api/client';

const emptyAddress = { label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '', phone: '', isDefault: false };
const emptyPayment = { type: 'card', label: '', last4: '', upiId: '', isDefault: false };
const AVATAR_MAX_BYTES = 1000 * 1000;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '-';
}

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', avatar: '', deliveryInstructions: '', notifyByEmail: true, notifyBySms: false });
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProfile = () => {
    if (!user) return;
    apiRequest(`/users/${user.id}`)
      .then((data) => {
        setProfile(data.user);
        setProfileForm({
          name: data.user.name || '',
          phone: data.user.phone || '',
          avatar: data.user.avatar || '',
          deliveryInstructions: data.user.deliveryInstructions || '',
          notifyByEmail: data.user.notifyByEmail !== false,
          notifyBySms: data.user.notifyBySms === true,
        });
      })
      .catch((err) => setError(err.message));
  };

  useEffect(loadProfile, [user]);

  const defaultAddress = useMemo(() => profile?.addresses?.find((a) => a.isDefault) || profile?.addresses?.[0], [profile]);

  function showSuccess(text) {
    setMessage(text);
    setError('');
  }

  async function saveProfile(e) {
    e.preventDefault();
    try {
      const data = await apiRequest(`/users/${user.id}`, { method: 'PUT', body: JSON.stringify(profileForm) });
      setProfile(data.user);
      showSuccess('Profile updated');
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveAvatar(avatar) {
    const data = await apiRequest(`/users/${user.id}/avatar`, { method: 'PUT', body: JSON.stringify({ avatar }) });
    setProfile(data.user);
    setProfileForm((current) => ({ ...current, avatar: data.user.avatar || '' }));
  }

  function handleAvatarFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      setError('Please choose a PNG, JPG, or WebP image');
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError('Avatar image must be under 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const avatar = reader.result;
      setProfileForm((current) => ({ ...current, avatar }));
      setError('');
      setMessage('Uploading avatar...');
      try {
        await saveAvatar(avatar);
        showSuccess('Avatar updated');
      } catch (err) {
        setError(err.message);
      }
    };
    reader.onerror = () => setError('Could not read that image file');
    reader.readAsDataURL(file);
  }

  async function saveAddress(e) {
    e.preventDefault();
    try {
      const path = editingAddressId ? `/users/${user.id}/addresses/${editingAddressId}` : `/users/${user.id}/addresses`;
      const data = await apiRequest(path, { method: editingAddressId ? 'PUT' : 'POST', body: JSON.stringify(addressForm) });
      setProfile((current) => ({ ...current, addresses: data.addresses }));
      setAddressForm(emptyAddress);
      setEditingAddressId(null);
      showSuccess('Address saved');
    } catch (err) {
      setError(err.message);
    }
  }

  function editAddress(address) {
    setEditingAddressId(address._id);
    setAddressForm({
      label: address.label || 'Home',
      line1: address.line1 || '',
      line2: address.line2 || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      phone: address.phone || '',
      isDefault: address.isDefault || false,
    });
  }

  async function deleteAddress(addressId) {
    const data = await apiRequest(`/users/${user.id}/addresses/${addressId}`, { method: 'DELETE' });
    setProfile((current) => ({ ...current, addresses: data.addresses }));
  }

  async function setDefaultAddress(address) {
    const data = await apiRequest(`/users/${user.id}/addresses/${address._id}`, { method: 'PUT', body: JSON.stringify({ isDefault: true }) });
    setProfile((current) => ({ ...current, addresses: data.addresses }));
  }

  async function addPayment(e) {
    e.preventDefault();
    try {
      const payload = paymentForm.type === 'card'
        ? { type: 'card', label: paymentForm.label, last4: paymentForm.last4, isDefault: paymentForm.isDefault }
        : { type: 'upi', label: paymentForm.label, upiId: paymentForm.upiId, isDefault: paymentForm.isDefault };
      const data = await apiRequest(`/users/${user.id}/payment-methods`, { method: 'POST', body: JSON.stringify(payload) });
      setProfile((current) => ({ ...current, paymentMethods: data.paymentMethods }));
      setPaymentForm(emptyPayment);
      showSuccess('Payment method saved');
    } catch (err) {
      setError(err.message);
    }
  }

  async function setDefaultPayment(paymentId) {
    const data = await apiRequest(`/users/${user.id}/payment-methods/${paymentId}`, { method: 'PUT', body: JSON.stringify({ isDefault: true }) });
    setProfile((current) => ({ ...current, paymentMethods: data.paymentMethods }));
  }

  async function deletePayment(paymentId) {
    const data = await apiRequest(`/users/${user.id}/payment-methods/${paymentId}`, { method: 'DELETE' });
    setProfile((current) => ({ ...current, paymentMethods: data.paymentMethods }));
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-24 bg-primary"></div>
              <div className="px-8 pb-8 -mt-12 text-center">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-primary/10 mx-auto overflow-hidden flex items-center justify-center text-2xl font-black text-primary">
                  {profileForm.avatar ? <img src={profileForm.avatar} alt="Avatar preview" className="w-full h-full object-cover" /> : initials(profile?.name)}
                </div>
                <h2 className="mt-4 text-xl font-bold text-gray-900">{profile?.name || 'Loading...'}</h2>
                <p className="text-gray-400 text-sm font-medium">Customer since {profile?.createdAt ? new Date(profile.createdAt).getFullYear() : '-'}</p>
                <p className="text-gray-400 text-xs mt-1">Last login: {formatDate(profile?.lastLogin)}</p>
                <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs font-bold text-gray-400 uppercase">Status</p>
                    <p className="font-extrabold text-gray-900 capitalize">{profile?.status || '-'}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs font-bold text-gray-400 uppercase">Points</p>
                    <p className="font-extrabold text-primary">{profile?.loyaltyPoints || 0}</p>
                  </div>
                </div>
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
                ].map((item) => (
                  <button key={item.name} onClick={item.onClick} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all hover:bg-gray-50 ${item.color || 'text-gray-600 hover:text-primary'}`}>
                    <span className="text-xl">{item.icon}</span>
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <div className="lg:col-span-8 space-y-8">
            {(message || error) && (
              <div className={`rounded-2xl px-5 py-4 text-sm font-bold ${error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {error || message}
              </div>
            )}

            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-8 border-b pb-4">Personal Information</h3>
              <form onSubmit={saveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Full Name</span>
                  <input className="w-full px-5 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Phone</span>
                  <input className="w-full px-5 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                </label>
                <label className="md:col-span-2 space-y-2">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Profile Picture</span>
                  <div className="flex flex-col md:flex-row gap-3">
                    <label className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 text-primary font-bold cursor-pointer hover:bg-primary/10 transition-colors">
                      <HiOutlinePhoto className="text-xl" />
                      Upload Image
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarFile} className="sr-only" />
                    </label>
                    <button type="button" onClick={() => saveAvatar('').then(() => showSuccess('Avatar removed')).catch((err) => setError(err.message))} className="px-5 py-3 rounded-xl border border-gray-200 font-bold text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors">
                      Remove
                    </button>
                  </div>
                  <span className="block text-xs text-gray-400">PNG, JPG, or WebP under 1MB. You can also paste an image URL below.</span>
                  <input className="w-full px-5 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20" placeholder="https://..." readOnly={profileForm.avatar?.startsWith('data:image/')} value={profileForm.avatar?.startsWith('data:image/') ? 'Uploaded image selected' : profileForm.avatar} onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })} />
                </label>
                <label className="md:col-span-2 space-y-2">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Delivery Instructions</span>
                  <textarea rows="3" className="w-full px-5 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20" value={profileForm.deliveryInstructions} onChange={(e) => setProfileForm({ ...profileForm, deliveryInstructions: e.target.value })} />
                </label>
                <div className="md:col-span-2 flex flex-wrap gap-4">
                  <label className="flex items-center gap-3 font-bold text-gray-700"><input type="checkbox" className="accent-primary" checked={profileForm.notifyByEmail} onChange={(e) => setProfileForm({ ...profileForm, notifyByEmail: e.target.checked })} /> <HiOutlineBell /> Email notifications</label>
                  <label className="flex items-center gap-3 font-bold text-gray-700"><input type="checkbox" className="accent-primary" checked={profileForm.notifyBySms} onChange={(e) => setProfileForm({ ...profileForm, notifyBySms: e.target.checked })} /> SMS notifications</label>
                </div>
                <div className="md:col-span-2 flex justify-between items-center border-t pt-6">
                  <p className="text-sm text-gray-500">Email: <span className="font-bold text-gray-900">{profile?.email || '-'}</span></p>
                  <button className="btn-primary flex items-center gap-2"><HiOutlinePencilSquare /> Save Profile</button>
                </div>
              </form>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8 border-b pb-4">
                <h3 className="text-xl font-bold text-gray-900">Address Book</h3>
                <p className="text-sm text-gray-400 font-bold">Default: {defaultAddress?.label || 'None'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {profile?.addresses?.map((address) => (
                  <div key={address._id} className="p-5 rounded-2xl border border-gray-100 bg-gray-50">
                    <div className="flex justify-between gap-3 mb-2">
                      <p className="font-bold text-gray-900">{address.label || 'Address'} {address.isDefault && <span className="text-primary text-xs">(Default)</span>}</p>
                      <div className="flex gap-2">
                        <button onClick={() => editAddress(address)} className="text-primary"><HiOutlinePencilSquare /></button>
                        <button onClick={() => deleteAddress(address._id)} className="text-red-500"><HiOutlineTrash /></button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">{address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} {address.pincode}</p>
                    {!address.isDefault && <button onClick={() => setDefaultAddress(address)} className="mt-3 text-xs font-bold text-primary">Set default</button>}
                  </div>
                ))}
              </div>
              <form onSubmit={saveAddress} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['label', 'line1', 'line2', 'city', 'state', 'pincode', 'phone'].map((field) => (
                  <input key={field} className="px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20" placeholder={field} value={addressForm[field]} onChange={(e) => setAddressForm({ ...addressForm, [field]: e.target.value })} />
                ))}
                <label className="flex items-center gap-2 font-bold text-gray-600"><input type="checkbox" className="accent-primary" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} /> Set as default</label>
                <button className="btn-primary">{editingAddressId ? 'Update Address' : 'Add Address'}</button>
              </form>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-8 border-b pb-4">Saved Payments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {profile?.paymentMethods?.map((payment) => (
                  <div key={payment._id} className="p-5 rounded-2xl border border-gray-100 bg-gray-50">
                    <p className="font-bold text-gray-900">{payment.label || (payment.type === 'card' ? 'Card' : 'UPI')} {payment.isDefault && <span className="text-primary text-xs">(Default)</span>}</p>
                    <p className="text-sm text-gray-500">{payment.type === 'card' ? `Card ending ${payment.last4}` : payment.upiId}</p>
                    <div className="flex gap-4 mt-3 text-xs font-bold">
                      {!payment.isDefault && <button onClick={() => setDefaultPayment(payment._id)} className="text-primary">Set default</button>}
                      <button onClick={() => deletePayment(payment._id)} className="text-red-500">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={addPayment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select className="px-4 py-3 rounded-xl border border-gray-200 outline-none" value={paymentForm.type} onChange={(e) => setPaymentForm({ ...emptyPayment, type: e.target.value })}>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                </select>
                <input className="px-4 py-3 rounded-xl border border-gray-200 outline-none" placeholder="Label" value={paymentForm.label} onChange={(e) => setPaymentForm({ ...paymentForm, label: e.target.value })} />
                {paymentForm.type === 'card' ? (
                  <input maxLength="4" className="px-4 py-3 rounded-xl border border-gray-200 outline-none" placeholder="Last 4 digits only" value={paymentForm.last4} onChange={(e) => setPaymentForm({ ...paymentForm, last4: e.target.value.replace(/\D/g, '') })} />
                ) : (
                  <input className="px-4 py-3 rounded-xl border border-gray-200 outline-none" placeholder="name@upi" value={paymentForm.upiId} onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })} />
                )}
                <label className="flex items-center gap-2 font-bold text-gray-600"><input type="checkbox" className="accent-primary" checked={paymentForm.isDefault} onChange={(e) => setPaymentForm({ ...paymentForm, isDefault: e.target.checked })} /> Set as default</label>
                <button className="btn-primary">Add Payment</button>
              </form>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-8 border-b pb-4">My Reviews</h3>
              <div className="space-y-4">
                {profile?.reviews?.length ? profile.reviews.map((review) => (
                  <div key={review._id} className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-bold text-gray-900">{review.productName || review.productId}</p>
                      <p className="flex items-center gap-1 font-bold text-yellow-500"><HiOutlineStar /> {review.rating}/5</p>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">{review.comment || 'No comment added.'}</p>
                  </div>
                )) : <p className="text-gray-400 text-sm">Reviews you write from delivered orders or product pages will appear here.</p>}
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
