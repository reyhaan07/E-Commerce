import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'delivery' }),
      })

      const result = await response.json()

      if (result.success) {
        login({ id: result.id, name: result.name, email })
        navigate('/delivery/dashboard', { replace: true })
        return
      }

      alert(result.message || 'Invalid email or password')
    } catch (error) {
      alert('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md glass p-8" style={{ borderRadius: 24 }}>
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
            S
          </div>
          <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            Shop<span style={{ color: 'var(--accent)' }}>Sphere</span>
          </p>
          <h2 className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>Delivery Partner Login</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Sign in to view your assigned deliveries</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>Email</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              className="input"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>Password</label>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              className="input"
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Demo account: delivery@shopsphere.com / delivery123
        </p>
      </div>
    </div>
  )
}
