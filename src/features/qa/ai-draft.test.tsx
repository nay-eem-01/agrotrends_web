import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const question = { questionId: 5, userId: 2, title: 'Yellow seedlings', content: 'After the cold.', authorName: 'Karim' }

function signedIn(draft: () => Response) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return {
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 9, name: 'Nasrin' } }),
    'GET /api/questions/id/5': () => envelope(200, question),
    'GET /api/answers/question/5': () => envelope(200, []),
    'POST /api/questions/id/5/ai-draft': draft,
  }
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('an unanswered question offers a labelled AI draft with its sources', async () => {
  mockApi({
    ...signedIn(() =>
      envelope(200, { label: 'AI-generated draft, not reviewed by an expert', answer: 'Drain cold water at night.', sources: [{ blogId: 40, title: 'Boro in cold spells' }] }),
    ),
    'GET /api/blogs/id/40': () => envelope(200, { id: 40, slug: 'boro-cold', title: 'Boro in cold spells' }),
    'GET /api/blogs/slug/boro-cold': () => envelope(200, { id: 40, slug: 'boro-cold', title: 'Boro in cold spells', status: 'PUBLISHED' }),
    'GET /api/comments/blog/40': () => envelope(200, []),
    'GET /api/bookmarks': () => envelope(200, page([])),
    'GET /api/blogs/id/40/claps': () => envelope(200, { totalClaps: 0, myClaps: 0 }),
  })
  renderWithProviders(<App />, '/questions/5')

  await userEvent.click(await screen.findByRole('button', { name: 'See an AI draft answer' }))
  const draft = await screen.findByRole('complementary', { name: 'AI draft answer' })
  expect(within(draft).getByText('AI-generated draft, not reviewed by an expert')).toBeInTheDocument()
  expect(within(draft).getByText('Drain cold water at night.')).toBeInTheDocument()

  await userEvent.click(within(draft).getByRole('link', { name: 'Boro in cold spells' }))
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/stories/boro-cold'))
})

test('an unavailable AI says why', async () => {
  mockApi(signedIn(() => envelope(503, null, 'The AI advisor is not available right now. Please try again later.')))
  renderWithProviders(<App />, '/questions/5')

  await userEvent.click(await screen.findByRole('button', { name: 'See an AI draft answer' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('The AI advisor is not available right now.')
})

test('visitors sign in before asking the AI', async () => {
  mockApi({ 'GET /api/questions/id/5': () => envelope(200, question), 'GET /api/answers/question/5': () => envelope(200, []) })
  renderWithProviders(<App />, '/questions/5')

  await userEvent.click(await screen.findByRole('button', { name: 'See an AI draft answer' }))
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/sign-in?next=%2Fquestions%2F5'))
})

test('answered questions have no AI offer', async () => {
  mockApi({
    'GET /api/questions/id/5': () => envelope(200, question),
    'GET /api/answers/question/5': () => envelope(200, [{ answerId: 1, userId: 3, authorName: 'A', content: 'x', createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z' }]),
    'GET /api/answers/replies/1': () => envelope(200, []),
  })
  renderWithProviders(<App />, '/questions/5')

  await screen.findByRole('heading', { name: 'Answers (1)' })
  expect(screen.queryByRole('button', { name: 'See an AI draft answer' })).not.toBeInTheDocument()
})
