import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const admin = { id: 1, name: 'Admin', email: 'admin@agrotrends.local', roles: ['SUPER ADMIN'] }

function signedInAdmin() {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return { 'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: admin }) }
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

const stats = { users: 120, newUsers: 8, bannedUsers: 2, questions: 340, newQuestions: 21, answers: 900, publishedStories: 45, openReports: 3, pendingExpertApplications: 0, uncheckedAiAnswers: 12 }

test('the overview puts waiting work first, each leading to its queue', async () => {
  mockApi({ ...signedInAdmin(), 'GET /api/admin/stats': () => envelope(200, stats) })
  renderWithProviders(<App />, '/admin')

  const queues = within((await screen.findByRole('heading', { name: 'Needs attention' })).closest('section')!)
  expect(queues.getByRole('link', { name: /3\s*Open reports/ })).toHaveAttribute('href', '/admin/reports')
  expect(queues.getByRole('link', { name: /0\s*Expert applications/ })).toHaveAttribute('href', '/admin/experts')
  expect(queues.getByText('Unchecked AI answers')).toBeInTheDocument()
  const totals = within(screen.getByRole('heading', { name: 'Community' }).closest('section')!)
  expect(totals.getByRole('link', { name: 'Banned' })).toHaveAttribute('href', '/admin/users?banned=true')
  expect(totals.getByText('+8 this week')).toBeInTheDocument()
  expect(within(screen.getByRole('navigation', { name: 'Admin sections' })).getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page')
})

test('a missing privilege shows the backend message', async () => {
  mockApi({ ...signedInAdmin(), 'GET /api/admin/stats': () => envelope(403, null, 'You do not have permission to do this.') })
  renderWithProviders(<App />, '/admin')
  expect(await screen.findByRole('alert')).toHaveTextContent('You do not have permission to do this.')
})

const nasrin = { id: 7, name: 'Nasrin Akter', email: 'nasrin@farm.bd', roles: ['USER'], banned: false, createdAt: '2026-10-01T00:00:00Z' }
const karim = { id: 8, name: 'Karim', mobileNumber: '+8801712345678', roles: ['USER', 'Moderator'], banned: true, banReason: 'Spam', createdAt: '2026-10-02T00:00:00Z' }

test('users are searched by name or e-mail and filtered by ban state', async () => {
  const api = mockApi({ ...signedInAdmin(), 'GET /api/admin/users': () => envelope(200, page([nasrin, karim])) })
  renderWithProviders(<App />, '/admin/users')

  const members = within(await screen.findByRole('list', { name: 'Members' }))
  expect(members.getByRole('link', { name: 'Nasrin Akter' })).toHaveAttribute('href', '/admin/users/7')
  expect(members.getByText(/\+8801712345678/)).toBeInTheDocument()
  expect(members.getByText('Banned')).toBeInTheDocument()
  expect(members.getByText('Moderator')).toBeInTheDocument()

  await userEvent.type(screen.getByRole('searchbox', { name: 'Search members by name or e-mail' }), 'nasrin{Enter}')
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/admin/users?q=nasrin'))
  await userEvent.click(screen.getByRole('link', { name: 'Banned' }))
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/admin/users?q=nasrin&banned=true'))
  const last = new URL(String(api.mock.calls.filter(([url]) => String(url).startsWith('/api/admin/users')).at(-1)![0]), 'http://x')
  expect([last.searchParams.get('q'), last.searchParams.get('banned')]).toEqual(['nasrin', 'true'])
})
