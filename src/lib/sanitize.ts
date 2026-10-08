import DOMPurify from 'dompurify'

const purify = DOMPurify()

// Links in user content open safely; anything not http(s), mailto or a same-site path loses its href.
purify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    const href = node.getAttribute('href') ?? ''
    if (href && !/^(https?:|mailto:|\/(?!\/)|#)/i.test(href)) node.removeAttribute('href')
    if (/^https?:/i.test(href)) {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer nofollow')
    }
  }
})

/** Story and comment HTML, cleaned: no scripts, handlers, styles, frames or forms. */
export function sanitizeHtml(html: string): string {
  return purify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['style', 'class', 'id'],
    ADD_ATTR: ['target'],
  })
}

/** Older stories were saved as plain text; they have no tags at all. */
export function looksLikeHtml(text: string): boolean {
  return /<\/?[a-z][\s\S]*?>/i.test(text)
}
