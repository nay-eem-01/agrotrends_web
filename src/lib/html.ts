const BLOCK_END = /<\/(p|div|h[1-6]|li|blockquote|pre|figcaption)>|<br\s*\/?>/gi

/**
 * The readable text of story HTML, for excerpts and previews. Parsed with DOMParser, which never runs scripts or
 * loads images; block ends become spaces so paragraphs don't run together.
 */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html.replace(BLOCK_END, '$& '), 'text/html')
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/** Cut at a word boundary near `max` characters and add an ellipsis. */
export function excerpt(text: string, max = 160): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:!?-]+$/, '')}…`
}

/** Older plain-text questions as paragraphs for the rich editor; HTML is returned as it is. */
export function textToHtml(text: string | null | undefined): string {
  if (!text) return ''
  if (/<\/?[a-z][\s\S]*?>/i.test(text)) return text
  const escape = (line: string) => line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escape(line)}</p>`)
    .join('')
}

/**
 * The advisor's citation markers ("[1]", "[2] [3]") as small numbered marks that point at its sources. Only numbers
 * that have a source are marked; anything else is left as written. The result still goes through SafeHtml (which drops classes, so the container styles the marks).
 */
export function withCitations(text: string | null | undefined, sources: number): string {
  if (!text) return ''
  return text.replace(/\[(\d{1,2})\]/g, (marker, n: string) =>
    Number(n) >= 1 && Number(n) <= sources ? `<sup aria-label="source ${n}">${n}</sup>` : marker,
  )
}
