import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'seller_user'

export function useAuth(){
  const [user, setUser] = useState(()=>{
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY))}catch(e){return null}
  })

  useEffect(()=>{
    const onStorage = e=>{ if(e.key===STORAGE_KEY) setUser(JSON.parse(e.newValue)) }
    window.addEventListener('storage', onStorage)
    return ()=>window.removeEventListener('storage', onStorage)
  },[])

  const login = useCallback((payload)=>{
    const u = {id: Date.now(), name: payload.name||payload.email.split('@')[0], email: payload.email}
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    setUser(u)
    return u
  },[])

  const logout = useCallback(()=>{
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  },[])

  return { user, login, logout }
}

export function getCurrentUser(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY))}catch(e){return null}
}
