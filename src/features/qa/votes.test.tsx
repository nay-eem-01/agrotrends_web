import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const question = { questionId: 5, userId: 2, title: 'Yellow seedlings', content: 'After the cold.', authorName: 'Karim', score: 4 }
const answer = (answerId: number, overrides = {}) => ({ answerId, questionId: 5, userId: 7, authorName: 'Nasrin', content: `Answer ${answerId}`, score: 2, ...overrides })

function signedInAs(user: object) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return { 'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user }) }
}

function calls(api: ReturnType<typeof mockApi>, method: string, path: string) {
  return api.mock.calls.filter(([url, init]) => (init?.method ?? 'GET') === method && new URL(String(url), 'http://x').pathname === path)
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('upvoting moves the score, and the same arrow again withdraws it', async () => {
  const api = mockApi({
    ...signedInAs({ id: 9, name: 'Salma' }),
    'GET /api/questions/id/5': () => envelope(200, question),
    'GET /api/answers/question/5': () => envelope(200, []),
    'GET /api/questions/id/5/my-votes': () => envelope(200, { answers: {} }),
    'PUT /api/questions/id/5/vote': () => envelope(200, { score: 5, myVote: 'UP' }),
    'DELETE /api/questions/id/5/vote': () => envelope(200, { score: 4 }),
  })
  renderWithProviders(<App />, '/questions/5')

  const up = await screen.findByRole('button', { name: 'Upvote this question' })
  await waitFor(() => expect(calls(api, 'GET', '/api/questions/id/5/my-votes')).toHaveLength(1))
  await userEvent.click(up)
  await waitFor(() => expect(up).toHaveAttribute('aria-pressed', 'true'))
  expect(screen.getAllByText('5').length).toBeGreaterThan(0)
  expect(new URL(String(calls(api, 'PUT', '/api/questions/id/5/vote')[0][0]), 'http://x').searchParams.get('direction')).toBe('UP')

  await userEvent.click(up)
  await waitFor(() => expect(calls(api, 'DELETE', '/api/questions/id/5/vote')).toHaveLength(1))
  await waitFor(() => expect(up).toHaveAttribute('aria-pressed', 'false'))
})

test('a refused downvote rolls back and shows the backend’s message', async () => {
  mockApi({
    ...signedInAs({ id: 9, name: 'Salma' }),
    'GET /api/questions/id/5': () => envelope(200, question),
    'GET /api/answers/question/5': () => envelope(200, [answer(1)]),
    'GET /api/questions/id/5/my-votes': () => envelope(200, { answers: {} }),
    'PUT /api/answers/id/1/vote': () => envelope(403, null, 'You need 50 reputation points to downvote.'),
  })
  renderWithProviders(<App />, '/questions/5')

  const card = await screen.findByRole('article', { name: 'Answer by Nasrin' })
  const down = within(card).getByRole('button', { name: 'Downvote this answer' })
  await userEvent.click(down)
  expect(await within(card).findByRole('alert')).toHaveTextContent('You need 50 reputation points to downvote.')
  expect(down).toHaveAttribute('aria-pressed', 'false')
  expect(within(card).getByText('2')).toBeInTheDocument()
})

test('my votes are marked, and my own answer shows its score without arrows', async () => {
  mockApi({
    ...signedInAs({ id: 7, name: 'Nasrin' }),
    'GET /api/questions/id/5': () => envelope(200, question),
    'GET /api/answers/question/5': () => envelope(200, [answer(1), answer(2, { userId: 8, authorName: 'Rahim' })]),
    'GET /api/questions/id/5/my-votes': () => envelope(200, { question: 'DOWN', answers: { '2': 'UP' } }),
  })
  renderWithProviders(<App />, '/questions/5')

  await waitFor(() => expect(screen.getByRole('button', { name: 'Downvote this question' })).toHaveAttribute('aria-pressed', 'true'))
  const mine = screen.getByRole('article', { name: 'Answer by Nasrin' })
  expect(within(mine).queryByRole('button', { name: /vote this answer/ })).not.toBeInTheDocument()
  expect(within(mine).getByText('2')).toBeInTheDocument()
  const theirs = screen.getByRole('article', { name: 'Answer by Rahim' })
  expect(within(theirs).getByRole('button', { name: 'Upvote this answer' })).toHaveAttribute('aria-pressed', 'true')
})

test('visitors are sent to sign in to vote', async () => {
  mockApi({ 'GET /api/questions/id/5': () => envelope(200, question), 'GET /api/answers/question/5': () => envelope(200, []) })
  renderWithProviders(<App />, '/questions/5')
  await userEvent.click(await screen.findByRole('button', { name: 'Upvote this question' }))
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/sign-in?next=%2Fquestions%2F5'))
})
