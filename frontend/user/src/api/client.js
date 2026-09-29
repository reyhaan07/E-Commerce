const API_BASE = 'http://localhost:5000/api';

function getToken() {
  try {
    return JSON.parse(localStorage.getItem('user_user'))?.token || null;
  } catch (e) {
    return null;
  }
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const data = await response.json();

  // Session missing/expired: clear it and send the user to the shared login to
  // re-authenticate (and come straight back), instead of stranding them on a
  // raw "Missing or invalid Authorization header" error with a stuck page.
  if (response.status === 401) {
    try { localStorage.removeItem('user_user'); } catch (e) { /* ignore */ }
    const redirect = encodeURIComponent(window.location.href);
    window.location.href = `http://localhost:5177?role=user&redirect=${redirect}`;
    throw new Error('Your session has expired — please sign in again.');
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}
