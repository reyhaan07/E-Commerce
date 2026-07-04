import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e){
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role: 'seller',
        }),
      })

      const result = await response.json()

      if (result.success) {
        window.location.href = 'http://localhost:5174'
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md bg-white/5 p-8 rounded-2xl glass">
        <h2 className="text-2xl font-semibold mb-4">Sign in to your account</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm text-white/70">Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="w-full mt-1 p-2 rounded bg-white/5" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="text-sm text-white/70">Password</label>
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full mt-1 p-2 rounded bg-white/5" placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-70">{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <p className="mt-4 text-sm text-white/70">Don't have an account? <Link to="/register" className="text-blue-300">Register</Link></p>
      </div>
    </div>
  )
}
