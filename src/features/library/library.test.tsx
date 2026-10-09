import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import type { BlogResponse } from '../../api/types'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const saved: BlogResponse = { id: 7, slug: 'saved', title: 'A saved story', content: '<p>x</p>', author: { authorId: 1, name: 'Nasrin' }, agri: {} }

function signedIn() {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return {
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 9, name: 'Karim' } }),
  }
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('the library needs sign-in', async () => {
  mockApi({})
  renderWithProviders(<App />, '/library?tab=following')
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/sign-in?next=%2Flibrary%3Ftab%3Dfollowing'))
})

test('the reading list shows saved stories, marked as saved', async () => {
  mockApi({ ...signedIn(), 'GET /api/bookmarks': () => envelope(200, page([saved])) })
  renderWithProviders(<App />, '/library')

  const card = (await screen.findByRole('link', { name: 'A saved story' })).closest('article')!
  await waitFor(() => expect(within(card).getByRole('button', { name: 'Save “A saved story”' })).toHaveAttribute('aria-pressed', 'true'))
  expect(screen.getByRole('link', { name: 'Reading list' })).toHaveAttribute('aria-current', 'page')
})

test('an empty reading list says how to save', async () => {
  mockApi({ ...signedIn(), 'GET /api/bookmarks': () => envelope(200, page([])) })
  renderWithProviders(<App />, '/library')
  expect(await screen.findByRole('heading', { name: 'Nothing saved yet' })).toBeInTheDocument()
})

test('following lists authors and topics, and unfollowing can be undone', async () => {
  const api = mockApi({
    ...signedIn(),
    'GET /api/me/following/authors': () => envelope(200, page([{ authorId: 3, name: 'Rahim Uddin' }])),
    'GET /api/me/following/tags': () => envelope(200, page(['jute'])),
    'DELETE /api/authors/3/follow': () => envelope(200, null),
    'PUT /api/authors/3/follow': () => envelope(200, null),
  })
  renderWithProviders(<App />, '/library?tab=following')

  const authors = within((await screen.findByRole('heading', { name: 'Authors' })).closest('section')!)
  expect(await authors.findByRole('link', { name: 'Rahim Uddin' })).toHaveAttribute('href', '/authors/3')
  const topics = within(screen.getByRole('heading', { name: 'Topics' }).closest('section')!)
  expect(await topics.findByRole('link', { name: 'jute' })).toHaveAttribute('href', '/tags/jute')

  await userEvent.click(authors.getByRole('button', { name: 'Following Rahim Uddin' }))
  expect(authors.getByRole('button', { name: 'Follow Rahim Uddin' })).toHaveAttribute('aria-pressed', 'false')
  await waitFor(() => expect(api.mock.calls.some(([url, init]) => init?.method === 'DELETE' && url === '/api/authors/3/follow')).toBe(true))

  await userEvent.click(authors.getByRole('button', { name: 'Follow Rahim Uddin' }))
  await waitFor(() => expect(api.mock.calls.some(([url, init]) => init?.method === 'PUT' && url === '/api/authors/3/follow')).toBe(true))
  expect(authors.getByRole('button', { name: 'Following Rahim Uddin' })).toBeInTheDocument()
})

test('a failed unfollow puts the button back', async () => {
  mockApi({
    ...signedIn(),
    'GET /api/me/following/authors': () => envelope(200, page([{ authorId: 3, name: 'Rahim Uddin' }])),
    'GET /api/me/following/tags': () => envelope(200, page([])),
    'DELETE /api/authors/3/follow': () => envelope(500, null),
  })
  renderWithProviders(<App />, '/library?tab=following')

  const button = await screen.findByRole('button', { name: 'Following Rahim Uddin' })
  await userEvent.click(button)
  expect(await screen.findByRole('button', { name: 'Following Rahim Uddin' })).toBeInTheDocument()
  expect(screen.getByText(/You don't follow any topics yet/)).toBeInTheDocument()
})
