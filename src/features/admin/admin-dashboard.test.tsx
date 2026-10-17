import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi } from '../../test/api'
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
