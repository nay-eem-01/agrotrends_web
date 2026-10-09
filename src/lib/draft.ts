/** An unsaved story kept on this device until it becomes a server draft (that needs a category, chosen at publish). */
export interface LocalDraft {
  title: string
  html: string
  savedAt: number
}

const KEY = 'agrotrends.draft.new'

export function loadLocalDraft(): LocalDraft | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as LocalDraft) : null
  } catch {
    return null
  }
}

export function saveLocalDraft(draft: Omit<LocalDraft, 'savedAt'>, now = Date.now()): LocalDraft {
  const saved = { ...draft, savedAt: now }
  try {
    if (isBlank(draft)) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, JSON.stringify(saved))
  } catch {
    // Storage blocked or full: the draft lives until the tab closes.
  }
  return saved
}

export function clearLocalDraft(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing to clear.
  }
}

/** Tiptap's empty document is "<p></p>". */
export function isBlank({ title, html }: { title: string; html: string }): boolean {
  return !title.trim() && !html.replace(/<[^>]*>/g, '').trim() && !/<img/i.test(html)
}
