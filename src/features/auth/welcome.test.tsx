import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession, getAccessToken } from '../../api/client'
import App from '../../App'
import { envelope, mockApi } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const user = { id: 9, name: 'Karim', authorId: null }
const profile = { authorId: 4, name: 'Karim', specialities: [] }

function signedIn() {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return { 'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user }) }
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  delete window.google
})

test('the profile step after sign-up can be skipped', async () => {
  mockApi({ ...signedIn(), 'GET /api/authors/me': () => envelope(200, profile), 'GET /api/questions/all': () => envelope(200, { content: [], last: true, number: 0 }) })
  renderWithProviders(<App />, '/welcome?next=%2Fquestions')

  expect(await screen.findByRole('heading', { name: 'Welcome to AgroTrends' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('link', { name: 'Skip for now' }))
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/questions'))
})

test('saving the profile step goes on to where the reader was heading', async () => {
  const api = mockApi({
    ...signedIn(),
    'GET /api/authors/me': () => envelope(200, profile),
    'PUT /api/authors/me': () => envelope(200, { ...profile, designation: 'Farmer', specialities: ['jute'] }),
    'GET /api/questions/all': () => envelope(200, { content: [], last: true, number: 0 }),
  })
  renderWithProviders(<App />, '/welcome?next=%2Fquestions')

  await userEvent.type(await screen.findByLabelText('Designation'), 'Farmer')
  await userEvent.type(screen.getByLabelText('Specialities'), 'jute')
  await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))

  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/questions'))
  const put = api.mock.calls.find(([, init]) => init?.method === 'PUT')!
  expect(JSON.parse(put[1]!.body as string)).toMatchObject({ designation: 'Farmer', specialities: ['jute'] })
})

test('no Google button without a client id', async () => {
  mockApi({})
  renderWithProviders(<App />, '/sign-in')
  await screen.findByRole('button', { name: 'Sign in' })
  expect(screen.queryByText('or')).not.toBeInTheDocument()
})

test('Google sign-in sends the ID token and signs in', async () => {
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'client-1.apps.googleusercontent.com')
  let callback: (response: { credential: string }) => void = () => {}
  window.google = {
    accounts: {
      id: {
        initialize: (options) => {
          callback = options.callback
        },
        renderButton: (parent) => {
          parent.textContent = 'Continue with Google'
        },
      },
    },
  }
  const api = mockApi({
    'POST /api/auth/google': () => envelope(200, { accessToken: 'g1', refreshToken: 'gr1', user }),
    'GET /api/feed/following': () => envelope(200, { content: [], last: true, number: 0 }),
    'GET /api/feed/latest': () => envelope(200, { content: [], last: true, number: 0 }),
    'GET /api/tags': () => envelope(200, []),
  })
  renderWithProviders(<App />, '/sign-in')

  expect(await screen.findByText('Continue with Google')).toBeInTheDocument()
  callback({ credential: 'google-id-token' })

  await waitFor(() => expect(getAccessToken()).toBe('g1'))
  const call = api.mock.calls.find(([url]) => url === '/api/auth/google')!
  expect(JSON.parse(call[1]!.body as string)).toEqual({ idToken: 'google-id-token' })
})
