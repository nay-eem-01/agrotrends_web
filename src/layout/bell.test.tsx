import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../api/client'
import App from '../App'
import { envelope, mockApi, page } from '../test/api'
import { renderWithProviders } from '../test/render'

function signedIn() {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return {
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 2, name: 'Karim' } }),
    'GET /api/users/2/reputation': () => envelope(200, { total: 0, topics: [] }),
    'GET /api/questions/all': () => envelope(200, page([])),
    'GET /api/categories/all': () => envelope(200, page([])),
  }
}

const answered = { id: 11, type: 'ANSWER_ON_YOUR_QUESTION', targetType: 'QUESTION', targetId: 5, actorName: 'Rahim', read: false, createdAt: '2026-10-15T06:00:00Z' }
const hidden = { id: 12, type: 'CONTENT_HIDDEN', targetType: 'QUESTION', targetId: 6, read: true, createdAt: '2026-10-14T06:00:00Z' }

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('the bell shows the unread count and the latest notifications', async () => {
  mockApi({
    ...signedIn(),
    'GET /api/notifications/unread-count': () => envelope(200, { count: 1 }),
    'GET /api/notifications': () => envelope(200, page([answered, hidden])),
  })
  renderWithProviders(<App />, '/')

  const bell = await screen.findByRole('button', { name: 'Notifications, 1 unread' })
  await userEvent.click(bell)
  const panel = screen.getByRole('region', { name: 'Notifications' })
  await within(panel).findByText(/answered your question/)
  expect(within(panel).getByRole('button', { name: /^Unread: Rahim answered your question/ })).toBeInTheDocument()
  // A hidden post has no page to open.
  expect(within(panel).getByText('One of your posts is hidden while moderators review reports').closest('button')).toBeNull()
})

test('opening a notification marks it read and goes to its question', async () => {
  let unread = 1
  const api = mockApi({
    ...signedIn(),
    'GET /api/notifications/unread-count': () => envelope(200, { count: unread }),
    'GET /api/notifications': () => envelope(200, page([{ ...answered, read: unread === 0 }])),
    'POST /api/notifications/11/read': () => {
      unread = 0
      return envelope(200, null)
    },
    'GET /api/questions/id/5': () => envelope(200, { questionId: 5, title: 'Yellow seedlings', content: 'x', userId: 2, authorName: 'Karim' }),
    'GET /api/answers/question/5': () => envelope(200, []),
    'GET /api/questions/id/5/my-votes': () => envelope(200, { answers: {} }),
  })
  renderWithProviders(<App />, '/')

  await userEvent.click(await screen.findByRole('button', { name: 'Notifications, 1 unread' }))
  await userEvent.click(await screen.findByRole('button', { name: /Rahim answered your question/ }))

  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/questions/5'))
  expect(api.mock.calls.some(([url, init]) => url === '/api/notifications/11/read' && init?.method === 'POST')).toBe(true)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument())
})

test('mark all read clears the count', async () => {
  let unread = 2
  const api = mockApi({
    ...signedIn(),
    'GET /api/notifications/unread-count': () => envelope(200, { count: unread }),
    'GET /api/notifications': () => envelope(200, page([answered])),
    'POST /api/notifications/read-all': () => {
      unread = 0
      return envelope(200, { updated: 2 })
    },
  })
  renderWithProviders(<App />, '/')

  await userEvent.click(await screen.findByRole('button', { name: 'Notifications, 2 unread' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Mark all read' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument())
  expect(api.mock.calls.some(([url]) => url === '/api/notifications/read-all')).toBe(true)
})

test('the count is polled while the tab is visible', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  let count = 0
  mockApi({ ...signedIn(), 'GET /api/notifications/unread-count': () => envelope(200, { count: count }) })
  renderWithProviders(<App />, '/')
  await screen.findByRole('button', { name: 'Notifications' })

  count = 3
  await vi.advanceTimersByTimeAsync(61_000)
  expect(await screen.findByRole('button', { name: 'Notifications, 3 unread' })).toBeInTheDocument()
  vi.useRealTimers()
})
