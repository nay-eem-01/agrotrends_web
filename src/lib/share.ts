/** Where a page can be shared from the web; the phone's own share sheet covers the rest (Instagram among them). */
export type ShareTarget = 'facebook' | 'messenger' | 'whatsapp' | 'x' | 'linkedin' | 'telegram' | 'email'

export interface ShareLink {
  target: ShareTarget
  label: string
  href: string
}

/**
 * Each service's own share address for `url`, titled `title`. Messenger has no web address without a Facebook app
 * id, so it is offered only where its app can open (`touch`).
 */
export function shareLinks(url: string, title: string, { touch = false } = {}): ShareLink[] {
  const u = encodeURIComponent(url)
  const withTitle = encodeURIComponent(`${title} ${url}`)
  const links: (ShareLink | false)[] = [
    { target: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    touch && { target: 'messenger', label: 'Messenger', href: `fb-messenger://share/?link=${u}` },
    { target: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${withTitle}` },
    { target: 'x', label: 'X', href: `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${u}` },
    { target: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { target: 'telegram', label: 'Telegram', href: `https://t.me/share/url?url=${u}&text=${encodeURIComponent(title)}` },
    { target: 'email', label: 'E-mail', href: `mailto:?subject=${encodeURIComponent(title)}&body=${u}` },
  ]
  return links.filter((link): link is ShareLink => Boolean(link))
}

/** The full address of an app path, without the query or hash a reader happened to have open. */
export function shareUrl(path: string, origin = window.location.origin): string {
  const address = new URL(path, origin)
  return address.origin + address.pathname
}
