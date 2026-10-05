import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { useAuth } from './useAuth'

// Re-reads the signed-in customer's account status from the server.
//
// Suspension only blocks the next *login*, and the JWT stays valid for 7 days
// after an admin acts — so without this the storefront would keep looking
// normal to someone whose account was suspended mid-session, and they'd only
// find out when checkout came back 403. Polled on mount and on navigation so
// the banner appears without the customer having to reload.
export function useAccountStatus() {
  const { user } = useAuth()
  const [status, setStatus] = useState('active')
  const [checked, setChecked] = useState(!user)

  // a signed-out visitor has nothing to check — reset during render
  const [prevUser, setPrevUser] = useState(user)
  if (prevUser !== user) {
    setPrevUser(user)
    if (!user) { setStatus('active'); setChecked(true) }
  }

  useEffect(() => {
    if (!user) return
    let cancelled = false
    apiRequest('/users/me')
      .then((d) => { if (!cancelled) setStatus(d.user?.status || 'active') })
      .catch(() => { /* offline or expired token — leave the storefront usable */ })
      .finally(() => { if (!cancelled) setChecked(true) })
    return () => { cancelled = true }
  }, [user])

  return { status, checked, suspended: status !== 'active' }
}
