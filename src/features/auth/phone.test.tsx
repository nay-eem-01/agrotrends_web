import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const phoneUser = { id: 4, name: 'Rahim', mobileNumber: '+8801712345678', emailVerified: false, phoneVerified: false }

function signedInAs(user: object) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return { 'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user }) }
}

function bodyOf(api: ReturnType<typeof mockApi>, path: string) {
  const call = api.mock.calls.find(([url]) => url === path)
  return call ? JSON.parse(call[1]!.body as string) : undefined
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

test('sign-up needs an e-mail or a phone, and a phone-only account goes on to confirm its number', async () => {
  const api = mockApi({
    'POST /api/auth/sign-up': () => envelope(200, phoneUser),
    'POST /api/auth/sign-in': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: phoneUser }),
  })
  renderWithProviders(<App />, '/sign-up')

  await userEvent.type(await screen.findByLabelText('Full name'), 'Rahim')
  await userEvent.type(screen.getByLabelText('Password'), 'Paddy2026!')
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
  expect(screen.getByLabelText('E-mail')).toHaveAccessibleDescription('Give an e-mail address, a phone number or both.')

  await userEvent.type(screen.getByLabelText('Mobile number'), '01712345678')
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/verify-phone?next='))
  expect(bodyOf(api, '/api/auth/sign-up')).toEqual({ name: 'Rahim', countryCode: '+880', mobileNumber: '01712345678', password: 'Paddy2026!' })
  expect(bodyOf(api, '/api/auth/sign-in')).toEqual({ identifier: '+8801712345678', password: 'Paddy2026!' })
  expect(await screen.findByRole('heading', { name: 'Confirm your phone number' })).toBeInTheDocument()
})

test('the SMS code confirms the number, and a new code waits a minute', async () => {
  const api = mockApi({
    ...signedInAs(phoneUser),
    'POST /api/auth/verify-phone': () => envelope(200, null),
    'POST /api/auth/resend-phone-code': () => envelope(200, null),
    'GET /api/user/me': () => envelope(200, { ...phoneUser, phoneVerified: true }),
  })
  renderWithProviders(<App />, '/verify-phone?next=%2Fquestions')

  expect(await screen.findByText(/We texted a 6-digit code to \+8801712345678/)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Send a new code' }))
  expect(await screen.findByRole('button', { name: /Send a new code in \d+s/ })).toBeDisabled()
  expect(bodyOf(api, '/api/auth/resend-phone-code')).toEqual({ countryCode: '+880', mobileNumber: '1712345678' })

  await userEvent.type(screen.getByLabelText('Code'), '12a3')
  await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
  expect(screen.getByLabelText('Code')).toHaveAccessibleDescription('Enter the 6-digit code.')
  await userEvent.type(screen.getByLabelText('Code'), '456')
  await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))

  expect(await screen.findByRole('heading', { name: 'Your phone number is confirmed' })).toBeInTheDocument()
  expect(bodyOf(api, '/api/auth/verify-phone')).toEqual({ countryCode: '+880', mobileNumber: '1712345678', code: '123456' })
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/questions'))
})

test('a wrong code shows the backend message', async () => {
  mockApi({ ...signedInAs(phoneUser), 'POST /api/auth/verify-phone': () => envelope(400, null, 'The code is wrong or has expired.') })
  renderWithProviders(<App />, '/verify-phone')
  await userEvent.type(await screen.findByLabelText('Code'), '000000')
  await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('The code is wrong or has expired.')
})

test('an unconfirmed phone-only account sees a banner that leads to the code', async () => {
  mockApi({ ...signedInAs(phoneUser), 'GET /api/questions/all': () => envelope(200, page([])), 'GET /api/categories/all': () => envelope(200, page([])) })
  renderWithProviders(<App />, '/questions')

  const banner = await screen.findByRole('region', { name: 'Confirm your phone number' })
  expect(banner).toHaveTextContent('We texted a code to +8801712345678.')
  expect(screen.getByRole('link', { name: 'Enter the SMS code' })).toHaveAttribute('href', '/verify-phone')
  expect(screen.queryByRole('button', { name: 'Send a new link' })).not.toBeInTheDocument()
})

test('a forgotten password is reset by SMS code, then sign-in says so', async () => {
  const api = mockApi({
    'POST /api/auth/forgot-password/phone': () => envelope(200, null),
    'POST /api/auth/reset-password/phone': () => envelope(200, null),
  })
  renderWithProviders(<App />, '/forgot-password')

  await userEvent.click(await screen.findByRole('link', { name: 'Phone' }))
  await userEvent.type(await screen.findByLabelText('Mobile number'), '01712 345678')
  await userEvent.click(screen.getByRole('button', { name: 'Text me a code' }))
  expect(await screen.findByText(/we texted it a 6-digit code/)).toHaveTextContent('+8801712345678')
  expect(bodyOf(api, '/api/auth/forgot-password/phone')).toEqual({ countryCode: '+880', mobileNumber: '01712345678' })

  await userEvent.type(screen.getByLabelText('SMS code'), '654321')
  await userEvent.type(screen.getByLabelText('New password'), 'Paddy2026!')
  await userEvent.type(screen.getByLabelText('Repeat new password'), 'Paddy2026?')
  await userEvent.click(screen.getByRole('button', { name: 'Set new password' }))
  expect(screen.getByLabelText('Repeat new password')).toHaveAccessibleDescription("The passwords don't match.")
  await userEvent.clear(screen.getByLabelText('Repeat new password'))
  await userEvent.type(screen.getByLabelText('Repeat new password'), 'Paddy2026!')
  await userEvent.click(screen.getByRole('button', { name: 'Set new password' }))

  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/sign-in'))
  expect(bodyOf(api, '/api/auth/reset-password/phone')).toEqual({ countryCode: '+880', mobileNumber: '01712345678', code: '654321', newPassword: 'Paddy2026!' })
  expect(await screen.findByText('Password changed. Sign in with your new password.')).toBeInTheDocument()
})
