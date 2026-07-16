import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'user_user'
const EXPECTED_ROLE = 'user'

// Consumes the auth handoff appended to the URL by the shared login page
// (the frontend/login role-picker app) after a successful cross-origin
// login, since localStorage can't be shared across dev-server ports.
// Includes the JWT (authToken) the backend returns from /api/login, which
// is required for the /api/users/:id and /api/orders?userId= routes.
function consumeAuthHandoff() {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('authId')
  const role = params.get('authRole')
  if (!id || role !== EXPECTED_ROLE) return

  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    id,
    name: params.get('authName') || '',
    email: params.get('authEmail') || '',
    token: params.get('authToken') || null,
  }))

  params.delete('authId')
  params.delete('authName')
  params.delete('authEmail')
  params.delete('authRole')
  params.delete('authToken')
  const query = params.toString()
  window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash)
}

export function useAuth() {
  const [user, setUser] = useState(() => {
    consumeAuthHandoff()
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch (e) { return null }
  })

  useEffect(() => {
    const onStorage = e => { if (e.key === STORAGE_KEY) setUser(JSON.parse(e.newValue)) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = useCallback((payload) => {
    const u = { id: payload.id, name: payload.name, email: payload.email, token: payload.token || null }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  return { user, login, logout }
}

export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch (e) { return null }
}
