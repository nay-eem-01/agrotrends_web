import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

function discoverApi(experts = 0, questions: object[] = []) {
  return mockApi({
    'GET /api/questions/all': () => envelope(200, page(questions)),
    'GET /api/categories/all': () => envelope(200, page([])),
    'GET /api/feed/latest': () => envelope(200, page([])),
    'GET /api/stats/public': () => envelope(200, { members: 18, verifiedExperts: experts, questions: 9, answeredQuestions: 9 }),
  })
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('a visitor types the question on Discover and it goes to the ask form through sign-in', async () => {
  discoverApi()
  renderWithProviders(<App />, '/')

  await userEvent.type(await screen.findByLabelText("What's happening on your farm?"), 'Why are my boro seedlings yellow?')
  await userEvent.click(screen.getByRole('button', { name: 'Ask a question' }))
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/sign-in'))
  const next = new URLSearchParams(screen.getByTestId('path').textContent!.split('?')[1]).get('next')
  expect(next).toBe(`/questions/ask?q=${encodeURIComponent('Why are my boro seedlings yellow?')}`)
})

test('asking with an empty box says what to do and goes nowhere', async () => {
  discoverApi()
  renderWithProviders(<App />, '/')

  await userEvent.click(await screen.findByRole('button', { name: 'Ask a question' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Write your question first.')
  expect(screen.getByLabelText("What's happening on your farm?")).toHaveFocus()
  expect(screen.getByTestId('path')).toHaveTextContent(/^\/$/)
})

test('the ask form opens with what was typed on Discover, split into a title and details', async () => {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  mockApi({
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 9, name: 'Salma', emailVerified: true } }),
    'GET /api/categories/all': () => envelope(200, page([])),
    'GET /api/tags': () => envelope(200, []),
    'GET /api/questions/search': () => envelope(200, page([])),
  })
  renderWithProviders(<App />, `/questions/ask?q=${encodeURIComponent('Tilapia gasping at dawn\nPond of 30 decimals.')}`)

  expect(await screen.findByLabelText('Your question')).toHaveValue('Tilapia gasping at dawn')
  expect(screen.getByRole('textbox', { name: 'Details' })).toHaveTextContent('Pond of 30 decimals.')
})

test('the private way is the advisor, started from this season’s questions, and says experts don’t check it', async () => {
  discoverApi()
  renderWithProviders(<App />, '/')

  const heading = await screen.findByRole('heading', { name: 'Or ask the AI advisor privately' })
  expect(screen.getByText("Answers in seconds, with sources. Experts don't check them, and they can be wrong.")).toBeInTheDocument()
  const list = within(heading.parentElement!).getByRole('list', { name: /^For this .+ season$/ })
  const links = within(list).getAllByRole('link')
  for (const link of links.slice(0, -1)) expect(link.getAttribute('href')).toMatch(/^\/advisor\?q=/)
  expect(within(list).getByRole('link', { name: 'Ask the advisor something else' })).toHaveAttribute('href', '/advisor')
  // Offered once: no second advisor panel further down.
  expect(screen.queryByRole('heading', { name: 'Ask the advisor' })).not.toBeInTheDocument()
})

test('the hero names verified experts only once there are some', async () => {
  discoverApi(0)
  const view = renderWithProviders(<App />, '/')
  expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
  await waitFor(() => expect(screen.queryByText(/verified experts check the answers/)).not.toBeInTheDocument())
  view.unmount()

  discoverApi(4)
  renderWithProviders(<App />, '/')
  expect(await screen.findByText('4 verified experts check the answers')).toBeInTheDocument()
})

test('with no questions yet, Discover offers to ask the first one', async () => {
  discoverApi()
  renderWithProviders(<App />, '/')

  const recent = (await screen.findByRole('heading', { name: 'What farmers are asking' })).closest('section')!
  expect(await within(recent).findByText('No questions yet')).toBeInTheDocument()
  expect(within(recent).getByRole('link', { name: 'Ask a question' })).toHaveAttribute('href', '/questions/ask')
})
