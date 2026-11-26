/** The longest title a question may have (the ask form's limit). */
export const TITLE_MAX = 200

/**
 * Turns what someone typed into the Discover ask box into the ask form's title and details: the first line is the
 * title; past 200 characters the title stops at the first sentence (or the last whole word) and the rest moves into
 * the details, so nothing typed is lost.
 */
export function splitAskDraft(text: string): { title: string; details: string } {
  const [first = '', ...rest] = text.trim().split(/\n+/)
  let title = first.trim()
  let details = rest.join('\n').trim()
  if (title.length > TITLE_MAX) {
    const sentence = /^(.{10,200}?[?.!।])\s/u.exec(title)
    const cut = sentence ? sentence[1] : title.slice(0, TITLE_MAX).replace(/\s+\S*$/u, '')
    details = [title.slice(cut.length).trim(), details].filter(Boolean).join('\n')
    title = cut
  }
  return { title, details }
}

export interface StoredQuestionDraft {
  title: string
  details: string
  categoryId?: number
  categoryName?: string
  tags: string[]
  imageUrls: string[]
  place: string | null
  audience: 'public' | 'private'
  source?: string
}

export function readQuestionDraft(key: string): StoredQuestionDraft | undefined {
  try {
    const draft = JSON.parse(localStorage.getItem(key) ?? 'null')
    return draft && typeof draft.title === 'string' && typeof draft.details === 'string' && Array.isArray(draft.tags) && Array.isArray(draft.imageUrls)
      ? draft : undefined
  } catch {
    return undefined
  }
}

export function writeQuestionDraft(key: string, draft?: StoredQuestionDraft) {
  try {
    if (draft) localStorage.setItem(key, JSON.stringify(draft))
    else localStorage.removeItem(key)
  } catch {
    // The form is still editable when device storage is blocked or full.
  }
}
