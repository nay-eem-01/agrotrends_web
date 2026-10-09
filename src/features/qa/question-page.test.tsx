import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import type { Question } from '../../api/questions'
import App from '../../App'
import { envelope, mockApi } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const question: Question = {
  questionId: 5,
  userId: 2,
  title: 'Why are my boro seedlings yellow?',
  content: '<p>After the cold week.</p><script>window.__q=1</script>',
  authorName: 'Karim',
  createdAt: '2026-10-08T06:00:00Z',
  agri: { crop: 'boro rice', season: 'RABI' },
}

function answer(answerId: number, overrides = {}) {
  return { answerId, questionId: 5, userId: 7, authorName: 'Nasrin', content: `Answer ${answerId}`, createdAt: `2026-10-0${answerId}T06:00:00Z`, updatedAt: `2026-10-0${answerId}T06:00:00Z`, ...overrides }
}

function signedInAs(user: object) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return { 'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user }) }
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('a question shows its text, context and answers, with replies under their answer only', async () => {
  mockApi({
    'GET /api/questions/id/5': () => envelope(200, question),
    // The backend lists replies among the answers too.
    'GET /api/answers/question/5': () => envelope(200, [answer(1), answer(2), answer(3, { authorName: 'Salma', content: 'A reply' })]),
    'GET /api/answers/replies/1': () => envelope(200, [answer(3, { authorName: 'Salma', content: 'A reply' })]),
    'GET /api/answers/replies/2': () => envelope(200, []),
    'GET /api/answers/replies/3': () => envelope(200, []),
  })
  renderWithProviders(<App />, '/questions/5')

  expect(await screen.findByRole('heading', { level: 1, name: 'Why are my boro seedlings yellow?' })).toBeInTheDocument()
  expect(screen.getByText('After the cold week.')).toBeInTheDocument()
  expect(document.querySelector('script')).toBeNull()
  expect(within(screen.getByRole('list', { name: 'Farming context' })).getByRole('link', { name: /Crop\s*boro rice/ })).toHaveAttribute('href', '/questions?crop=boro+rice')

  await waitFor(() => expect(screen.getByRole('heading', { name: 'Answers (3)' })).toBeInTheDocument())
  expect(screen.getAllByRole('article', { name: 'Answer by Salma' })).toHaveLength(1)
  expect(screen.getByRole('button', { name: 'Sign in to answer' })).toBeInTheDocument()
})

test('answering posts to the question', async () => {
  let answers: object[] = []
  const api = mockApi({
    ...signedInAs({ id: 9, name: 'Nasrin' }),
    'GET /api/questions/id/5': () => envelope(200, question),
    'GET /api/answers/question/5': () => envelope(200, answers),
    'GET /api/answers/replies/4': () => envelope(200, []),
    'POST /api/answers/create': () => {
      answers = [answer(4, { userId: 9, content: 'Drain the cold water.' })]
      return envelope(200, answers[0])
    },
  })
  renderWithProviders(<App />, '/questions/5')

  await userEvent.type(await screen.findByLabelText('Your answer'), 'Drain the cold water.')
  await userEvent.click(screen.getByRole('button', { name: 'Post answer' }))

  expect(await screen.findByText('Drain the cold water.')).toBeInTheDocument()
  const sent = api.mock.calls.find(([url]) => url === '/api/answers/create')!
  expect(JSON.parse(sent[1]!.body as string)).toEqual({ questionId: 5, content: 'Drain the cold water.' })
  expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
})

test('editing an answer uses the answer endpoint', async () => {
  const api = mockApi({
    ...signedInAs({ id: 7, name: 'Nasrin' }),
    'GET /api/questions/id/5': () => envelope(200, question),
    'GET /api/answers/question/5': () => envelope(200, [answer(1)]),
    'GET /api/answers/replies/1': () => envelope(200, []),
    'PUT /api/answers/update/': () => envelope(200, answer(1, { content: 'Better' })),
  })
  renderWithProviders(<App />, '/questions/5')

  const mine = await screen.findByRole('article', { name: 'Answer by Nasrin' })
  await userEvent.click(within(mine).getByRole('button', { name: 'Edit' }))
  await userEvent.clear(within(mine).getByLabelText('Edit your answer'))
  await userEvent.type(within(mine).getByLabelText('Edit your answer'), 'Better')
  await userEvent.click(within(mine).getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(api.mock.calls.some(([url]) => url === '/api/answers/update/')).toBe(true))
  const sent = api.mock.calls.find(([url]) => url === '/api/answers/update/')!
  expect(JSON.parse(sent[1]!.body as string)).toEqual({ answerId: 1, content: 'Better' })
})

test('the asker can delete the question', async () => {
  mockApi({
    ...signedInAs({ id: 2, name: 'Karim' }),
    'GET /api/questions/id/5': () => envelope(200, question),
    'GET /api/answers/question/5': () => envelope(200, []),
    'DELETE /api/questions/id/5/delete': () => envelope(200, null),
    'GET /api/questions/all': () => envelope(200, { content: [], number: 0, last: true }),
  })
  renderWithProviders(<App />, '/questions/5')

  expect(await screen.findByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/questions/5/edit')
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent(/^\/questions$/))
})

test('a missing question is not found', async () => {
  mockApi({ 'GET /api/questions/id/99': () => envelope(404, null), 'GET /api/answers/question/99': () => envelope(404, null) })
  renderWithProviders(<App />, '/questions/99')
  expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
})
