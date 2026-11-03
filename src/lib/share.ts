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

/**
 * Where the backend serves link previews (B7): `/share/questions/{id}` and `/share/stories/{slug}` pages that carry the
 * post's own title, text and picture for Facebook, WhatsApp and the rest, then send people on to the app. Empty means
 * the web's own origin, where the host proxies `/share` as it does `/api`; set it to the API's address to link there.
 */
const SHARE_BASE: string = import.meta.env?.VITE_SHARE_BASE_URL ?? ''

/**
 * The address to share for an app path, without the query or hash a reader happened to have open. Questions and
 * stories go to their preview page; anything else (a profile) is the app's own address.
 */
export function shareUrl(path: string, origin = window.location.origin, shareBase = SHARE_BASE): string {
  const address = new URL(path, origin)
  const post = /^\/(questions\/\d+|stories\/[^/]+)$/.exec(address.pathname)
  if (!post) return address.origin + address.pathname
  return `${(shareBase || address.origin).replace(/\/$/, '')}/share/${post[1]}`
}
