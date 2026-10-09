import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { SIGNED_UP_BUT_NOT_IN } from '../../api/auth'
import { clearSession, getAccessToken, hasStoredSession } from '../../api/client'
import App from '../../App'
import { mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'
import { RequireAuth } from './RequireAuth'

function envelope(status: number, payload: unknown, message = 'OK') {
  return new Response(JSON.stringify({ status: String(status), message, payload, success: status < 400 }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const tokens = { accessToken: 'a1', refreshToken: 'r1', tokenType: 'Bearer', user: { id: 1, name: 'Nasrin Akter', email: 'nasrin@farm.bd' } }
const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  localStorage.clear()
  clearSession()
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

function body(call: number): unknown {
  return JSON.parse((fetchMock.mock.calls[call][1] as RequestInit).body as string)
}

test('signing in stores the session and goes back where the reader was', async () => {
  fetchMock.mockResolvedValueOnce(envelope(200, tokens))
  renderWithProviders(<App />, '/sign-in?next=%2Fstories%2Fboro-rice')

  await userEvent.type(screen.getByLabelText('E-mail'), ' nasrin@farm.bd ')
  await userEvent.type(screen.getByLabelText('Password'), 'Paddy2026!')
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/stories/boro-rice'))
  expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/sign-in')
  expect(body(0)).toEqual({ email: 'nasrin@farm.bd', password: 'Paddy2026!' })
  expect(getAccessToken()).toBe('a1')
  expect(localStorage.getItem('agrotrends.refreshToken')).toBe('r1')
  expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument()
})

test('a rejected sign-in shows the server message', async () => {
  fetchMock.mockResolvedValueOnce(envelope(401, null, 'Invalid email or password.'))
  renderWithProviders(<App />, '/sign-in')

  await userEvent.type(screen.getByLabelText('E-mail'), 'nasrin@farm.bd')
  await userEvent.type(screen.getByLabelText('Password'), 'wrong')
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.')
  expect(screen.getByTestId('path')).toHaveTextContent('/sign-in')
})

test('an empty sign-in form is checked before anything is sent', async () => {
  renderWithProviders(<App />, '/sign-in')
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

  expect(screen.getByLabelText('E-mail')).toHaveAccessibleDescription('Enter your e-mail address.')
  expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('Enter your password.')
  expect(fetchMock).not.toHaveBeenCalled()
})

test('signing up as an author sends the professional details, then signs in', async () => {
  fetchMock.mockResolvedValueOnce(envelope(200, tokens.user)).mockResolvedValueOnce(envelope(200, tokens))
  renderWithProviders(<App />, '/sign-up')

  await userEvent.type(screen.getByLabelText('Full name'), 'Nasrin Akter')
  await userEvent.type(screen.getByLabelText('E-mail'), 'nasrin@farm.bd')
  await userEvent.type(screen.getByLabelText('Mobile number'), '1712345678')
  await userEvent.type(screen.getByLabelText('Password'), 'Paddy2026!')
  await userEvent.click(screen.getByRole('radio', { name: /author/i }))
  await userEvent.type(screen.getByLabelText('Designation'), 'Agronomist')
  await userEvent.type(screen.getByLabelText('Specialities'), 'rice, soil health,')
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent(/^\/$/))
  expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/sign-up')
  expect(body(0)).toEqual({
    name: 'Nasrin Akter',
    email: 'nasrin@farm.bd',
    countryCode: '+880',
    mobileNumber: '1712345678',
    password: 'Paddy2026!',
    userType: ['AUTHOR'],
    professionalInfoRequest: { designation: 'Agronomist', specialities: ['rice', 'soil health'] },
  })
  expect(body(1)).toEqual({ email: 'nasrin@farm.bd', password: 'Paddy2026!' })
  expect(getAccessToken()).toBe('a1')
})

test('sign-up checks the password rule and author fields before sending', async () => {
  renderWithProviders(<App />, '/sign-up')

  await userEvent.type(screen.getByLabelText('Password'), 'paddy2026')
  await userEvent.click(screen.getByRole('radio', { name: /author/i }))
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

  expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('Include a capital letter, a number and a symbol.')
  expect(screen.getByLabelText('Designation')).toHaveAccessibleDescription('Enter your designation.')
  expect(screen.getByLabelText('Specialities')).toHaveAccessibleDescription('Enter at least one speciality.')
  expect(fetchMock).not.toHaveBeenCalled()
})

test('a reader signs up without professional details', async () => {
  fetchMock.mockResolvedValueOnce(envelope(200, tokens.user)).mockResolvedValueOnce(envelope(500, null))
  renderWithProviders(<App />, '/sign-up')

  await userEvent.type(screen.getByLabelText('Full name'), 'Karim')
  await userEvent.type(screen.getByLabelText('E-mail'), 'karim@farm.bd')
  await userEvent.type(screen.getByLabelText('Mobile number'), '1812345678')
  await userEvent.type(screen.getByLabelText('Password'), 'Jute2026#')
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

  expect(await screen.findByRole('alert')).toHaveTextContent(SIGNED_UP_BUT_NOT_IN)
  expect(body(0)).toMatchObject({ userType: ['CONSUMER'] })
  expect(body(0)).not.toHaveProperty('professionalInfoRequest')
})

test('a stored session is restored on load', async () => {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  const api = mockApi({
    'POST /api/auth/refresh-token': () => envelope(200, tokens),
    'GET /api/feed/following': () => envelope(200, page([])),
  })
  renderWithProviders(<App />, '/')

  expect(await screen.findByRole('button', { name: 'Account' })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Get started' })).not.toBeInTheDocument()
  const refresh = api.mock.calls.find(([url]) => url === '/api/auth/refresh-token')!
  expect(JSON.parse((refresh[1] as RequestInit).body as string)).toEqual({ refreshToken: 'r0' })
})

test('signing out ends the session on the server and here', async () => {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  const api = mockApi({
    'POST /api/auth/refresh-token': () => envelope(200, tokens),
    'GET /api/feed/following': () => envelope(200, page([])),
    'GET /api/feed/latest': () => envelope(200, page([])),
    'GET /api/auth/sign-out': () => envelope(200, null, 'You are signed out.'),
  })
  renderWithProviders(<App />, '/')

  await userEvent.click(await screen.findByRole('button', { name: 'Account' }))
  expect(screen.getByText('nasrin@farm.bd')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))

  expect(await screen.findByRole('link', { name: 'Get started' })).toBeInTheDocument()
  expect(api.mock.calls.some(([url]) => url === '/api/auth/sign-out')).toBe(true)
  expect(hasStoredSession()).toBe(false)
  expect(getAccessToken()).toBeNull()
})

function Guarded() {
  return (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route path="/settings" element={<h1>Settings</h1>} />
      </Route>
    </Routes>
  )
}

test('a protected screen sends a visitor to sign-in with the way back', () => {
  renderWithProviders(<Guarded />, '/settings?tab=profile')
  expect(screen.getByTestId('path')).toHaveTextContent('/sign-in?next=%2Fsettings%3Ftab%3Dprofile')
})

test('a protected screen waits for the session to restore', async () => {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  fetchMock.mockResolvedValueOnce(envelope(200, tokens))
  renderWithProviders(<Guarded />, '/settings')

  expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  expect(screen.getByTestId('path')).toHaveTextContent('/settings')
})

test('Escape closes the account menu and returns focus to it', async () => {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  mockApi({ 'POST /api/auth/refresh-token': () => envelope(200, tokens), 'GET /api/feed/following': () => envelope(200, page([])), 'GET /api/tags': () => envelope(200, []) })
  renderWithProviders(<App />, '/')

  const button = await screen.findByRole('button', { name: 'Account' })
  await userEvent.click(button)
  expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
  await userEvent.keyboard('{Escape}')
  expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument()
  expect(button).toHaveFocus()
})
