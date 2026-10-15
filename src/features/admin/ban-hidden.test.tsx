import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

function signedInAs(user: object) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return {
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user }),
    'GET /api/notifications/unread-count': () => envelope(200, { count: 0 }),
  }
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('staff ban from a profile, with a reason, and can lift it', async () => {
  const api = mockApi({
    ...signedInAs({ id: 1, name: 'Admin', roles: ['SUPER_ADMIN'] }),
    'GET /api/users/1/reputation': () => envelope(200, { total: 0, topics: [] }),
    'GET /api/users/8/reputation': () => envelope(200, { total: 3, topics: [] }),
    'GET /api/questions/all/user/8': () => envelope(200, page([])),
    'POST /api/admin/users/8/ban': () => envelope(200, null),
    'DELETE /api/admin/users/8/ban': () => envelope(200, null),
  })
  renderWithProviders(<App />, '/users/8')

  await userEvent.click(await screen.findByRole('button', { name: 'Ban the account' }))
  const dialog = await screen.findByRole('alertdialog')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Ban' }))
  expect(within(dialog).getByLabelText('Reason')).toHaveAccessibleDescription('Give a reason.')
  await userEvent.type(within(dialog).getByLabelText('Reason'), 'Repeated harmful advice.')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Ban' }))
  expect(await screen.findByText(/is banned and signed out everywhere/)).toBeInTheDocument()
  const sent = api.mock.calls.find(([url]) => url === '/api/admin/users/8/ban')!
  expect(JSON.parse(sent[1]!.body as string)).toEqual({ reason: 'Repeated harmful advice.' })

  await userEvent.click(screen.getByRole('button', { name: 'Lift a ban' }))
  await waitFor(() => expect(api.mock.calls.some(([url, init]) => url === '/api/admin/users/8/ban' && init?.method === 'DELETE')).toBe(true))
})

test('people who are not staff see no ban controls', async () => {
  mockApi({
    ...signedInAs({ id: 2, name: 'Karim' }),
    'GET /api/users/2/reputation': () => envelope(200, { total: 0, topics: [] }),
    'GET /api/users/8/reputation': () => envelope(200, { total: 3, topics: [] }),
    'GET /api/questions/all/user/8': () => envelope(200, page([])),
  })
  renderWithProviders(<App />, '/users/8')
  await screen.findByRole('heading', { name: 'Reputation by topic' })
  expect(screen.queryByRole('button', { name: 'Ban the account' })).not.toBeInTheDocument()
})

test('a hidden story locks the editor: the 409 stops saving and explains why', async () => {
  const story = { id: 80, slug: 'jute', title: 'Jute retting', content: '<p>Soak the stems.</p>', status: 'DRAFT', category: { id: 1 } }
  const api = mockApi({
    ...signedInAs({ id: 9, name: 'Nasrin', authorId: 3 }),
    'GET /api/users/9/reputation': () => envelope(200, { total: 0, topics: [] }),
    'GET /api/blogs/id/80': () => envelope(200, story),
    'PUT /api/blogs/update': () => envelope(409, null, 'This post is hidden while the moderators review reports about it.'),
  })
  renderWithProviders(<App />, '/write/80')

  const title = await screen.findByRole('textbox', { name: 'Title' })
  await userEvent.type(title, ' in August')
  expect(await screen.findByText('This story is hidden while moderators review reports about it', {}, { timeout: 4000 })).toBeInTheDocument()
  const puts = () => api.mock.calls.filter(([url]) => url === '/api/blogs/update').length
  const before = puts()
  await userEvent.type(title, '!')
  await new Promise((resolve) => setTimeout(resolve, 1500))
  expect(puts()).toBe(before)
})

test('a thread that turns 404 says the conversation is no longer available', async () => {
  mockApi({
    'GET /api/blogs/slug/rice': () => envelope(200, { id: 7, slug: 'rice', title: 'Rice', content: '<p>x</p>', status: 'PUBLISHED', author: { authorId: 1, name: 'Nasrin' } }),
    'GET /api/comments/blog/7': () => envelope(404, null, 'Not found'),
    'GET /api/authors/1': () => envelope(200, { authorId: 1, name: 'Nasrin' }),
  })
  renderWithProviders(<App />, '/stories/rice')
  expect(await screen.findByText('This conversation is no longer available.')).toBeInTheDocument()
})
