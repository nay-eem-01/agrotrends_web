import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const question = { questionId: 5, userId: 2, title: 'Calf cough', content: 'Since Monday.', authorName: 'Karim', category: { id: 3, categoryName: 'Livestock' } }
const unchecked = { id: 1, questionId: 5, answer: 'Give it honey.', status: 'UNCHECKED', disclaimer: 'AI answers can be wrong.' }

function signedInWith(badges: string[], topicId = 3) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return {
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 7, name: 'Dr Nasrin' } }),
    'GET /api/users/7/reputation': () => envelope(200, { total: 900, topics: [{ categoryId: topicId, categoryName: 'Livestock', points: 900, badges }] }),
    'GET /api/questions/id/5/my-votes': () => envelope(200, { answers: {} }),
  }
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('a verified expert in the topic confirms the AI answer on the question page', async () => {
  let status = 'UNCHECKED'
  const api = mockApi({
    ...signedInWith(['VERIFIED_EXPERT']),
    'GET /api/questions/id/5': () => envelope(200, question),
    'GET /api/answers/question/5': () => envelope(200, []),
    'GET /api/questions/id/5/ai-answer': () => envelope(200, { ...unchecked, status, reviewerName: status === 'CONFIRMED' ? 'Dr Nasrin' : undefined }),
    'POST /api/questions/id/5/ai-answer/confirm': () => {
      status = 'CONFIRMED'
      return envelope(200, null)
    },
  })
  renderWithProviders(<App />, '/questions/5')

  const card = await screen.findByRole('region', { name: 'AI answer' })
  await userEvent.click(await within(card).findByRole('button', { name: 'Confirm' }))
  expect(await screen.findByText('Confirmed by Dr Nasrin')).toBeInTheDocument()
  expect(api.mock.calls.some(([url, init]) => url === '/api/questions/id/5/ai-answer/confirm' && init?.method === 'POST')).toBe(true)
})

test('a correction is posted as the expert’s answer', async () => {
  const api = mockApi({
    ...signedInWith(['VERIFIED_EXPERT']),
    'GET /api/questions/id/5': () => envelope(200, question),
    'GET /api/answers/question/5': () => envelope(200, []),
    'GET /api/questions/id/5/ai-answer': () => envelope(200, unchecked),
    'POST /api/questions/id/5/ai-answer/correct': () => envelope(200, null),
  })
  renderWithProviders(<App />, '/questions/5')

  const card = await screen.findByRole('region', { name: 'AI answer' })
  await userEvent.click(await within(card).findByRole('button', { name: 'Correct' }))
  await userEvent.type(within(card).getByLabelText('Your corrected answer'), 'Isolate it and call a vet; honey does nothing.')
  await userEvent.click(within(card).getByRole('button', { name: 'Post correction' }))
  await waitFor(() => expect(api.mock.calls.some(([url]) => url === '/api/questions/id/5/ai-answer/correct')).toBe(true))
  const sent = api.mock.calls.find(([url]) => url === '/api/questions/id/5/ai-answer/correct')!
  expect(JSON.parse(sent[1]!.body as string)).toEqual({ content: 'Isolate it and call a vet; honey does nothing.' })
})

test('a top contributor can only flag; someone else’s second review shows the backend’s message', async () => {
  mockApi({
    ...signedInWith(['TOP_CONTRIBUTOR']),
    'GET /api/questions/id/5': () => envelope(200, question),
    'GET /api/answers/question/5': () => envelope(200, []),
    'GET /api/questions/id/5/ai-answer': () => envelope(200, unchecked),
    'POST /api/questions/id/5/ai-answer/flag': () => envelope(409, null, 'This AI answer has already been reviewed.'),
  })
  renderWithProviders(<App />, '/questions/5')

  const card = await screen.findByRole('region', { name: 'AI answer' })
  await userEvent.click(await within(card).findByRole('button', { name: 'Flag' }))
  expect(within(card).queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
  await userEvent.click(within(card).getByRole('button', { name: 'Flag' }))
  expect(await within(card).findByRole('alert')).toHaveTextContent('This AI answer has already been reviewed.')
})

test('no review buttons for people without a badge in that topic', async () => {
  mockApi({
    ...signedInWith(['VERIFIED_EXPERT'], 9),
    'GET /api/questions/id/5': () => envelope(200, question),
    'GET /api/answers/question/5': () => envelope(200, []),
    'GET /api/questions/id/5/ai-answer': () => envelope(200, unchecked),
  })
  renderWithProviders(<App />, '/questions/5')
  await screen.findByRole('region', { name: 'AI answer' })
  await waitFor(() => expect(screen.queryByText('Review as an expert')).not.toBeInTheDocument())
})

test('the review queue lists unchecked answers; the menu shows it to experts only', async () => {
  mockApi({
    ...signedInWith(['VERIFIED_EXPERT']),
    'GET /api/review-queue': () =>
      envelope(200, page([{ questionId: 5, questionTitle: 'Calf cough', questionContent: 'Since Monday.', topic: { id: 3, categoryName: 'Livestock' }, aiAnswer: unchecked }])),
  })
  renderWithProviders(<App />, '/review')

  const item = await screen.findByRole('article', { name: 'Calf cough' })
  expect(within(item).getByText('Give it honey.')).toBeInTheDocument()
  expect(within(item).getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /Account/ }))
  expect(await screen.findByRole('menuitem', { name: 'Review queue' })).toHaveAttribute('href', '/review')
})

test('the queue explains itself to non-experts (403)', async () => {
  mockApi({ ...signedInWith([]), 'GET /api/review-queue': () => envelope(403, null, 'Forbidden') })
  renderWithProviders(<App />, '/review')
  expect(await screen.findByText('The review queue is for verified experts.')).toBeInTheDocument()
})
