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

function signedIn() {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return {
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 9, name: 'Karim' } }),
    'GET /api/bookmarks': () => envelope(200, page([])),
  }
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('a tag page lists its stories newest first', async () => {
  const api = mockApi({ 'GET /api/blogs/all/tag/rice%20blast': () => envelope(200, { ...page([story(1, 'Blast in boro')]), totalElements: 1 }) })
  renderWithProviders(<App />, '/tags/rice%20blast')

  expect(await screen.findByRole('link', { name: 'Blast in boro' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 1, name: 'rice blast' })).toBeInTheDocument()
  expect(screen.getByText('1 story')).toBeInTheDocument()
  const url = new URL(String(api.mock.calls[0][0]), 'http://x')
  expect(url.pathname).toBe('/api/blogs/all/tag/rice%20blast')
  expect(url.searchParams.get('ascOrDesc')).toBe('desc')
})

test('a visitor following a tag is sent to sign-in', async () => {
  mockApi({ 'GET /api/blogs/all/tag/rice': () => envelope(200, page([])) })
  renderWithProviders(<App />, '/tags/rice')

  expect(await screen.findByRole('heading', { name: 'No stories on this topic yet' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Follow' }))
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/sign-in?next=%2Ftags%2Frice'))
})

test('following and unfollowing a tag', async () => {
  const api = mockApi({
    ...signedIn(),
    'GET /api/blogs/all/tag/rice': () => envelope(200, page([story(1, 'Rice story')])),
    'GET /api/me/following/tags': () => envelope(200, page(['jute'])),
    'PUT /api/tags/rice/follow': () => envelope(200, null),
    'DELETE /api/tags/rice/follow': () => envelope(200, null),
  })
  renderWithProviders(<App />, '/tags/rice')

  const follow = await screen.findByRole('button', { name: 'Follow' })
  await waitFor(() => expect(follow).toHaveAttribute('aria-pressed', 'false'))
  await userEvent.click(follow)
  expect(screen.getByRole('button', { name: 'Following' })).toHaveAttribute('aria-pressed', 'true')
  await waitFor(() => expect(api.mock.calls.some(([url, init]) => init?.method === 'PUT' && url === '/api/tags/rice/follow')).toBe(true))

  await userEvent.click(screen.getByRole('button', { name: 'Following' }))
  expect(screen.getByRole('button', { name: 'Follow' })).toHaveAttribute('aria-pressed', 'false')
  await waitFor(() => expect(api.mock.calls.some(([url, init]) => init?.method === 'DELETE' && url === '/api/tags/rice/follow')).toBe(true))
})

test('the topics page searches tags and shows the followed ones', async () => {
  const api = mockApi({
    ...signedIn(),
    'GET /api/tags': (url) => envelope(200, url.searchParams.get('q') === 'ri' ? ['rice', 'rice blast'] : ['jute', 'nitrogen', 'rice']),
    'GET /api/me/following/tags': () => envelope(200, page(['jute'])),
  })
  renderWithProviders(<App />, '/topics')

  const followed = await screen.findByRole('region', { name: 'Topics you follow' })
  expect(within(followed).getByRole('link', { name: 'jute' })).toHaveAttribute('href', '/tags/jute')
  expect(within(screen.getByRole('list', { name: 'Topics' })).getAllByRole('link')).toHaveLength(3)

  await userEvent.type(screen.getByLabelText('Find a topic'), 'Ri')
  await waitFor(() => expect(within(screen.getByRole('list', { name: 'Topics' })).getAllByRole('link').map((l) => l.textContent)).toEqual(['rice', 'rice blast']))
  expect(api.mock.calls.some(([url]) => String(url) === '/api/tags?q=ri')).toBe(true)
})

test('home shows topics to follow', async () => {
  mockApi({
    'GET /api/feed/latest': () => envelope(200, page([])),
    'GET /api/tags': () => envelope(200, ['rice', 'jute']),
  })
  renderWithProviders(<App />, '/')

  const rail = await screen.findByRole('region', { name: 'Topics to follow' })
  expect(within(rail).getByRole('link', { name: 'rice' })).toHaveAttribute('href', '/tags/rice')
  expect(within(rail).getByRole('link', { name: 'See all topics' })).toHaveAttribute('href', '/topics')
})
