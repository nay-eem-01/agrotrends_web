import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'agrotrends.theme'
const listeners = new Set<() => void>()
const media = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null

function stored(): Theme | null {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'dark' || value === 'light' ? value : null
  } catch {
    return null
  }
}

/** The theme in effect: the reader's choice, else the system's. */
export function getTheme(): Theme {
  return stored() ?? (media?.matches ? 'dark' : 'light')
}

/** Choosing the system's own theme clears the choice, so the page follows the system again. */
export function setTheme(theme: Theme): void {
  const system: Theme = media?.matches ? 'dark' : 'light'
  try {
    if (theme === system) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, theme)
  } catch {
    // Kept for this visit only.
  }
  if (theme === system) delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = theme
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  media?.addEventListener('change', listener)
  return () => {
    listeners.delete(listener)
    media?.removeEventListener('change', listener)
  }
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => 'light')
}
