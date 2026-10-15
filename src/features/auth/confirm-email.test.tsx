import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession, hasStoredSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const unconfirmed = { id: 9, name: 'Karim', email: 'karim@farm.bd', emailVerified: false }

function signedInAs(user: object) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return { 'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user }) }
}

function bodyOf(api: ReturnType<typeof mockApi>, path: string) {
  return JSON.parse(api.mock.calls.find(([url]) => url === path)![1]!.body as string)
}

const empty = { 'GET /api/questions/all': () => envelope(200, page([])) }

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('an unconfirmed account sees the banner and can ask for a new link', async () => {
  const api = mockApi({ ...signedInAs(unconfirmed), ...empty, 'POST /api/auth/resend-verification': () => envelope(200, null) })
  renderWithProviders(<App />, '/questions')

  const banner = await screen.findByRole('region', { name: 'Confirm your e-mail' })
  expect(banner).toHaveTextContent('We sent a link to karim@farm.bd.')
  await userEvent.click(within(banner).getByRole('button', { name: 'Send a new link' }))
  expect(await within(banner).findByText('If the address is registered, a new link is on its way.')).toBeInTheDocument()
  expect(bodyOf(api, '/api/auth/resend-verification')).toEqual({ email: 'karim@farm.bd' })
})

test('a confirmed account has no banner', async () => {
  mockApi({ ...signedInAs({ ...unconfirmed, emailVerified: true }), ...empty })
  renderWithProviders(<App />, '/questions')
  await screen.findByRole('heading', { level: 1, name: 'Questions' })
  expect(screen.queryByRole('region', { name: 'Confirm your e-mail' })).not.toBeInTheDocument()
})

test('a write refused for an unconfirmed e-mail opens the confirm dialog', async () => {
  mockApi({
    ...signedInAs(unconfirmed),
    'GET /api/categories/all': () => envelope(200, page([{ id: 1, categoryName: 'Crops' }])),
    'POST /api/questions/create': () => envelope(403, null, 'Confirm your e-mail address first: open the link we sent you.'),
  })
  renderWithProviders(<App />, '/questions/ask')

  await userEvent.type(await screen.findByLabelText('Your question'), 'Yellow leaves?')
  await userEvent.type(screen.getByLabelText('Details'), 'Boro, 30 days.')
  await userEvent.selectOptions(await screen.findByLabelText('Topic'), 'Crops')
  await userEvent.click(screen.getByRole('button', { name: 'Post question' }))

  const dialog = await screen.findByRole('dialog', { name: 'Confirm your e-mail first' })
  expect(dialog).toHaveTextContent('karim@farm.bd')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Not now' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

test('the link from the e-mail confirms the address and updates the session', async () => {
  const api = mockApi({
    ...signedInAs(unconfirmed),
    'POST /api/auth/verify-email': () => envelope(200, null),
    'GET /api/user/me': () => envelope(200, { ...unconfirmed, emailVerified: true }),
  })
  renderWithProviders(<App />, '/verify-email?token=t-123')

  expect(await screen.findByRole('heading', { name: 'E-mail confirmed' })).toBeInTheDocument()
  expect(bodyOf(api, '/api/auth/verify-email')).toEqual({ token: 't-123' })
  await waitFor(() => expect(screen.queryByRole('region', { name: 'Confirm your e-mail' })).not.toBeInTheDocument())
  expect(api.mock.calls.filter(([url]) => url === '/api/auth/verify-email')).toHaveLength(1)
})

test('an expired link offers a new one by e-mail when signed out', async () => {
  const api = mockApi({
    'POST /api/auth/verify-email': () => envelope(400, null, 'Invalid or expired token.'),
    'POST /api/auth/resend-verification': () => envelope(200, null),
  })
  renderWithProviders(<App />, '/verify-email?token=old')

  expect(await screen.findByRole('heading', { name: 'This link is invalid or has expired' })).toBeInTheDocument()
  await userEvent.type(screen.getByLabelText('E-mail'), 'karim@farm.bd')
  await userEvent.click(screen.getByRole('button', { name: 'Send a new link' }))
  expect(await screen.findByText('If the address is registered, a new link is on its way.')).toBeInTheDocument()
  expect(bodyOf(api, '/api/auth/resend-verification')).toEqual({ email: 'karim@farm.bd' })
})

test('a suspended account is signed out once, with the moderators’ message', async () => {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  const api = mockApi({
    'POST /api/auth/refresh-token': () => envelope(403, null, 'This account has been suspended by the moderators.'),
    'GET /api/feed/latest': () => envelope(200, page([])),
    'GET /api/tags': () => envelope(200, []),
  })
  renderWithProviders(<App />, '/library')

  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/sign-in?next=%2Flibrary'))
  expect(await screen.findAllByText('This account has been suspended by the moderators.')).not.toHaveLength(0)
  expect(hasStoredSession()).toBe(false)
  expect(api.mock.calls.filter(([url]) => url === '/api/auth/refresh-token')).toHaveLength(1)
})
