import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { renderWithProviders } from '../../test/render'
import { PASSWORD_RESET_NOTICE } from './ResetPasswordPage'

function envelope(status: number, payload: unknown, message = 'OK') {
  return new Response(JSON.stringify({ status: String(status), message, payload, success: status < 400 }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

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

test('sign-in links to the forgot-password screen', async () => {
  renderWithProviders(<App />, '/sign-in')
  await userEvent.click(screen.getByRole('link', { name: 'Forgot your password?' }))
  expect(screen.getByRole('heading', { name: 'Forgot your password?' })).toBeInTheDocument()
})

test('asking for a reset link confirms without saying whether the account exists', async () => {
  fetchMock.mockResolvedValueOnce(envelope(200, null, 'If an account exists for that e-mail, a reset link has been sent.'))
  renderWithProviders(<App />, '/forgot-password')

  await userEvent.type(screen.getByLabelText('E-mail'), 'karim@farm.bd ')
  await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }))

  expect(await screen.findByRole('heading', { name: 'Check your e-mail' })).toBeInTheDocument()
  expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/forgot-password')
  expect(body(0)).toEqual({ email: 'karim@farm.bd' })
})

test('too many reset requests show the server message', async () => {
  fetchMock.mockResolvedValueOnce(envelope(429, null, 'Too many attempts. Please try again later.'))
  renderWithProviders(<App />, '/forgot-password')

  await userEvent.type(screen.getByLabelText('E-mail'), 'karim@farm.bd')
  await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts')
})

test('setting a new password sends the token and returns to sign-in with a notice', async () => {
  fetchMock.mockResolvedValueOnce(envelope(200, null))
  renderWithProviders(<App />, '/reset-password?token=abc_123')

  await userEvent.type(screen.getByLabelText('New password'), 'Paddy2026!')
  await userEvent.type(screen.getByLabelText('Repeat new password'), 'Paddy2026!')
  await userEvent.click(screen.getByRole('button', { name: 'Set new password' }))

  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent(/^\/sign-in$/))
  expect(body(0)).toEqual({ token: 'abc_123', newPassword: 'Paddy2026!' })
  expect(screen.getByText(PASSWORD_RESET_NOTICE)).toBeInTheDocument()
})

test('the new password is checked before sending', async () => {
  renderWithProviders(<App />, '/reset-password?token=abc')

  await userEvent.type(screen.getByLabelText('New password'), 'Paddy2026!')
  await userEvent.type(screen.getByLabelText('Repeat new password'), 'Paddy2026?')
  await userEvent.click(screen.getByRole('button', { name: 'Set new password' }))

  expect(screen.getByLabelText('Repeat new password')).toHaveAccessibleDescription("The passwords don't match.")
  expect(fetchMock).not.toHaveBeenCalled()
})

test('an expired link offers a new one', async () => {
  fetchMock.mockResolvedValueOnce(envelope(400, null, 'Reset link is invalid or has expired.'))
  renderWithProviders(<App />, '/reset-password?token=old')

  await userEvent.type(screen.getByLabelText('New password'), 'Paddy2026!')
  await userEvent.type(screen.getByLabelText('Repeat new password'), 'Paddy2026!')
  await userEvent.click(screen.getByRole('button', { name: 'Set new password' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Reset link is invalid or has expired.')
  expect(screen.getByRole('link', { name: 'Send a new reset link' })).toHaveAttribute('href', '/forgot-password')
})

test('a link without a token says so', () => {
  renderWithProviders(<App />, '/reset-password')
  expect(screen.getByRole('heading', { name: "This link isn't complete" })).toBeInTheDocument()
})
