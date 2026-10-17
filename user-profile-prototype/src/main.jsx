import React from 'react'
import { createRoot } from 'react-dom/client'
import ProfilePage from './pages/ProfilePage'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ProfilePage />
  </React.StrictMode>
)
