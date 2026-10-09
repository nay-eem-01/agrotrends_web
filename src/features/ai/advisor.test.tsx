import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi } from '../../test/api'
import { renderWithProviders } from '../../test/render'

function signedIn(ask: () => Response) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return {
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 9, name: 'Karim' } }),
    'POST /api/ai/ask': ask,
  }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 8, 12))
  localStorage.clear()
  clearSession()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

test('an answer shows with the stories it came from, and the box clears for the next', async () => {
  const api = mockApi(
    signedIn(() => envelope(200, { answer: 'Transplant 25-30 day seedlings in July.', sources: [{ blogId: 40, title: 'Aman transplanting' }] })),
  )
  renderWithProviders(<App />, '/advisor')

  await userEvent.click(await screen.findByRole('button', { name: 'When should I transplant aman seedlings?' }))
  await userEvent.click(screen.getByRole('button', { name: 'Ask' }))

  const conversation = await screen.findByRole('list', { name: 'This conversation' })
  expect(within(conversation).getByText('When should I transplant aman seedlings?')).toBeInTheDocument()
  expect(within(conversation).getByText('Transplant 25-30 day seedlings in July.')).toBeInTheDocument()
  expect(within(conversation).getByRole('link', { name: 'Aman transplanting' })).toHaveAttribute('href', '/s/40')
  expect(screen.getByLabelText('Ask another question')).toHaveValue('')
  const sent = api.mock.calls.find(([url]) => url === '/api/ai/ask')!
  expect(JSON.parse(sent[1]!.body as string)).toEqual({ question: 'When should I transplant aman seedlings?' })
})

test('the examples follow the season', async () => {
  mockApi(signedIn(() => envelope(200, {})))
  renderWithProviders(<App />, '/advisor')
  expect(await screen.findByRole('heading', { name: 'For this Kharif-2 season' })).toBeInTheDocument()
})

test('an answer without matching stories says it is general', async () => {
  mockApi(signedIn(() => envelope(200, { answer: 'Rotate crops.', sources: [] })))
  renderWithProviders(<App />, '/advisor')

  await userEvent.type(await screen.findByLabelText('Your question'), 'Crop rotation?')
  await userEvent.click(screen.getByRole('button', { name: 'Ask' }))
  expect(await screen.findByText('No story on AgroTrends matched, so this answer is general advice.')).toBeInTheDocument()
})

test('the daily limit and an AI outage are explained', async () => {
  let calls = 0
  mockApi(
    signedIn(() =>
      ++calls === 1
        ? envelope(429, null, "You've reached today's limit for AI questions. Try again tomorrow.")
        : envelope(503, null, 'The AI advisor is not available right now. Please try again later.'),
    ),
  )
  renderWithProviders(<App />, '/advisor')

  await userEvent.type(await screen.findByLabelText('Your question'), 'Blast?')
  await userEvent.click(screen.getByRole('button', { name: 'Ask' }))
  expect(await screen.findByRole('alert')).toHaveTextContent("today's limit")
  await userEvent.click(screen.getByRole('button', { name: 'Ask' }))
  expect(await screen.findByText(/not available right now/)).toBeInTheDocument()
  expect(screen.getByLabelText('Your question')).toHaveValue('Blast?')
})

test('visitors are asked to sign in', async () => {
  const api = mockApi({})
  renderWithProviders(<App />, '/advisor')

  await userEvent.type(screen.getByLabelText('Your question'), 'Blast?')
  await userEvent.click(screen.getByRole('button', { name: 'Sign in to ask' }))
  expect(screen.getByTestId('path')).toHaveTextContent('/sign-in?next=%2Fadvisor')
  expect(api).not.toHaveBeenCalled()
})
