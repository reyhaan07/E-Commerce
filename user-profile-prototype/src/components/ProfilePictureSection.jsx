import React, { useRef } from 'react'
import { FiImage, FiTrash2 } from 'react-icons/fi'

// Avatar + upload / remove / paste-URL. All local — reads the picked file as a
// data URL for preview; no upload happens.
export default function ProfilePictureSection({ initials, avatarUrl, onChange, disabled }) {
  const fileRef = useRef(null)

  function pickFile(file) {
    if (!file) return
    if (file.size > 1024 * 1024) { alert('Please choose an image under 1MB.'); return }
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <div className="subhead">Profile Picture</div>
      <div className="pic-row">
        <div className="pic-avatar">
          {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="pic-actions">
            <button className="btn btn-soft btn-sm" disabled={disabled} onClick={() => fileRef.current?.click()}>
              <FiImage size={16} /> Upload Image
            </button>
            <button className="btn btn-outline btn-sm" disabled={disabled || !avatarUrl} onClick={() => onChange('')}>
              <FiTrash2 size={15} /> Remove
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden
              onChange={(e) => pickFile(e.target.files?.[0])} />
          </div>
          <p className="help">PNG, JPG, or WebP under 1MB. You can also paste an image URL below.</p>
          <input
            className="input"
            style={{ marginTop: 10, height: 44 }}
            placeholder="https://..."
            value={avatarUrl?.startsWith('data:') ? '' : (avatarUrl || '')}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
