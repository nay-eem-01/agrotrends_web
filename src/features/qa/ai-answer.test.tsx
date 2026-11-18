import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const question = { questionId: 5, userId: 2, title: 'Yellow seedlings', content: 'After the cold.', authorName: 'Karim' }
const DISCLAIMER = 'AI answers can be wrong. Before using any pesticide, medicine or dose, check with your local agriculture officer or vet.'
const ai = (overrides = {}) => ({
  id: 1,
  questionId: 5,
  answer: 'Likely cold injury. Keep water on the field at night.',
  sources: [
    { type: 'blog', blogId: 12, title: 'Boro in a cold snap' },
    { type: 'answer', questionId: 40, title: 'Seedlings yellow after fog' },
  ],
  status: 'UNCHECKED',
  disclaimer: DISCLAIMER,
  ...overrides,
})

function routes(aiAnswer: () => Response, answers: object[] = []) {
  return {
    'GET /api/questions/id/5': () => envelope(200, question),
    'GET /api/answers/question/5': () => envelope(200, answers),
    'GET /api/questions/id/5/ai-answer': aiAnswer,
  }
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

test('an unchecked AI answer is labelled, sourced and carries the disclaimer, apart from people’s answers', async () => {
  mockApi(routes(() => envelope(200, ai())))
  renderWithProviders(<App />, '/questions/5')

  const card = await screen.findByRole('region', { name: 'AI answer' })
  expect(within(card).getByText('Not yet checked by an expert')).toBeInTheDocument()
  expect(within(card).getByText(DISCLAIMER)).toBeInTheDocument()
  expect(within(card).getByRole('link', { name: 'Boro in a cold snap' })).toHaveAttribute('href', '/s/12')
  expect(screen.getByRole('heading', { name: '0 answers' })).toBeInTheDocument()
})

test('a confirmed answer names the expert; a corrected one links to the expert’s answer', async () => {
  mockApi(routes(() => envelope(200, ai({ status: 'CONFIRMED', reviewerName: 'Dr Nasrin', reviewedAt: '2026-10-14T06:00:00Z' }))))
  const { unmount } = renderWithProviders(<App />, '/questions/5')
  expect(await screen.findByText('Confirmed by Dr Nasrin')).toBeInTheDocument()
  unmount()

  mockApi(
    routes(
      () => envelope(200, ai({ status: 'CORRECTED', reviewerName: 'Dr Nasrin', correctionAnswerId: 31 })),
      [{ answerId: 31, questionId: 5, userId: 7, authorName: 'Dr Nasrin', content: 'It is zinc deficiency.' }],
    ),
  )
  renderWithProviders(<App />, '/questions/5')
  expect(await screen.findByText('Corrected by Dr Nasrin')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: "Read the expert's corrected answer" })).toHaveAttribute('href', '#answer-31')
  expect(await screen.findByRole('article', { name: 'Answer by Dr Nasrin' })).toHaveAttribute('id', 'answer-31')
})

test('no AI answer (404) shows nothing', async () => {
  mockApi(routes(() => envelope(404, null, 'Not found')))
  renderWithProviders(<App />, '/questions/5')
  await screen.findByRole('heading', { name: '0 answers' })
  expect(screen.queryByRole('region', { name: 'AI answer' })).not.toBeInTheDocument()
  expect(screen.queryByText(/being written/)).not.toBeInTheDocument()
})

test('after asking, the page waits for the AI answer and shows it when it arrives', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  let ready = false
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  mockApi({
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 2, name: 'Karim' } }),
    'GET /api/categories/all': () => envelope(200, page([{ id: 1, categoryName: 'Crops' }])),
    'POST /api/questions/create': () => envelope(200, question),
    'GET /api/questions/id/5/my-votes': () => envelope(200, { answers: {} }),
    ...routes(() => (ready ? envelope(200, ai()) : envelope(404, null))),
  })
  renderWithProviders(<App />, '/questions/ask')
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

  await user.type(await screen.findByLabelText('Your question'), 'Yellow seedlings')
  await user.type(screen.getByLabelText('Details'), 'After the cold.')
  await user.click(await screen.findByRole('radio', { name: 'Crops' }))
  await user.click(screen.getByRole('button', { name: 'Post question' }))

  expect(await screen.findByText('An AI answer is being written. Experts in this topic will check it.')).toBeInTheDocument()
  ready = true
  await act(async () => {
    vi.advanceTimersByTime(3100)
  })
  await waitFor(() => expect(screen.getByRole('region', { name: 'AI answer' })).toBeInTheDocument())
})

test('a community-answer source links to its question', async () => {
  mockApi(routes(() => envelope(200, ai())))
  renderWithProviders(<App />, '/questions/5')
  const card = await screen.findByRole('region', { name: 'AI answer' })
  expect(within(card).getByRole('link', { name: 'Community answer to: Seedlings yellow after fog' })).toHaveAttribute('href', '/questions/40')
})
