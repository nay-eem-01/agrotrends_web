import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import type { BlogResponse } from '../../api/types'
import App from '../../App'
import { envelope, mockApi } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const story: BlogResponse = {
  id: 402,
  slug: 'rice-blast-and-nitrogen',
  title: 'Rice blast and nitrogen',
  content:
    '<h2>Why it matters</h2><p>Too much <strong>nitrogen</strong> makes blast worse.</p>' +
    '<img src="x" onerror="window.__pwned=1"><script>window.__pwned=2</script>' +
    '<p><a href="https://dae.gov.bd">DAE advice</a> and <a href="javascript:alert(1)">bad</a></p>',
  imageUrl: '/uploads/cover.jpg',
  readingTimeMinutes: 4,
  tags: ['rice blast', 'nitrogen'],
  agri: { crop: 'boro rice', season: 'RABI', region: 'rangpur', soil: 'CLAY_LOAM' },
  category: { id: 1, categoryName: 'Crop diseases' },
  author: { authorId: 1, name: 'Nasrin Akter' },
  status: 'PUBLISHED',
  publishedAt: '2026-10-06T06:00:00Z',
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('a story shows its title, author, details and cleaned body', async () => {
  const api = mockApi({
    'GET /api/blogs/slug/rice-blast-and-nitrogen': () => envelope(200, story),
    'GET /api/comments/blog/402': () => envelope(200, []),
  })
  renderWithProviders(<App />, '/stories/rice-blast-and-nitrogen')

  expect(await screen.findByRole('heading', { level: 1, name: 'Rice blast and nitrogen' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Nasrin Akter' })).toHaveAttribute('href', '/authors/1')
  expect(screen.getByText('4 min read · Oct 6')).toBeInTheDocument()
  expect(screen.getByText('Crop diseases')).toBeInTheDocument()
  // After Medium: headline, byline and actions come before the cover.
  const title = screen.getByRole('heading', { level: 1 })
  const cover = document.querySelector('figure img')
  expect(cover).not.toBeNull()
  expect(title.compareDocumentPosition(cover!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(screen.getByRole('heading', { level: 2, name: 'Why it matters' })).toBeInTheDocument()
  expect(screen.getByText('nitrogen', { selector: 'strong' })).toBeInTheDocument()

  const external = screen.getByRole('link', { name: 'DAE advice' })
  expect(external).toHaveAttribute('rel', 'noopener noreferrer nofollow')
  expect(external).toHaveAttribute('target', '_blank')
  expect(screen.getByText('bad')).not.toHaveAttribute('href')
  expect(document.querySelector('script')).toBeNull()
  expect(document.querySelector('[onerror]')).toBeNull()
  expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined()
  expect(document.title).toBe('Rice blast and nitrogen – AgroTrends')
  expect(api.mock.calls.filter(([url]) => String(url).startsWith('/api/blogs/slug/'))).toHaveLength(1)
})

test('farming context and tags link to filtered lists', async () => {
  mockApi({ 'GET /api/blogs/slug/rice-blast-and-nitrogen': () => envelope(200, story) })
  renderWithProviders(<App />, '/stories/rice-blast-and-nitrogen')

  const farming = await screen.findByRole('region', { name: 'Farming context' })
  expect(within(farming).getByRole('link', { name: /Crop\s*boro rice/ })).toHaveAttribute('href', '/stories?crop=boro+rice')
  expect(within(farming).getByRole('link', { name: /Season\s*Rabi/ })).toHaveAttribute('href', '/stories?season=RABI')
  expect(within(farming).getByRole('link', { name: /Soil\s*Clay loam/ })).toHaveAttribute('href', '/stories?soil=CLAY_LOAM')
  const tags = screen.getByRole('list', { name: 'Tags' })
  expect(within(tags).getByRole('link', { name: 'rice blast' })).toHaveAttribute('href', '/tags/rice%20blast')
})

test('a plain-text story is shown as paragraphs', async () => {
  mockApi({
    'GET /api/blogs/slug/old': () => envelope(200, { ...story, slug: 'old', content: 'Yield < 5 t/ha here.\n\nSecond one.', tags: [], agri: {} }),
  })
  renderWithProviders(<App />, '/stories/old')

  expect(await screen.findByText('Yield < 5 t/ha here.')).toBeInTheDocument()
  expect(screen.getByText('Second one.')).toBeInTheDocument()
  expect(screen.queryByRole('region', { name: 'Tags' })).not.toBeInTheDocument()
})

test('a missing or unpublished story is not found', async () => {
  const api = mockApi({ 'GET /api/blogs/slug/gone': () => envelope(404, null, 'Blog not found.') })
  renderWithProviders(<App />, '/stories/gone')

  expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  expect(api).toHaveBeenCalledOnce()
})

test('an author sees their own draft marked as one', async () => {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  const api = mockApi({
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 1, name: 'Nasrin Akter' } }),
    'GET /api/blogs/slug/draft': () => envelope(200, { ...story, slug: 'draft', status: 'DRAFT' }),
  })
  renderWithProviders(<App />, '/stories/draft')

  expect(await screen.findByText('Draft — only you can see this')).toBeInTheDocument()
  const read = api.mock.calls.find(([url]) => String(url) === '/api/blogs/slug/draft')!
  expect((read[1]!.headers as Record<string, string>).Authorization).toBe('Bearer a1')
})

test('the byline offers Follow for the author, as on Medium', async () => {
  mockApi({
    'GET /api/blogs/slug/rice-blast-and-nitrogen': () => envelope(200, story),
    'GET /api/comments/blog/402': () => envelope(200, []),
    'GET /api/authors/1': () => envelope(200, { authorId: 1, name: 'Nasrin Akter', followerCount: 12, followedByMe: false }),
  })
  renderWithProviders(<App />, '/stories/rice-blast-and-nitrogen')

  const title = await screen.findByRole('heading', { level: 1 })
  const follow = (await screen.findAllByRole('button', { name: 'Follow Nasrin Akter' }))[0]
  // The first Follow is the byline's, above the story text.
  expect(title.compareDocumentPosition(follow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(follow.compareDocumentPosition(screen.getByText(/nitrogen/i, { selector: 'strong' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

test('the subtitle sits under the title', async () => {
  mockApi({
    'GET /api/blogs/slug/rice-blast-and-nitrogen': () => envelope(200, { ...story, subtitle: 'Why split doses beat one big one' }),
    'GET /api/comments/blog/402': () => envelope(200, []),
  })
  renderWithProviders(<App />, '/stories/rice-blast-and-nitrogen')

  const title = await screen.findByRole('heading', { level: 1, name: 'Rice blast and nitrogen' })
  const subtitle = screen.getByText('Why split doses beat one big one')
  expect(title.nextElementSibling).toBe(subtitle)
})
