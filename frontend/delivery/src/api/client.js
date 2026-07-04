const API_BASE = 'http://localhost:5000/api'

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await response.json()
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Request failed')
  }
  return data
}
