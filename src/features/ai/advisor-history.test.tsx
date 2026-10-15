import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

function signedIn(routes: object) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return { 'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 9, name: 'Karim' } }), ...routes }
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('earlier questions are listed and open to their answers', async () => {
  mockApi(
    signedIn({
      'GET /api/ai/history': (url: URL) =>
        url.searchParams.get('pageNo') === '0'
          ? envelope(200, page([{ id: 1, question: 'Blast on boro?', answer: 'Use tricyclazole early.', askedAt: '2026-10-08T06:00:00Z' }], 0, false))
          : envelope(200, page([{ id: 2, question: 'Older one', answer: 'Older answer', askedAt: '2026-09-01T06:00:00Z' }], 1, true)),
    }),
  )
  renderWithProviders(<App />, '/advisor/history')

  const question = await screen.findByText('Blast on boro?')
  expect(screen.getByText('Asked Oct 8')).toBeInTheDocument()
  const details = question.closest('details')!
  expect(details).not.toHaveAttribute('open')
  await userEvent.click(question)
  expect(details).toHaveAttribute('open')
  expect(screen.getByText('Use tricyclazole early.')).toBeVisible()

  await userEvent.click(screen.getByRole('button', { name: 'Show older questions' }))
  expect(await screen.findByText('Older one')).toBeInTheDocument()
})

test('no history says what will appear', async () => {
  mockApi(signedIn({ 'GET /api/ai/history': () => envelope(200, page([])) }))
  renderWithProviders(<App />, '/advisor/history')
  expect(await screen.findByText(/What you ask the advisor is kept here/)).toBeInTheDocument()
})

test('history needs sign-in', async () => {
  mockApi({})
  renderWithProviders(<App />, '/advisor/history')
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/sign-in?next=%2Fadvisor%2Fhistory'))
})

test('an earlier answer lists its sources, stories and community answers alike', async () => {
  mockApi(
    signedIn({
      'GET /api/ai/history': () =>
        envelope(
          200,
          page([
            {
              id: 3,
              question: 'Fog and seedlings?',
              answer: 'Drain at dawn.',
              askedAt: '2026-10-08T06:00:00Z',
              sources: [
                { type: 'blog', blogId: 12, title: 'Boro in a cold snap' },
                { type: 'answer', questionId: 40, title: 'Seedlings yellow after fog' },
              ],
            },
          ]),
        ),
    }),
  )
  renderWithProviders(<App />, '/advisor/history')

  await userEvent.click(await screen.findByText('Fog and seedlings?'))
  expect(screen.getByRole('link', { name: 'Boro in a cold snap' })).toHaveAttribute('href', '/s/12')
  expect(screen.getByRole('link', { name: 'Community answer to: Seedlings yellow after fog' })).toHaveAttribute('href', '/questions/40')
})

const privateAsk = { id: 7, question: 'Calf has a cough.\nWhat now?', answer: 'Keep it warm.', askedAt: '2026-10-08T06:00:00Z' }
const categories = { 'GET /api/categories/all': () => envelope(200, page([{ id: 3, categoryName: 'Livestock' }])) }

test('a private ask is posted for the experts with a topic and title, then links to the question', async () => {
  let published: number | undefined
  const api = mockApi(
    signedIn({
      ...categories,
      'GET /api/ai/history': () => envelope(200, page([{ ...privateAsk, publishedQuestionId: published }])),
      'POST /api/ai/history/7/ask-experts': () => {
        published = 88
        return envelope(200, { questionId: 88, title: 'Calf cough' })
      },
    }),
  )
  renderWithProviders(<App />, '/advisor/history')

  await userEvent.click(await screen.findByText(/Calf has a cough/))
  await userEvent.click(screen.getByRole('button', { name: 'Ask the experts' }))
  await userEvent.click(screen.getByRole('button', { name: 'Post for the experts' }))
  expect(screen.getByLabelText('Topic')).toHaveAccessibleDescription('Choose a topic.')

  await userEvent.selectOptions(await screen.findByLabelText('Topic'), 'Livestock')
  await userEvent.type(screen.getByLabelText('Title (optional)'), 'Calf cough')
  await userEvent.click(screen.getByRole('button', { name: 'Post for the experts' }))

  expect(await screen.findByRole('link', { name: 'Open the question' })).toHaveAttribute('href', '/questions/88')
  const sent = api.mock.calls.find(([url]) => url === '/api/ai/history/7/ask-experts')!
  expect(JSON.parse(sent[1]!.body as string)).toEqual({ categoryId: 3, title: 'Calf cough' })
})

test('already published: a 409 says so and the refetched history links to the question', async () => {
  let published: number | undefined
  mockApi(
    signedIn({
      ...categories,
      'GET /api/ai/history': () => envelope(200, page([{ ...privateAsk, publishedQuestionId: published }])),
      'POST /api/ai/history/7/ask-experts': () => {
        published = 91
        return envelope(409, null, 'This answer was already published as a question.')
      },
    }),
  )
  renderWithProviders(<App />, '/advisor/history')

  await userEvent.click(await screen.findByText(/Calf has a cough/))
  await userEvent.click(screen.getByRole('button', { name: 'Ask the experts' }))
  await userEvent.selectOptions(await screen.findByLabelText('Topic'), 'Livestock')
  await userEvent.click(screen.getByRole('button', { name: 'Post for the experts' }))

  expect(await screen.findByRole('link', { name: 'Open the question' })).toHaveAttribute('href', '/questions/91')
})
