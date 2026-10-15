import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const question = { questionId: 5, userId: 2, title: 'Yellow seedlings', content: 'After the cold.', authorName: 'Karim' }
const answer = (answerId: number, name: string, overrides = {}) => ({ answerId, questionId: 5, userId: 10 + answerId, authorName: name, content: `Answer ${answerId}`, score: 0, ...overrides })

function signedInAs(user: object) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return { 'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user }) }
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('the asker accepts an answer, which moves to the top, and can take it back', async () => {
  let accepted: number | null = null
  const list = () =>
    accepted === 2 ? [answer(2, 'Rahim', { accepted: true }), answer(1, 'Nasrin')] : [answer(1, 'Nasrin'), answer(2, 'Rahim')]
  const api = mockApi({
    ...signedInAs({ id: 2, name: 'Karim' }),
    'GET /api/questions/id/5': () => envelope(200, { ...question, acceptedAnswerId: accepted }),
    'GET /api/answers/question/5': () => envelope(200, list()),
    'GET /api/questions/id/5/my-votes': () => envelope(200, { answers: {} }),
    'PUT /api/answers/id/2/accept': () => {
      accepted = 2
      return envelope(200, answer(2, 'Rahim', { accepted: true }))
    },
    'DELETE /api/answers/id/2/accept': () => {
      accepted = null
      return envelope(200, answer(2, 'Rahim'))
    },
  })
  renderWithProviders(<App />, '/questions/5')

  const rahim = await screen.findByRole('article', { name: 'Answer by Rahim' })
  await userEvent.click(within(rahim).getByRole('button', { name: 'Accept answer' }))

  await waitFor(() => expect(screen.getAllByRole('article', { name: /^Answer by/ })[0]).toHaveAccessibleName('Answer by Rahim'))
  const top = screen.getAllByRole('article', { name: /^Answer by/ })[0]
  expect(within(top).getByText('Accepted by the asker')).toBeInTheDocument()
  expect(within(top).getByRole('button', { name: 'Accepted' })).toHaveAttribute('aria-pressed', 'true')

  await userEvent.click(within(top).getByRole('button', { name: 'Accepted' }))
  await waitFor(() => expect(api.mock.calls.some(([url, init]) => url === '/api/answers/id/2/accept' && init?.method === 'DELETE')).toBe(true))
  await waitFor(() => expect(screen.queryByText('Accepted by the asker')).not.toBeInTheDocument())
})

test('others see the accepted mark but no accept button', async () => {
  mockApi({
    ...signedInAs({ id: 9, name: 'Salma' }),
    'GET /api/questions/id/5': () => envelope(200, { ...question, acceptedAnswerId: 2 }),
    'GET /api/answers/question/5': () => envelope(200, [answer(2, 'Rahim', { accepted: true }), answer(1, 'Nasrin')]),
    'GET /api/questions/id/5/my-votes': () => envelope(200, { answers: {} }),
  })
  renderWithProviders(<App />, '/questions/5')

  const rahim = await screen.findByRole('article', { name: 'Answer by Rahim' })
  expect(within(rahim).getByText('Accepted by the asker')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Accept/ })).not.toBeInTheDocument()
})
