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
