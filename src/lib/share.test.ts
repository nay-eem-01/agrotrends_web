import { expect, test } from 'vitest'
import { shareLinks, shareUrl } from './share'

const url = 'https://agrotrends.app/questions/5'
const title = 'Why are my tilapia gasping? ধান & মাছ'

test('every service gets the address and title encoded its own way', () => {
  const links = Object.fromEntries(shareLinks(url, title).map((link) => [link.target, link.href]))
  expect(links.facebook).toBe('https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fagrotrends.app%2Fquestions%2F5')
  expect(new URL(links.whatsapp).searchParams.get('text')).toBe(`${title} ${url}`)
  expect(new URL(links.x).searchParams.get('text')).toBe(title)
  expect(new URL(links.x).searchParams.get('url')).toBe(url)
  expect(new URL(links.linkedin).searchParams.get('url')).toBe(url)
  expect(new URL(links.telegram).searchParams.get('url')).toBe(url)
  expect(links.email).toBe(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`)
})

test('Messenger is offered only on touch devices, where its app can open the link', () => {
  expect(shareLinks(url, title).map((link) => link.target)).not.toContain('messenger')
  expect(shareLinks(url, title, { touch: true }).map((link) => link.target)).toEqual(['facebook', 'messenger', 'whatsapp', 'x', 'linkedin', 'telegram', 'email'])
})

test('questions and stories are shared as their link-preview page, without the query or hash', () => {
  expect(shareUrl('/questions/5?ref=feed#your-answer', 'https://agrotrends.app', '')).toBe('https://agrotrends.app/share/questions/5')
  expect(shareUrl('/stories/keeping-oxygen-up', 'https://agrotrends.app', '')).toBe('https://agrotrends.app/share/stories/keeping-oxygen-up')
  // On the API's own domain when the build says so.
  expect(shareUrl('/questions/5', 'https://agrotrends.app', 'https://api.agrotrends.app/')).toBe('https://api.agrotrends.app/share/questions/5')
})

test('anything else is shared as the app address', () => {
  expect(shareUrl('/users/7?tab=answers', 'https://agrotrends.app', 'https://api.agrotrends.app')).toBe('https://agrotrends.app/users/7')
})
