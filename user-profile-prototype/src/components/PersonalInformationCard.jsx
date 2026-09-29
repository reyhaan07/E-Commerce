import React from 'react'
import { FiEdit2, FiSave, FiMail } from 'react-icons/fi'
import ProfilePictureSection from './ProfilePictureSection'
import NotificationCard from './NotificationCard'

const MAX_INSTRUCTIONS = 500

export default function PersonalInformationCard({
  form, setField, editing, onToggleEdit, onSave,
  initials, avatarUrl, onAvatarChange,
  emailNotif, smsNotif, setEmailNotif, setSmsNotif, email,
}) {
  return (
    <section className="card section">
      {/* Header */}
      <div className="section-head">
        <h2 className="section-title">Personal Information</h2>
        <button className={`btn ${editing ? 'btn-soft' : 'btn-outline'} btn-sm`} onClick={onToggleEdit}>
          <FiEdit2 size={15} /> {editing ? 'Editing…' : 'Edit Profile'}
        </button>
      </div>
      <div className="section-rule" />

      {/* Name + phone */}
      <div className="grid-2">
        <div>
          <label className="field-label">Full Name</label>
          <input className="input" value={form.name} disabled={!editing}
            onChange={(e) => setField('name', e.target.value)} />
        </div>
        <div>
          <label className="field-label">Phone</label>
          <input className="input" value={form.phone} disabled={!editing}
            onChange={(e) => setField('phone', e.target.value)} />
        </div>
      </div>

      {/* Profile picture */}
      <div style={{ marginTop: 24 }}>
        <ProfilePictureSection initials={initials} avatarUrl={avatarUrl} onChange={onAvatarChange} disabled={!editing} />
      </div>

      {/* Delivery instructions */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <label className="field-label" style={{ marginBottom: 8 }}>Delivery Instructions</label>
          <span className="counter">{form.deliveryInstructions.length}/{MAX_INSTRUCTIONS}</span>
        </div>
        <textarea
          className="textarea"
          maxLength={MAX_INSTRUCTIONS}
          placeholder="Add any delivery instructions for your orders..."
          value={form.deliveryInstructions}
          disabled={!editing}
          onChange={(e) => setField('deliveryInstructions', e.target.value)}
        />
      </div>

      {/* Notifications */}
      <div style={{ marginTop: 24 }}>
        <div className="subhead">Notifications</div>
        <div className="notif-grid">
          <NotificationCard type="email" title="Email notifications"
            description="Receive order updates and important alerts via email."
            checked={emailNotif} onToggle={setEmailNotif} disabled={!editing} />
          <NotificationCard type="sms" title="SMS notifications"
            description="Receive order updates via SMS."
            checked={smsNotif} onToggle={setSmsNotif} disabled={!editing} />
        </div>
      </div>

      {/* Footer */}
      <div className="section-foot">
        <div className="foot-email"><FiMail size={14} style={{ verticalAlign: '-2px', marginRight: 6, color: 'var(--muted)' }} />Email: <b>{email}</b></div>
        <button className="btn btn-primary" onClick={onSave}><FiSave size={16} /> Save Profile</button>
      </div>
    </section>
  )
}
