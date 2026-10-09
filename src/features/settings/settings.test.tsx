import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession, getAccessToken, hasStoredSession } from '../../api/client'
import App from '../../App'
import { renderWithProviders } from '../../test/render'
import { EMAIL_CHANGED_NOTICE, PASSWORD_CHANGED_NOTICE } from './SettingsPage'

function envelope(status: number, payload: unknown, message = 'OK') {
  return new Response(JSON.stringify({ status: String(status), message, payload, success: status < 400 }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const user = { id: 1, name: 'Nasrin Akter', email: 'nasrin@farm.bd', mobileNumber: '+8801712345678' }
const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
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

  expect(await screen.findByText('Changes saved')).toBeInTheDocument()
  expect(fetchMock.mock.calls[1][0]).toBe('/api/user/update')
  expect(body(1)).toEqual({ name: 'Nasrin Sultana', email: 'nasrin@farm.bd', countryCode: '+880', mobileNumber: '1712345678' })
  await userEvent.click(screen.getByRole('button', { name: 'Account' }))
  expect(screen.getByText('Nasrin Sultana')).toBeInTheDocument()
  expect(getAccessToken()).toBe('a1')
})

test('changing the e-mail sends the reader to sign in again', async () => {
  fetchMock.mockResolvedValueOnce(envelope(200, null))
  await openSettings()

  await userEvent.clear(screen.getByLabelText('E-mail'))
  await userEvent.type(screen.getByLabelText('E-mail'), 'nasrin@agro.bd')
  await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

  expect(await screen.findByText(EMAIL_CHANGED_NOTICE)).toBeInTheDocument()
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/sign-in?next=%2Fsettings'))
  expect(hasStoredSession()).toBe(false)
  // Restore, update; no sign-out call for a session the backend already revoked.
  expect(fetchMock).toHaveBeenCalledTimes(2)
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
