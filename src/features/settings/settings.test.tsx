import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession, getAccessToken, hasStoredSession } from '../../api/client'
import App from '../../App'
import { renderWithProviders } from '../../test/render'
import { PASSWORD_CHANGED_NOTICE } from './SettingsPage'

function envelope(status: number, payload: unknown, message = 'OK') {
  return new Response(JSON.stringify({ status: String(status), message, payload, success: status < 400 }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const user = { id: 1, name: 'Nasrin Akter', email: 'nasrin@farm.bd', mobileNumber: '+8801712345678' }
const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  // Background reads (profile, expert status, reputation, unread count) get one empty answer that fits them all; the
  // account and password tests count only the calls they make (/api/auth, /api/user).
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
    /^\/api\/(auth|user)\//.test(String(input))
      ? fetchMock(input, init)
      : Promise.resolve(envelope(200, { name: user.name, specialities: [], content: [], number: 0, last: true, total: 0, topics: [], count: 0 })),
  )
  localStorage.clear()
  clearSession()
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  // Session restore on load.
  fetchMock.mockResolvedValueOnce(envelope(200, { accessToken: 'a1', refreshToken: 'r1', user }))
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

function body(call: number): unknown {
  return JSON.parse((fetchMock.mock.calls[call][1] as RequestInit).body as string)
}

async function openSettings() {
  renderWithProviders(<App />, '/settings')
  await screen.findByRole('heading', { name: 'Settings' })
}

test('the account form starts from the signed-in account', async () => {
  await openSettings()
  expect(screen.getByLabelText('Full name')).toHaveValue('Nasrin Akter')
  expect(screen.getByLabelText('E-mail')).toHaveValue('nasrin@farm.bd')
  expect(screen.getByLabelText('Code')).toHaveValue('+880')
  expect(screen.getByLabelText('Mobile number')).toHaveValue('1712345678')
})

test('saving a new name keeps the reader signed in and updates the menu', async () => {
  fetchMock.mockResolvedValueOnce(envelope(200, null, 'User updated successfully.'))
  await openSettings()

  await userEvent.clear(screen.getByLabelText('Full name'))
  await userEvent.type(screen.getByLabelText('Full name'), 'Nasrin Sultana')
  await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

  expect(await screen.findByText(/Changes saved/)).toBeInTheDocument()
  expect(fetchMock.mock.calls[1][0]).toBe('/api/user/update')
  expect(body(1)).toEqual({ name: 'Nasrin Sultana', email: 'nasrin@farm.bd', countryCode: '+880', mobileNumber: '1712345678' })
  await userEvent.click(screen.getByRole('button', { name: 'Account' }))
  expect(await screen.findByText('Nasrin Sultana')).toBeInTheDocument()
  expect(getAccessToken()).toBe('a1')
})

test('a new e-mail keeps the reader signed in and says a link was sent', async () => {
  fetchMock
    .mockResolvedValueOnce(envelope(200, null))
    .mockResolvedValueOnce(envelope(200, { ...user, email: 'nasrin@agro.bd', emailVerified: false, phoneVerified: true }))
  await openSettings()

  await userEvent.clear(screen.getByLabelText('E-mail'))
  await userEvent.type(screen.getByLabelText('E-mail'), 'nasrin@agro.bd')
  await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

  expect(await screen.findByText(/We sent a confirmation link to nasrin@agro\.bd\./)).toBeInTheDocument()
  expect(screen.getByTestId('path')).toHaveTextContent('/settings')
  expect(hasStoredSession()).toBe(true)
  // The reloaded account shows the new address as not confirmed, with a way to get a new link.
  expect(await screen.findByText('Not confirmed yet')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Send a new link' })).toBeInTheDocument()
})

test('the e-mail can be removed while a phone remains, but not both', async () => {
  fetchMock.mockResolvedValueOnce(envelope(200, null))
  await openSettings()

  await userEvent.clear(screen.getByLabelText('E-mail'))
  await userEvent.clear(screen.getByLabelText('Mobile number'))
  await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
  expect(screen.getByLabelText('E-mail')).toHaveAccessibleDescription('Keep an e-mail address, a phone number or both.')

  await userEvent.type(screen.getByLabelText('Mobile number'), '1712345678')
  await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
  await waitFor(() => expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/user/update'))
  expect(body(1)).toEqual({ name: 'Nasrin Akter', countryCode: '+880', mobileNumber: '1712345678' })
})

test('an unconfirmed phone links to the SMS code', async () => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValueOnce(envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { ...user, emailVerified: true, phoneVerified: false } }))
  await openSettings()
  expect(screen.getByText('Confirmed')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Enter the SMS code' })).toHaveAttribute('href', '/verify-phone?next=%2Fsettings')
})

test('a taken e-mail shows the server message', async () => {
  fetchMock.mockResolvedValueOnce(envelope(400, null, 'Email already exists.'))
  await openSettings()

  await userEvent.clear(screen.getByLabelText('E-mail'))
  await userEvent.type(screen.getByLabelText('E-mail'), 'karim@farm.bd')
  await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Email already exists.')
  expect(getAccessToken()).toBe('a1')
})

test('changing the password signs out and asks to sign in again', async () => {
  fetchMock.mockResolvedValueOnce(envelope(200, null))
  await openSettings()

  await userEvent.type(screen.getByLabelText('Current password'), 'Paddy2026!')
  await userEvent.type(screen.getByLabelText('New password'), 'Jute2027#')
  await userEvent.type(screen.getByLabelText('Repeat new password'), 'Jute2027#')
  await userEvent.click(screen.getByRole('button', { name: 'Change password' }))

  await waitFor(() => expect(screen.getByText(PASSWORD_CHANGED_NOTICE)).toBeInTheDocument())
  expect(fetchMock.mock.calls[1][0]).toBe('/api/user/change-password')
  expect(body(1)).toEqual({ currentPassword: 'Paddy2026!', newPassword: 'Jute2027#' })
  expect(getAccessToken()).toBeNull()
})

test('a wrong current password keeps the reader here', async () => {
  fetchMock.mockResolvedValueOnce(envelope(400, null, 'Current password is incorrect.'))
  await openSettings()

  await userEvent.type(screen.getByLabelText('Current password'), 'Wrong2026!')
  await userEvent.type(screen.getByLabelText('New password'), 'Jute2027#')
  await userEvent.type(screen.getByLabelText('Repeat new password'), 'Jute2027#')
  await userEvent.click(screen.getByRole('button', { name: 'Change password' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Current password is incorrect.')
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/settings'))
})

test('the new password is checked before sending', async () => {
  await openSettings()

  await userEvent.type(screen.getByLabelText('Current password'), 'Paddy2026!')
  await userEvent.type(screen.getByLabelText('New password'), 'Paddy2026!')
  await userEvent.type(screen.getByLabelText('Repeat new password'), 'Paddy2026!')
  await userEvent.click(screen.getByRole('button', { name: 'Change password' }))

  expect(screen.getByLabelText('New password')).toHaveAccessibleDescription('Choose a password different from the current one.')
  expect(fetchMock).toHaveBeenCalledOnce()
})
