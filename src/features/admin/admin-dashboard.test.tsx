import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { pickOption, renderWithProviders } from '../../test/render'

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
  // From 1024px the sections are the app sidebar's Admin group; the page has no rail of its own.
  const sidebar = screen.getByRole('complementary', { name: 'Navigation' })
  expect(within(sidebar).getByRole('heading', { name: 'Admin' })).toBeInTheDocument()
  expect(within(sidebar).getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page')
  expect(within(sidebar).getByRole('link', { name: 'Reports' })).toHaveAttribute('href', '/admin/reports')
})

test('members without a staff role get no Admin group in the sidebar', async () => {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  mockApi({
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 9, name: 'Salma', roles: ['USER'] } }),
    'GET /api/users/9/reputation': () => envelope(200, { total: 900, topics: [{ categoryId: 3, categoryName: 'Livestock', points: 900, badges: ['VERIFIED_EXPERT'] }] }),
    'GET /api/questions/all': () => envelope(200, page([])),
  })
  renderWithProviders(<App />, '/')

  const sidebar = await screen.findByRole('complementary', { name: 'Navigation' })
  // A Verified Expert finds the review queue there instead.
  expect(await within(sidebar).findByRole('link', { name: 'Review queue' })).toHaveAttribute('href', '/review')
  expect(within(sidebar).queryByRole('heading', { name: 'Admin' })).not.toBeInTheDocument()
  expect(within(sidebar).queryByRole('link', { name: 'Overview' })).not.toBeInTheDocument()
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

const roles = [
  { id: 1, name: 'USER', type: 'USER', privileges: [] },
  { id: 2, name: 'SUPER ADMIN', type: 'SUPER_ADMIN', privileges: [] },
  { id: 5, name: 'Moderator', type: 'ADMIN', privileges: [{ id: 11, name: 'CONTENT_MODERATE' }] },
  { id: 6, name: 'Expert reviewer', type: 'ADMIN', privileges: [{ id: 12, name: 'EXPERT_REVIEW' }] },
]

test('a member page shows their counts and lets staff revoke, give and remove roles', async () => {
  const detail = { user: { ...karim, roles: ['USER', 'Moderator'], bannedAt: '2026-10-10T00:00:00Z' }, questions: 4, answers: 9, publishedStories: 1, openReports: 2, expertTopics: [{ id: 3, name: 'Rice' }] }
  const api = mockApi({
    ...signedInAdmin(),
    'GET /api/admin/users/8': () => envelope(200, detail),
    'GET /api/admin/roles': () => envelope(200, roles),
    'DELETE /api/admin/users/8/expert-badges/3': () => envelope(200, null),
    'POST /api/admin/users/8/roles/6': () => envelope(200, null),
    'DELETE /api/admin/users/8/roles/5': () => envelope(200, null),
  })
  renderWithProviders(<App />, '/admin/users/8')

  expect(await screen.findByRole('heading', { level: 1, name: 'Karim' })).toBeInTheDocument()
  expect(screen.getByText('Open reports about them').nextElementSibling).toHaveTextContent('2')
  expect(screen.getByText(/Banned Oct 10\./)).toBeInTheDocument()
  // The ban state is known, so only lifting it is offered.
  expect(screen.getByRole('button', { name: 'Lift a ban' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Ban the account' })).not.toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'Revoke' }))
  await waitFor(() => expect(api.mock.calls.some(([url, init]) => url === '/api/admin/users/8/expert-badges/3' && init?.method === 'DELETE')).toBe(true))

  await pickOption(await screen.findByLabelText('Give a role'), 'Expert reviewer')
  await userEvent.click(screen.getByRole('button', { name: 'Give role' }))
  await waitFor(() => expect(api.mock.calls.some(([url, init]) => url === '/api/admin/users/8/roles/6' && init?.method === 'POST')).toBe(true))
  await userEvent.click(screen.getByRole('button', { name: 'Remove role Moderator' }))
  await waitFor(() => expect(api.mock.calls.some(([url, init]) => url === '/api/admin/users/8/roles/5' && init?.method === 'DELETE')).toBe(true))
  // Fixed roles are shown, not offered.
  expect(within(screen.getByRole('list', { name: 'Roles held' })).getByText('USER')).toBeInTheDocument()
})

test('admin roles are created with privileges, edited and deleted; fixed roles are not', async () => {
  const privileges = [
    { id: 11, name: 'CONTENT_MODERATE', description: 'Handle reports' },
    { id: 12, name: 'EXPERT_REVIEW', description: 'Decide expert applications' },
    { id: 13, name: 'USER_READ', description: 'Read members' },
  ]
  const api = mockApi({
    ...signedInAdmin(),
    'GET /api/admin/roles': () => envelope(200, roles),
    'GET /api/admin/privileges': () => envelope(200, privileges),
    'POST /api/admin/roles': () => envelope(200, { id: 7, name: 'Support', type: 'ADMIN', privileges: [] }),
    'PUT /api/admin/roles': () => envelope(200, roles[2]),
    'DELETE /api/admin/roles/6': () => envelope(200, null),
  })
  renderWithProviders(<App />, '/admin/roles')

  const list = within(await screen.findByRole('list', { name: 'Roles' }))
  expect(list.queryByRole('button', { name: 'Edit SUPER ADMIN' })).not.toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'New role' }))
  const dialog = within(await screen.findByRole('dialog', { name: 'New admin role' }))
  await userEvent.click(dialog.getByRole('button', { name: 'Create role' }))
  expect(dialog.getByLabelText('Name')).toHaveAccessibleDescription('Give the role a name.')
  await userEvent.type(dialog.getByLabelText('Name'), 'Support')
  await userEvent.click(await dialog.findByRole('checkbox', { name: /USER_READ/ }))
  await userEvent.click(dialog.getByRole('button', { name: 'Create role' }))
  await waitFor(() => expect(api.mock.calls.some(([url, init]) => url === '/api/admin/roles' && init?.method === 'POST')).toBe(true))
  const created = api.mock.calls.find(([url, init]) => url === '/api/admin/roles' && init?.method === 'POST')!
  expect(JSON.parse(created[1]!.body as string)).toEqual({ roleName: 'Support', roleType: 'ADMIN', privilegeIds: [13] })

  await userEvent.click(list.getByRole('button', { name: 'Edit Moderator' }))
  const edit = within(await screen.findByRole('dialog', { name: 'Edit Moderator' }))
  expect(await edit.findByRole('checkbox', { name: /CONTENT_MODERATE/ })).toBeChecked()
  await userEvent.click(edit.getByRole('button', { name: 'Save role' }))
  await waitFor(() => expect(api.mock.calls.some(([url, init]) => url === '/api/admin/roles' && init?.method === 'PUT')).toBe(true))

  await userEvent.click(list.getByRole('button', { name: 'Delete Expert reviewer' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Delete role' }))
  await waitFor(() => expect(api.mock.calls.some(([url, init]) => url === '/api/admin/roles/6' && init?.method === 'DELETE')).toBe(true))
})

test('an account with an admin role is not offered a ban', async () => {
  mockApi({
    ...signedInAdmin(),
    'GET /api/admin/users/7': () => envelope(200, { user: { ...nasrin, roles: ['USER', 'Moderator'] }, questions: 0, answers: 0, publishedStories: 0, openReports: 0, expertTopics: [] }),
    'GET /api/admin/roles': () => envelope(200, roles),
  })
  renderWithProviders(<App />, '/admin/users/7')
  expect(await screen.findByText('They hold an admin role. Remove it below before banning the account.')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Ban the account' })).not.toBeInTheDocument()
})
