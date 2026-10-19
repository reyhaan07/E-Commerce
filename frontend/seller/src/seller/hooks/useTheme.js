import { useCallback, useEffect, useState } from 'react'

// Light/dark theme for the seller module. The choice is stamped onto
// <html data-theme="…">, which the token layer in styles/index.css reads.
// Preference persists in localStorage; first-ever visit follows the OS.

const STORAGE_KEY = 'seller_theme'

function osPrefersDark() {
  return typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveInitialTheme() {
  return 'light'
}

// Called once from main.jsx before React renders. Always light mode.
export function applyInitialTheme() {
  document.documentElement.setAttribute('data-theme', 'light')
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  return 'light'
}

export function useTheme() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light')
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }, [])

  return { theme: 'light', toggle: () => {}, setTheme: () => {}, isDark: false }
}

