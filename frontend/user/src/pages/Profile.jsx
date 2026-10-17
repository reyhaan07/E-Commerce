import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Orders from './Orders';
import {
  HiBars3,
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineCreditCard,
  HiOutlineDevicePhoneMobile,
  HiOutlineEnvelope,
  HiOutlineHome,
  HiOutlinePencilSquare,
  HiOutlinePhoto,
  HiOutlinePower,
  HiOutlineStar,
  HiOutlineTicket,
  HiOutlineTrash,
  HiOutlineUser,
  HiXMark,
} from 'react-icons/hi2';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../api/client';

const emptyAddress = { label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '', phone: '', isDefault: false };
const emptyPayment = { type: 'card', label: '', last4: '', upiId: '', isDefault: false };
const AVATAR_MAX_BYTES = 1000 * 1000;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DELIVERY_MAX = 500;

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '-';
}

// ── Small presentational helpers (scoped to this page) ──────────────────────
function StatTile({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-extrabold capitalize ${accent || 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function NavItem({ icon, label, active, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[15px] font-semibold transition-all
        ${danger
          ? 'text-red-500 hover:bg-red-50'
          : active
            ? 'bg-primary/10 text-primary'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
    >
      {active && !danger && <span className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r bg-primary" />}
      <span className={`text-xl ${active && !danger ? 'text-primary' : danger ? 'text-red-500' : 'text-slate-400'}`}>{icon}</span>
      {label}
    </button>
  );
}

function NotificationToggle({ icon, title, description, checked, onToggle, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onToggle(!checked)}
      aria-pressed={checked}
      disabled={disabled}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all
        ${checked ? 'border-primary bg-primary/5 ring-2 ring-primary/15' : 'border-slate-200 bg-white hover:border-slate-300'}
        ${disabled ? 'cursor-default opacity-90' : 'cursor-pointer'}`}
    >
      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-white transition-colors
        ${checked ? 'border-primary bg-primary' : 'border-slate-300 bg-white'}`}>
        {checked && <HiOutlineCheck className="text-sm" strokeWidth={3} />}
      </span>
      <span>
        <span className="flex items-center gap-2 text-[14.5px] font-bold text-slate-900">{icon} {title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-slate-500">{description}</span>
      </span>
    </button>
  );
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
  // Which section is shown. Held in the URL (?tab=orders) rather than plain
  // state so Orders can be linked to directly, survives a refresh, and works
  // with browser back/forward — every Orders link in the app lands here.
  const [searchParams, setSearchParams] = useSearchParams();
  const SECTIONS = ['profile', 'orders', 'addresses', 'payments'];
  const tabParam = searchParams.get('tab');
  const section = SECTIONS.includes(tabParam) ? tabParam : 'profile';
  // UI-only state for the re-skin: edit mode, mobile drawer.
  const [editing, setEditing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      setEditing(false);
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

  function go(target) {
    setDrawerOpen(false);
    // Swaps the section in place (no reload, sidebar stays put) while keeping
    // the URL in step. `replace` so flicking between sections doesn't bury the
    // page the customer arrived from under history entries.
    setSearchParams(target === 'profile' ? {} : { tab: target }, { replace: true });
  }

  const avatarSrc = profileForm.avatar || profile?.avatar || '';
  const heroSubtitle = section === 'addresses'
    ? 'Manage your saved delivery addresses'
    : section === 'payments'
      ? 'Manage your saved payment methods'
      : section === 'orders'
        ? 'Track and manage your orders'
        : 'Manage your personal information and account settings';

  const inputBase = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-slate-50 disabled:text-slate-500';
  const labelBase = 'mb-2 block text-[11.5px] font-bold uppercase tracking-wider text-slate-400';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Mobile drawer overlay */}
      {drawerOpen && <div className="fixed inset-0 z-40 bg-slate-900/45 lg:hidden" onClick={() => setDrawerOpen(false)} />}

      <main className="mx-auto w-full max-w-[1760px] px-4 py-6 sm:px-6 lg:px-10">
        <div className="flex items-start gap-6">
          {/* ── Sidebar (sticky on desktop, drawer on mobile) ── */}
          <aside
            className={`fixed left-0 top-0 z-50 flex h-full w-[300px] shrink-0 flex-col gap-5 overflow-y-auto bg-slate-50 p-4 shadow-2xl transition-transform duration-300
              lg:sticky lg:top-24 lg:z-0 lg:h-auto lg:overflow-visible lg:bg-transparent lg:p-0 lg:shadow-none lg:translate-x-0
              ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            <button className="self-end rounded-lg border border-slate-200 bg-white p-2 text-slate-600 lg:hidden" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
              <HiXMark className="text-lg" />
            </button>

            {/* Identity card */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="h-24 bg-gradient-to-br from-primary to-indigo-600" />
              <div className="-mt-12 px-6 pb-6 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-primary/10 text-2xl font-black text-primary shadow-sm">
                  {avatarSrc ? <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" /> : initials(profile?.name)}
                </div>
                <h2 className="mt-4 text-xl font-bold text-slate-900">{profile?.name || 'Loading...'}</h2>
                <p className="mt-0.5 text-sm font-semibold text-slate-400">Customer since {profile?.createdAt ? new Date(profile.createdAt).getFullYear() : '-'}</p>
                <p className="mt-1 text-xs text-slate-400">Last login: {formatDate(profile?.lastLogin)}</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <StatTile label="Status" value={profile?.status || '-'} accent="text-green-600" />
                  <StatTile label="Points" value={profile?.loyaltyPoints ?? 0} accent="text-primary" />
                </div>
              </div>
            </div>

            {/* Nav card */}
            <nav className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
              <NavItem icon={<HiOutlineUser />} label="My Profile" active={section === 'profile'} onClick={() => go('profile')} />
              <NavItem icon={<HiOutlineTicket />} label="My Orders" active={section === 'orders'} onClick={() => go('orders')} />
              <NavItem icon={<HiOutlineHome />} label="Address Book" active={section === 'addresses'} onClick={() => go('addresses')} />
              <NavItem icon={<HiOutlineCreditCard />} label="Payments" active={section === 'payments'} onClick={() => go('payments')} />
              <div className="my-2 h-px bg-slate-100" />
              <NavItem icon={<HiOutlinePower />} label="Logout" danger onClick={handleLogout} />
            </nav>
          </aside>

          {/* ── Main content ── */}
          <div className="min-w-0 flex-1 space-y-6">
            {/* Mobile account-menu opener */}
            <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 lg:hidden" onClick={() => setDrawerOpen(true)}>
              <HiBars3 className="text-lg" /> Account menu
            </button>

            {/* Hero */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-indigo-600 px-6 py-8 text-white shadow-md sm:px-9">
              <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute bottom-[-90px] right-24 h-52 w-52 rounded-full bg-white/[0.07]" />
              <h1 className="relative text-2xl font-extrabold tracking-tight sm:text-[26px]">{profile?.name || 'My Account'}</h1>
              <p className="relative mt-1.5 text-[14.5px] text-white/85">{heroSubtitle}</p>
            </section>

            {/* Feedback banner */}
            {(message || error) && (
              <div className={`flex items-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold ${error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {!error && <HiOutlineCheckCircle className="text-lg" />}{error || message}
              </div>
            )}

            {/* ── My Profile view ── */}
            {section === 'profile' && (
              <>
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-slate-900">Personal Information</h3>
                    <button
                      type="button"
                      onClick={() => setEditing((v) => !v)}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all
                        ${editing ? 'bg-primary/10 text-primary' : 'border border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    >
                      <HiOutlinePencilSquare /> {editing ? 'Editing…' : 'Edit Profile'}
                    </button>
                  </div>
                  <div className="my-6 h-px bg-slate-100" />

                  <form onSubmit={saveProfile}>
                    {/* Name + phone */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <label className="block">
                        <span className={labelBase}>Full Name</span>
                        <input className={inputBase} value={profileForm.name} disabled={!editing} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                      </label>
                      <label className="block">
                        <span className={labelBase}>Phone</span>
                        <input className={inputBase} value={profileForm.phone} disabled={!editing} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                      </label>
                    </div>

                    {/* Profile picture */}
                    <div className="mt-6">
                      <span className={labelBase}>Profile Picture</span>
                      <div className="flex flex-wrap items-center gap-5">
                        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-primary/10 text-2xl font-black text-primary">
                          {avatarSrc ? <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" /> : initials(profile?.name)}
                        </div>
                        <div className="min-w-[220px] flex-1">
                          <div className="flex flex-wrap gap-2.5">
                            <label className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${editing ? 'cursor-pointer bg-primary/10 text-primary hover:bg-primary/15' : 'cursor-default bg-slate-100 text-slate-400'}`}>
                              <HiOutlinePhoto className="text-lg" /> Upload Image
                              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarFile} className="sr-only" disabled={!editing} />
                            </label>
                            <button type="button" disabled={!editing || !avatarSrc} onClick={() => saveAvatar('').then(() => showSuccess('Avatar removed')).catch((err) => setError(err.message))} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:border-red-200 hover:text-red-500 disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-500">
                              <HiOutlineTrash className="text-base" /> Remove
                            </button>
                          </div>
                          <p className="mt-2.5 text-xs text-slate-500">PNG, JPG, or WebP under 1MB. You can also paste an image URL below.</p>
                          <input
                            className={`${inputBase} mt-2.5`}
                            placeholder="https://..."
                            disabled={!editing}
                            readOnly={profileForm.avatar?.startsWith('data:image/')}
                            value={profileForm.avatar?.startsWith('data:image/') ? 'Uploaded image selected' : profileForm.avatar}
                            onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Delivery instructions */}
                    <div className="mt-6">
                      <div className="flex items-baseline justify-between">
                        <span className={labelBase}>Delivery Instructions</span>
                        <span className="text-xs tabular-nums text-slate-400">{profileForm.deliveryInstructions.length}/{DELIVERY_MAX}</span>
                      </div>
                      <textarea
                        rows="3"
                        maxLength={DELIVERY_MAX}
                        placeholder="Add any delivery instructions for your orders..."
                        className={`${inputBase} min-h-[110px] resize-y`}
                        disabled={!editing}
                        value={profileForm.deliveryInstructions}
                        onChange={(e) => setProfileForm({ ...profileForm, deliveryInstructions: e.target.value })}
                      />
                    </div>

                    {/* Notifications */}
                    <div className="mt-6">
                      <span className={labelBase}>Notifications</span>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <NotificationToggle
                          icon={<HiOutlineEnvelope className="text-base" />}
                          title="Email notifications"
                          description="Receive order updates and important alerts via email."
                          checked={profileForm.notifyByEmail}
                          onToggle={(v) => setProfileForm({ ...profileForm, notifyByEmail: v })}
                          disabled={!editing}
                        />
                        <NotificationToggle
                          icon={<HiOutlineDevicePhoneMobile className="text-base" />}
                          title="SMS notifications"
                          description="Receive order updates via SMS."
                          checked={profileForm.notifyBySms}
                          onToggle={(v) => setProfileForm({ ...profileForm, notifyBySms: v })}
                          disabled={!editing}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-7 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-500"><HiOutlineEnvelope className="mr-1.5 inline align-[-2px]" />Email: <span className="font-bold text-slate-900">{profile?.email || '-'}</span></p>
                      <button className="btn-primary inline-flex items-center justify-center gap-2"><HiOutlinePencilSquare /> Save Profile</button>
                    </div>
                  </form>
                </section>

                {/* My reviews (kept, re-skinned) */}
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <h3 className="mb-6 border-b border-slate-100 pb-4 text-xl font-bold text-slate-900">My Reviews</h3>
                  <div className="space-y-4">
                    {profile?.reviews?.length ? profile.reviews.map((review) => (
                      <div key={review._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-bold text-slate-900">{review.productName || review.productId}</p>
                          <p className="flex items-center gap-1 font-bold text-yellow-500"><HiOutlineStar /> {review.rating}/5</p>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{review.comment || 'No comment added.'}</p>
                      </div>
                    )) : <p className="text-sm text-slate-400">Reviews you write from delivered orders or product pages will appear here.</p>}
                  </div>
                </section>
              </>
            )}

            {/* ── Address Book view ── */}
            {section === 'addresses' && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6 flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-bold text-slate-900">Address Book</h3>
                  <p className="text-sm font-bold text-slate-400">Default: {defaultAddress?.label || 'None'}</p>
                </div>
                <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {profile?.addresses?.map((address) => (
                    <div key={address._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                      <div className="mb-2 flex justify-between gap-3">
                        <p className="font-bold text-slate-900">{address.label || 'Address'} {address.isDefault && <span className="text-xs text-primary">(Default)</span>}</p>
                        <div className="flex gap-2">
                          <button onClick={() => editAddress(address)} className="text-primary"><HiOutlinePencilSquare /></button>
                          <button onClick={() => deleteAddress(address._id)} className="text-red-500"><HiOutlineTrash /></button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500">{address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} {address.pincode}</p>
                      {!address.isDefault && <button onClick={() => setDefaultAddress(address)} className="mt-3 text-xs font-bold text-primary">Set default</button>}
                    </div>
                  ))}
                  {!profile?.addresses?.length && <p className="text-sm text-slate-400">No saved addresses yet.</p>}
                </div>
                <form onSubmit={saveAddress} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {['label', 'line1', 'line2', 'city', 'state', 'pincode', 'phone'].map((field) => (
                    <input key={field} className={inputBase} placeholder={field} value={addressForm[field]} onChange={(e) => setAddressForm({ ...addressForm, [field]: e.target.value })} />
                  ))}
                  <label className="flex items-center gap-2 font-bold text-slate-600"><input type="checkbox" className="accent-primary" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} /> Set as default</label>
                  <button className="btn-primary">{editingAddressId ? 'Update Address' : 'Add Address'}</button>
                </form>
              </section>
            )}

            {/* ── Payments view ── */}
            {section === 'payments' && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h3 className="mb-6 border-b border-slate-100 pb-4 text-xl font-bold text-slate-900">Saved Payments</h3>
                <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {profile?.paymentMethods?.map((payment) => (
                    <div key={payment._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                      <p className="font-bold text-slate-900">{payment.label || (payment.type === 'card' ? 'Card' : 'UPI')} {payment.isDefault && <span className="text-xs text-primary">(Default)</span>}</p>
                      <p className="text-sm text-slate-500">{payment.type === 'card' ? `Card ending ${payment.last4}` : payment.upiId}</p>
                      <div className="mt-3 flex gap-4 text-xs font-bold">
                        {!payment.isDefault && <button onClick={() => setDefaultPayment(payment._id)} className="text-primary">Set default</button>}
                        <button onClick={() => deletePayment(payment._id)} className="text-red-500">Delete</button>
                      </div>
                    </div>
                  ))}
                  {!profile?.paymentMethods?.length && <p className="text-sm text-slate-400">No saved payment methods yet.</p>}
                </div>
                <form onSubmit={addPayment} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <select className={inputBase} value={paymentForm.type} onChange={(e) => setPaymentForm({ ...emptyPayment, type: e.target.value })}>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                  </select>
                  <input className={inputBase} placeholder="Label" value={paymentForm.label} onChange={(e) => setPaymentForm({ ...paymentForm, label: e.target.value })} />
                  {paymentForm.type === 'card' ? (
                    <input maxLength="4" className={inputBase} placeholder="Last 4 digits only" value={paymentForm.last4} onChange={(e) => setPaymentForm({ ...paymentForm, last4: e.target.value.replace(/\D/g, '') })} />
                  ) : (
                    <input className={inputBase} placeholder="name@upi" value={paymentForm.upiId} onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })} />
                  )}
                  <label className="flex items-center gap-2 font-bold text-slate-600"><input type="checkbox" className="accent-primary" checked={paymentForm.isDefault} onChange={(e) => setPaymentForm({ ...paymentForm, isDefault: e.target.checked })} /> Set as default</label>
                  <button className="btn-primary">Add Payment</button>
                </form>
              </section>
            )}

            {/* ── My Orders view (reuses this same profile layout + sidebar) ── */}
            {section === 'orders' && <Orders embedded />}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
