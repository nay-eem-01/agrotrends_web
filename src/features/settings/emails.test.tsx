import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { setLang } from '../../lib/i18n'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

function signedIn(user: object, settings = { preferredLang: 'en', emailOnAnswer: true, emailWeeklyDigest: true }) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return {
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user }),
    'GET /api/user/settings': () => envelope(200, settings),
    // The backend answers with the settings as saved.
    'PUT /api/user/settings': (_url: URL, init: RequestInit | undefined) => envelope(200, { ...settings, ...JSON.parse(init!.body as string) }),
  }
}

function sent(api: ReturnType<typeof mockApi>, method: string) {
  return api.mock.calls
    .filter(([url, init]) => new URL(String(url), 'http://x').pathname === '/api/user/settings' && init?.method === method)
    .map(([, init]) => JSON.parse(init!.body as string))
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => {
  setLang('en')
  vi.unstubAllGlobals()
})

const confirmed = { id: 9, name: 'Salma', email: 'salma@farm.bd', emailVerified: true }

test('settings switch each e-mail on and off, one field at a time', async () => {
  const api = mockApi(signedIn(confirmed, { preferredLang: 'en', emailOnAnswer: true, emailWeeklyDigest: false }))
  renderWithProviders(<App />, '/settings')

  const section = within((await screen.findByRole('heading', { name: 'E-mails' })).closest('section')!)
  const answers = await section.findByRole('checkbox', { name: 'When someone answers my question' })
  const digest = section.getByRole('checkbox', { name: 'A weekly digest' })
  expect(answers).toBeChecked()
  expect(digest).not.toBeChecked()

  await userEvent.click(answers)
  await waitFor(() => expect(sent(api, 'PUT')).toEqual([{ emailOnAnswer: false }]))
  expect(answers).not.toBeChecked()
  expect(section.queryByText(/to get these e-mails/)).not.toBeInTheDocument()
})

test('without a confirmed address, the e-mail settings say what is missing', async () => {
  mockApi(signedIn({ ...confirmed, emailVerified: false }))
  renderWithProviders(<App />, '/settings')
  expect(await screen.findByText('Confirm salma@farm.bd (above) to get these e-mails.')).toBeInTheDocument()
})

test('switching language while signed in saves it, so e-mails come in it too', async () => {
  const api = mockApi({ ...signedIn(confirmed), 'GET /api/categories/all': () => envelope(200, page([])), 'GET /api/tags': () => envelope(200, []) })
  renderWithProviders(<App />, '/about')
  await screen.findByRole('heading', { level: 1, name: 'About us' })
  // Signed in once the account menu is there.
  await screen.findByRole('button', { name: 'Account' })
  await userEvent.click(within(screen.getByRole('contentinfo')).getByRole('button', { name: 'বাংলা' }))
  await waitFor(() => expect(sent(api, 'PUT')).toEqual([{ preferredLang: 'bn' }]))
})

test('the unsubscribe link lands on a page that says which e-mails stopped, or that the link was bad', async () => {
  mockApi({})
  const view = renderWithProviders(<App />, '/unsubscribed?kind=digest')
  expect(await screen.findByRole('heading', { level: 1, name: 'No more weekly digests' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Open settings' })).toHaveAttribute('href', '/settings#emails')
  view.unmount()

  renderWithProviders(<App />, '/unsubscribed?kind=answer&error=invalid')
  expect(await screen.findByRole('heading', { level: 1, name: 'This unsubscribe link didn’t work' })).toBeInTheDocument()
})

test('after posting, the asker is told an e-mail will come, or where answers will show', async () => {
  const question = { questionId: 12, userId: 9, title: 'Tilapia gasping', content: '<p>At dawn.</p>', authorName: 'Salma', category: { id: 2, categoryName: 'Fisheries' } }
  const api = {
    'GET /api/categories/all': () => envelope(200, page([{ id: 2, categoryName: 'Fisheries' }])),
    'GET /api/tags': () => envelope(200, []),
    'GET /api/questions/search': () => envelope(200, page([])),
    'POST /api/questions/create': () => envelope(200, question),
    'GET /api/questions/id/12': () => envelope(200, question),
    'GET /api/answers/question/12': () => envelope(200, []),
  }
  async function ask() {
    await userEvent.type(await screen.findByLabelText('Your question'), 'Tilapia gasping')
    await userEvent.click(screen.getByRole('textbox', { name: 'Details' }))
    await userEvent.keyboard('At dawn.')
    await userEvent.click(await screen.findByRole('radio', { name: 'Fisheries' }))
    await userEvent.click(screen.getByRole('button', { name: 'Post question' }))
  }

  mockApi({ ...signedIn(confirmed), ...api })
  const view = renderWithProviders(<App />, '/questions/ask')
  await ask()
  expect(await screen.findByText('Posted. We’ll e-mail salma@farm.bd when someone answers.')).toBeInTheDocument()
  view.unmount()
  clearSession()

  mockApi({ ...signedIn({ id: 9, name: 'Salma', mobileNumber: '+8801712345678' }), ...api })
  renderWithProviders(<App />, '/questions/ask')
  await ask()
  expect(await screen.findByText('Posted. Answers will show up in your notifications.')).toBeInTheDocument()
})
