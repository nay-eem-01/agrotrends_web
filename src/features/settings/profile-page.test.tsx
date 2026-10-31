import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const user = { id: 7, name: 'Rahim Uddin', email: 'rahim@farm.bd' }
const summary = { userId: 7, name: 'Rahim Uddin', authorId: 7, location: 'Rangpur', coverUrl: '/uploads/field.jpg' }

beforeEach(() => {
  localStorage.clear()
  clearSession()
  localStorage.setItem('agrotrends.refreshToken', 'r0')
})

afterEach(() => vi.unstubAllGlobals())

test('settings edit the location and cover shown on your profile', async () => {
  const api = mockApi({
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user }),
    'GET /api/users/7/profile': () => envelope(200, summary),
    'GET /api/authors/me': () => envelope(200, { authorId: 7, name: 'Rahim Uddin', specialities: [] }),
    'GET /api/experts/applications/me': () => envelope(200, page([])),
    'PUT /api/user/profile': (_url, init) => envelope(200, { ...summary, ...JSON.parse(init!.body as string) }),
  })
  renderWithProviders(<App />, '/settings')

  const section = within((await screen.findByRole('heading', { name: 'Profile page' })).closest('section')!)
  const location = await section.findByLabelText('Location (optional)')
  expect(location).toHaveValue('Rangpur')
  expect(section.getByRole('img', { name: 'Your cover photo' })).toHaveAttribute('src', '/uploads/field.jpg')

  await userEvent.clear(location)
  await userEvent.type(location, ' Bogura ')
  await userEvent.click(section.getByRole('button', { name: 'Remove cover' }))
  await userEvent.click(section.getByRole('button', { name: 'Save profile page' }))

  await waitFor(() => expect(section.getByText('Profile page saved')).toBeInTheDocument())
  const put = api.mock.calls.find(([url, init]) => String(url) === '/api/user/profile' && init?.method === 'PUT')!
  // Both fields are replaced on every save; a removed cover goes as blank.
  expect(JSON.parse(put[1]!.body as string)).toEqual({ location: 'Bogura', coverUrl: '' })
})
