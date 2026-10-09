import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import type { BlogResponse } from '../../api/types'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

function story(id: number, title: string): BlogResponse {
  return { id, slug: `s-${id}`, title, content: '<p>x</p>', author: { authorId: 1, name: 'Nasrin' }, agri: {} }
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('results show matching topics and stories', async () => {
  const api = mockApi({
    'GET /api/blogs/search': () => envelope(200, { ...page([story(1, 'Rice blast and nitrogen'), story(2, 'Boro rice')]), totalElements: 2 }),
    'GET /api/tags': () => envelope(200, ['rice', 'rice blast']),
  })
  renderWithProviders(<App />, '/search?q=Rice')

  expect(await screen.findByRole('link', { name: 'Rice blast and nitrogen' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Results for Rice')
  expect(screen.getByText('2 stories')).toBeInTheDocument()
  const topics = await screen.findByRole('region', { name: 'Matching topics' })
  expect(within(topics).getByRole('link', { name: 'rice blast' })).toHaveAttribute('href', '/tags/rice%20blast')
  const searchCall = api.mock.calls.map(([url]) => new URL(String(url), 'http://x')).find((url) => url.pathname === '/api/blogs/search')!
  expect(searchCall.searchParams.get('q')).toBe('Rice')
  expect(api.mock.calls.some(([url]) => String(url) === '/api/tags?q=rice')).toBe(true)
})

test('no results suggest asking instead', async () => {
  mockApi({ 'GET /api/blogs/search': () => envelope(200, page([])), 'GET /api/tags': () => envelope(200, []) })
  renderWithProviders(<App />, '/search?q=quinoa')

  expect(await screen.findByRole('heading', { name: 'No stories match “quinoa”' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Ask a question' })).toHaveAttribute('href', '/questions')
})

test('an empty search asks for words and offers topics, without searching', async () => {
  const api = mockApi({ 'GET /api/tags': () => envelope(200, ['jute']) })
  renderWithProviders(<App />, '/search')

  expect(screen.getByRole('heading', { name: 'Search AgroTrends' })).toBeInTheDocument()
  expect(await screen.findByRole('link', { name: 'jute' })).toBeInTheDocument()
  expect(api.mock.calls.some(([url]) => String(url).startsWith('/api/blogs/search'))).toBe(false)
})

test('searching again from the page updates the URL and results', async () => {
  mockApi({
    'GET /api/blogs/search': (url) => envelope(200, page([story(1, `About ${url.searchParams.get('q')}`)])),
    'GET /api/tags': () => envelope(200, []),
  })
  renderWithProviders(<App />, '/search?q=rice')
  await screen.findByRole('link', { name: 'About rice' })

  const field = within(screen.getByRole('main')).getByRole('searchbox', { name: 'Search stories' })
  expect(field).toHaveValue('rice')
  await userEvent.clear(field)
  await userEvent.type(field, 'jute aphids{Enter}')

  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/search?q=jute%20aphids'))
  await waitFor(() => expect(screen.getByRole('link', { name: 'About jute aphids' })).toBeInTheDocument())
})
