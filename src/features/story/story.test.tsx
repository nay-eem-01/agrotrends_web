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
  const api = mockApi({ 'GET /api/blogs/slug/rice-blast-and-nitrogen': () => envelope(200, story) })
  renderWithProviders(<App />, '/stories/rice-blast-and-nitrogen')

  expect(await screen.findByRole('heading', { level: 1, name: 'Rice blast and nitrogen' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Nasrin Akter' })).toHaveAttribute('href', '/authors/1')
  expect(screen.getByText(/4 min read/)).toHaveTextContent('4 min read · Oct 6 · in Crop diseases')
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
  expect(api).toHaveBeenCalledOnce()
})

test('farming context and tags link to filtered lists', async () => {
  mockApi({ 'GET /api/blogs/slug/rice-blast-and-nitrogen': () => envelope(200, story) })
  renderWithProviders(<App />, '/stories/rice-blast-and-nitrogen')

  const farming = await screen.findByRole('region', { name: 'Farming context' })
  expect(within(farming).getByRole('link', { name: /Crop\s*boro rice/ })).toHaveAttribute('href', '/?crop=boro+rice')
  expect(within(farming).getByRole('link', { name: /Season\s*Rabi/ })).toHaveAttribute('href', '/?season=RABI')
  expect(within(farming).getByRole('link', { name: /Soil\s*Clay loam/ })).toHaveAttribute('href', '/?soil=CLAY_LOAM')
  const tags = screen.getByRole('region', { name: 'Tags' })
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
