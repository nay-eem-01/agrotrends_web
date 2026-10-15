import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

function signedIn() {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return {
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 2, name: 'Karim' } }),
    'GET /api/users/2/reputation': () => envelope(200, { total: 0, topics: [] }),
  }
}

const n = (id: number, type: string, overrides = {}) => ({ id, type, targetType: 'QUESTION', targetId: 5, read: false, createdAt: '2026-10-15T06:00:00Z', ...overrides })

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('the page lists every type in words, page by page', async () => {
  mockApi({
    ...signedIn(),
    'GET /api/notifications/unread-count': () => envelope(200, { count: 2 }),
    'GET /api/notifications': (url) =>
      url.searchParams.get('pageNo') === '0'
        ? envelope(
            200,
            page(
              [
                n(1, 'ANSWER_ACCEPTED', { actorName: 'Karim' }),
                n(2, 'APPLICATION_DECIDED', { targetType: 'EXPERT_APPLICATION', read: true }),
                n(3, 'CONTENT_REMOVED', { read: true }),
              ],
              0,
              false,
            ),
          )
        : envelope(200, page([n(4, 'COMMENT_REPLY', { targetType: 'BLOG', targetId: 9, actorName: 'Salma', read: true })], 1, true)),
  })
  renderWithProviders(<App />, '/notifications')

  expect(await screen.findByText('Karim accepted your answer')).toBeInTheDocument()
  expect(screen.getByText('Your expert application was decided')).toBeInTheDocument()
  expect(screen.getByText('Moderators removed one of your posts').closest('button')).toBeNull()
  expect(screen.getByRole('link', { name: 'Unread (2)' })).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'Show older notifications' }))
  expect(await screen.findByText('Salma replied to your comment')).toBeInTheDocument()
})

test('the Unread tab asks for unread only', async () => {
  const api = mockApi({
    ...signedIn(),
    'GET /api/notifications/unread-count': () => envelope(200, { count: 0 }),
    'GET /api/notifications': () => envelope(200, page([])),
  })
  renderWithProviders(<App />, '/notifications?unread=true')

  expect(await screen.findByText('You have read everything.')).toBeInTheDocument()
  await waitFor(() =>
    expect(
      api.mock.calls.map(([url]) => new URL(String(url), 'http://x')).some((url) => url.pathname === '/api/notifications' && url.searchParams.get('unreadOnly') === 'true'),
    ).toBe(true),
  )
})

test('the bell links to the page', async () => {
  mockApi({
    ...signedIn(),
    'GET /api/notifications/unread-count': () => envelope(200, { count: 0 }),
    'GET /api/notifications': () => envelope(200, page([])),
    'GET /api/questions/all': () => envelope(200, page([])),
    'GET /api/categories/all': () => envelope(200, page([])),
  })
  renderWithProviders(<App />, '/')
  await userEvent.click(await screen.findByRole('button', { name: 'Notifications' }))
  await userEvent.click(await screen.findByRole('link', { name: 'See all notifications' }))
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/notifications'))
})
