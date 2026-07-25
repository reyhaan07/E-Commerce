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
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* ignore */ }
  return osPrefersDark() ? 'dark' : 'light'
}

// Called once from main.jsx before React renders, so there's no flash.
export function applyInitialTheme() {
  const theme = resolveInitialTheme()
  document.documentElement.setAttribute('data-theme', theme)
  return theme
}

export function useTheme() {
  const [theme, setThemeState] = useState(resolveInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* ignore */ }
  }, [theme])

  const setTheme = useCallback((next) => setThemeState(next === 'dark' ? 'dark' : 'light'), [])
  const toggle = useCallback(() => setThemeState(t => (t === 'dark' ? 'light' : 'dark')), [])

  return { theme, toggle, setTheme, isDark: theme === 'dark' }
}
