const API_BASE = 'http://localhost:5000/api'

function getToken() {
  try {
    return JSON.parse(localStorage.getItem('seller_user'))?.token || null
  } catch (e) {
    return null
  }
}

export async function apiRequest(path, options = {}) {
  const token = getToken()
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })
  const data = await response.json()
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Request failed')
  }
  return data
}
