import React, { useState, useEffect } from 'react'
import { FiCheckCircle, FiMenu, FiShoppingBag, FiMapPin, FiCreditCard } from 'react-icons/fi'
import ProfileHeader from '../components/ProfileHeader'
import ProfileSidebar from '../components/ProfileSidebar'
import ProfileHero from '../components/ProfileHero'
import PersonalInformationCard from '../components/PersonalInformationCard'
import { demoUser } from '../data'

const PLACEHOLDERS = {
  orders:    { icon: FiShoppingBag, title: 'My Orders',    text: 'Your order history will appear here.' },
  addresses: { icon: FiMapPin,      title: 'Address Book', text: 'Saved delivery addresses will appear here.' },
  payments:  { icon: FiCreditCard,  title: 'Payments',     text: 'Saved cards and payment methods will appear here.' },
}

export default function ProfilePage() {
  const [active, setActive] = useState('profile')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [toast, setToast] = useState('')

  const [form, setForm] = useState({
    name: demoUser.name,
    phone: demoUser.phone,
    deliveryInstructions: demoUser.deliveryInstructions,
  })
  const [avatarUrl, setAvatarUrl] = useState(demoUser.avatarUrl)
  const [emailNotif, setEmailNotif] = useState(true)
  const [smsNotif, setSmsNotif] = useState(false)

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(t)
  }, [toast])

  function handleNavigate(key) {
    setActive(key)
    setDrawerOpen(false)
  }
  function handleSave() {
    setEditing(false)
    setToast('Profile saved')
  }
  function handleLogout() {
    setDrawerOpen(false)
    setToast('Logged out (prototype)')
  }

  const ph = PLACEHOLDERS[active]

  return (
    <div className="page">
      <ProfileHeader onOpenMenu={() => setDrawerOpen(true)} cartCount={3} />

      {/* Mobile drawer overlay */}
      <div className={`overlay${drawerOpen ? ' show' : ''}`} onClick={() => setDrawerOpen(false)} />

      <div className="shell">
        <ProfileSidebar
          user={{ ...demoUser, name: form.name }}
          avatarUrl={avatarUrl}
          activeKey={active}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          open={drawerOpen}
        />

        <main className="main">
          {/* Mobile-only account menu opener */}
          <div className="mobile-account-bar">
            <button className="btn btn-outline btn-sm" onClick={() => setDrawerOpen(true)}>
              <FiMenu size={16} /> Account menu
            </button>
          </div>

          {active === 'profile' ? (
            <>
              <ProfileHero name={form.name} />
              <PersonalInformationCard
                form={form}
                setField={setField}
                editing={editing}
                onToggleEdit={() => setEditing((e) => !e)}
                onSave={handleSave}
                initials={demoUser.initials}
                avatarUrl={avatarUrl}
                onAvatarChange={setAvatarUrl}
                emailNotif={emailNotif}
                smsNotif={smsNotif}
                setEmailNotif={setEmailNotif}
                setSmsNotif={setSmsNotif}
                email={demoUser.email}
              />
            </>
          ) : (
            <section className="card placeholder">
              <div className="p-ico"><ph.icon size={26} /></div>
              <h3>{ph.title}</h3>
              <p>{ph.text}</p>
            </section>
          )}
        </main>
      </div>

      {toast && (
        <div className="toast">
          <span className="t-ico"><FiCheckCircle size={18} /></span>{toast}
        </div>
      )}
    </div>
  )
}
