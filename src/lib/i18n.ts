import { useSyncExternalStore } from 'react'
import { BN } from './bn'

export type Lang = 'en' | 'bn'

const KEY = 'agrotrends.lang'
const listeners = new Set<() => void>()

function read(): Lang {
  try {
    return localStorage.getItem(KEY) === 'bn' ? 'bn' : 'en'
  } catch {
    return 'en'
  }
}

let current: Lang = read()
if (typeof document !== 'undefined') document.documentElement.lang = current

export function getLang(): Lang {
  return current
}

export function setLang(lang: Lang): void {
  current = lang
  try {
    localStorage.setItem(KEY, lang)
  } catch {
    // Kept for this visit only.
  }
  document.documentElement.lang = lang
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, getLang)
}

/**
 * Interface text in the reader's language. Keyed by the English text, so anything not yet translated stays English.
 * `{name}` placeholders are filled from `values`.
 */
export function translate(lang: Lang, text: string, values?: Record<string, string | number>): string {
  const template = lang === 'bn' ? (BN[text] ?? text) : text
  return values ? template.replace(/\{(\w+)\}/g, (_match: string, key: string) => String(values[key] ?? '')) : template
}

export function useT() {
  const lang = useLang()
  return (text: string, values?: Record<string, string | number>) => translate(lang, text, values)
}

/** Digits in the reader's script (Bengali digits for bn). */
export function formatNumber(n: number, lang: Lang = current): string {
  return n.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')
}
