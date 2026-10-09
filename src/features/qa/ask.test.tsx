import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi } from '../../test/api'
import { renderWithProviders } from '../../test/render'

function signedInAs(user: object) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return { 'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user }) }
}

const question = { questionId: 5, userId: 9, title: 'Yellow seedlings', content: '<p>After the cold.</p><p>Week two.</p>', authorName: 'Karim', agri: { crop: 'boro rice', season: 'RABI' } }

function body(api: ReturnType<typeof mockApi>, path: string) {
  return JSON.parse(api.mock.calls.find(([url]) => url === path)![1]!.body as string)
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('asking needs sign-in', async () => {
  mockApi({})
  renderWithProviders(<App />, '/questions/ask')
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/sign-in?next=%2Fquestions%2Fask'))
})

test('a question is checked, posted with its farming details and opened', async () => {
  const api = mockApi({
    ...signedInAs({ id: 9, name: 'Karim' }),
    'POST /api/questions/create': () => envelope(200, { ...question, questionId: 12 }),
    'GET /api/questions/id/12': () => envelope(200, { ...question, questionId: 12 }),
    'GET /api/answers/question/12': () => envelope(200, []),
  })
  renderWithProviders(<App />, '/questions/ask')

  await userEvent.click(await screen.findByRole('button', { name: 'Post question' }))
  expect(screen.getByLabelText('Your question')).toHaveAccessibleDescription('Write your question in a line.')
  expect(screen.getByLabelText('Details')).toHaveAccessibleDescription('Add what you have seen and tried.')

  await userEvent.type(screen.getByLabelText('Your question'), ' Why are seedlings yellow? ')
  await userEvent.type(screen.getByLabelText('Details'), 'BRRI dhan29, 30 days old.')
  await userEvent.click(screen.getByRole('radio', { name: /Rabi/ }))
  await userEvent.type(screen.getByLabelText('Crop'), 'boro rice')
  await userEvent.click(screen.getByRole('button', { name: 'Post question' }))

  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/questions/12'))
  expect(body(api, '/api/questions/create')).toEqual({
    title: 'Why are seedlings yellow?',
    content: 'BRRI dhan29, 30 days old.',
    agri: { crop: 'boro rice', season: 'RABI' },
  })
})

test('the asker edits their question as plain text', async () => {
  const api = mockApi({
    ...signedInAs({ id: 9, name: 'Karim' }),
    'GET /api/questions/id/5': () => envelope(200, question),
    'PUT /api/questions/update': () => envelope(200, question),
    'GET /api/answers/question/5': () => envelope(200, []),
  })
  renderWithProviders(<App />, '/questions/5/edit')

  expect(await screen.findByLabelText('Your question')).toHaveValue('Yellow seedlings')
  expect(screen.getByLabelText('Details')).toHaveValue('After the cold. Week two.')
  expect(screen.getByLabelText('Crop')).toHaveValue('boro rice')
  await userEvent.click(screen.getByRole('button', { name: 'Save question' }))

  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/questions/5'))
  expect(body(api, '/api/questions/update')).toMatchObject({ questionId: 5, title: 'Yellow seedlings', agri: { crop: 'boro rice', season: 'RABI' } })
})

test("someone else's question can't be edited", async () => {
  mockApi({ ...signedInAs({ id: 10, name: 'Other' }), 'GET /api/questions/id/5': () => envelope(200, question) })
  renderWithProviders(<App />, '/questions/5/edit')
  expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
})
