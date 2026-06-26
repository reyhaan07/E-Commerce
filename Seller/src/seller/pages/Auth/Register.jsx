import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Register(){
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e){
    e.preventDefault()
    // mock register -> navigate to dashboard
    try{ localStorage.setItem('seller_user', JSON.stringify({ id: Date.now(), email, name })) }catch(e){}
    navigate('/seller')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md bg-white/5 p-8 rounded-2xl glass">
        <h2 className="text-2xl font-semibold mb-4">Create an account</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm text-white/70">Full name</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="w-full mt-1 p-2 rounded bg-white/5" placeholder="Jane Doe" required />
          </div>
          <div>
            <label className="text-sm text-white/70">Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="w-full mt-1 p-2 rounded bg-white/5" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="text-sm text-white/70">Password</label>
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full mt-1 p-2 rounded bg-white/5" placeholder="••••••••" required />
          </div>
          <button type="submit" className="w-full py-2 rounded bg-teal-500 hover:bg-teal-600">Register</button>
        </form>
        <p className="mt-4 text-sm text-white/70">Already have an account? <Link to="/login" className="text-teal-300">Sign in</Link></p>
      </div>
    </div>
  )
}
