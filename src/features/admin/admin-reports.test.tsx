import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

function staff() {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return {
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 1, name: 'Admin', roles: ['SUPER_ADMIN'] } }),
    'GET /api/users/1/reputation': () => envelope(200, { total: 0, topics: [] }),
    'GET /api/notifications/unread-count': () => envelope(200, { count: 0 }),
  }
}
const report = (id: number, overrides = {}) => ({ id, reporterId: 10 + id, reporterName: `Reporter ${id}`, targetType: 'QUESTION', targetId: 5, reason: 'SPAM', status: 'OPEN', createdAt: '2026-10-15T06:00:00Z', ...overrides })

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('a hidden post shows its snapshot, and one removal covers its reports', async () => {
  let open = [report(1, { snapshot: 'Spray ten times the dose.' }), report(2, { reason: 'HARMFUL_ADVICE', details: 'Burns the crop' })]
  const api = mockApi({
    ...staff(),
    'GET /api/admin/reports': () => envelope(200, page(open)),
    'POST /api/admin/reports/1/remove-content': () => {
      open = []
      return envelope(200, null)
    },
  })
  renderWithProviders(<App />, '/admin/reports')

  const group = await screen.findByRole('article', { name: 'Question 5' })
  expect(within(group).getByText('Hidden')).toBeInTheDocument()
  expect(within(group).getByText('Spray ten times the dose.')).toBeInTheDocument()
  expect(within(group).getByText('2 reports: Spam, Harmful advice')).toBeInTheDocument()
  expect(within(group).getByText('“Burns the crop”')).toBeInTheDocument()

  await userEvent.click(within(group).getByRole('button', { name: 'Remove the post' }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Remove this post for good?' })
  expect(dialog).toHaveTextContent('This cannot be undone.')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Remove it' }))
  await waitFor(() => expect(api.mock.calls.some(([url]) => url === '/api/admin/reports/1/remove-content')).toBe(true))
  expect(await screen.findByText('No open reports.')).toBeInTheDocument()
})

test('a visible post links to itself; dismiss closes its reports', async () => {
  const api = mockApi({
    ...staff(),
    'GET /api/admin/reports': () => envelope(200, page([report(3, { targetType: 'ANSWER', targetId: 31 })])),
    'GET /api/answers/id/31': () => envelope(200, { answerId: 31, questionId: 5 }),
    'POST /api/admin/reports/3/dismiss': () => envelope(200, null),
  })
  renderWithProviders(<App />, '/admin/reports')

  const group = await screen.findByRole('article', { name: 'Answer 31' })
  expect(await within(group).findByRole('link', { name: 'Open the post' })).toHaveAttribute('href', '/questions/5#answer-31')
  await userEvent.click(within(group).getByRole('button', { name: 'Dismiss' }))
  await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Dismiss' }))
  await waitFor(() => expect(api.mock.calls.some(([url]) => url === '/api/admin/reports/3/dismiss')).toBe(true))
})

test('another moderator acting first (409) shows the message', async () => {
  mockApi({
    ...staff(),
    'GET /api/admin/reports': () => envelope(200, page([report(4)])),
    'POST /api/admin/reports/4/dismiss': () => envelope(409, null, 'This report has already been handled.'),
  })
  renderWithProviders(<App />, '/admin/reports')
  const group = await screen.findByRole('article', { name: 'Question 5' })
  await userEvent.click(within(group).getByRole('button', { name: 'Dismiss' }))
  await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Dismiss' }))
  expect(await within(group).findByRole('alert')).toHaveTextContent('This report has already been handled.')
})

test('closed reports are listed by status', async () => {
  const api = mockApi({ ...staff(), 'GET /api/admin/reports': () => envelope(200, page([report(5, { status: 'DISMISSED' })])) })
  renderWithProviders(<App />, '/admin/reports?status=DISMISSED')
  expect(await screen.findByText('by Reporter 5 · Oct 15')).toBeInTheDocument()
  const sent = api.mock.calls.map(([url]) => new URL(String(url), 'http://x')).find((url) => url.pathname === '/api/admin/reports')!
  expect(sent.searchParams.get('status')).toBe('DISMISSED')
})
