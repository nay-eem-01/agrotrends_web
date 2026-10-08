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
