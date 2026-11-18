import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../api/client'
import App from '../App'
import { envelope, mockApi, page } from '../test/api'
import { renderWithProviders } from '../test/render'

const question = { questionId: 5, userId: 2, title: 'Yellow seedlings', content: 'After the cold.', authorName: 'Karim', score: 0, answerCount: 0, createdAt: '2026-10-31T06:00:00Z' }
const story = { id: 3, slug: 'oxygen', title: 'Keeping oxygen up in summer ponds', content: '<p>Before sunrise.</p>', status: 'PUBLISHED', publishedAt: '2026-10-30T06:00:00Z', author: { authorId: 1, name: 'Nasrin' } }

function signedIn() {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return { 'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 9, name: 'Salma', authorId: 9 } }) }
}

function requested(api: ReturnType<typeof mockApi>, path: string) {
  return api.mock.calls.some(([url]) => new URL(String(url), 'http://x').pathname === path)
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('a question page asks for its answers, AI answer and my votes beside the question, not after it', async () => {
  let release: (response: Response) => void = () => {}
  const api = mockApi({
    ...signedIn(),
    'GET /api/questions/id/5': () => new Promise<Response>((resolve) => (release = resolve)),
    'GET /api/answers/question/5': () => envelope(200, []),
    'GET /api/questions/id/5/ai-answer': () => envelope(404, null, 'Not found'),
    'GET /api/questions/id/5/my-votes': () => envelope(200, { answers: {} }),
    'GET /api/notifications/unread-count': () => envelope(200, 0),
  })
  renderWithProviders(<App />, '/questions/5')

  // The question hasn't answered yet, and the other three are already on their way.
  await waitFor(() => expect(requested(api, '/api/questions/id/5/my-votes')).toBe(true))
  expect(requested(api, '/api/answers/question/5')).toBe(true)
  expect(requested(api, '/api/questions/id/5/ai-answer')).toBe(true)

  release(envelope(200, question))
  expect(await screen.findByRole('heading', { level: 1, name: 'Yellow seedlings' })).toBeInTheDocument()
  // The views below reuse those answers instead of asking again.
  expect(api.mock.calls.filter(([url]) => new URL(String(url), 'http://x').pathname === '/api/answers/question/5')).toHaveLength(1)
})

test('resting the pointer on a question link starts its data before the click; pressing a story link starts the story', async () => {
  const api = mockApi({
    'GET /api/categories/all': () => envelope(200, page([])),
    'GET /api/questions/all': () => envelope(200, page([question])),
    'GET /api/feed/trending': () => envelope(200, page([])),
    'GET /api/feed/trending/questions': () => envelope(200, page([])),
    'GET /api/feed/latest': () => envelope(200, page([{ ...story, excerpt: 'Before sunrise.' }])),
    'GET /api/experts': () => envelope(200, page([])),
    'GET /api/questions/id/5': () => envelope(200, question),
    'GET /api/answers/question/5': () => envelope(200, []),
    'GET /api/questions/id/5/ai-answer': () => envelope(404, null, 'Not found'),
    'GET /api/blogs/slug/oxygen': () => envelope(200, story),
  })
  renderWithProviders(<App />, '/')

  const link = await screen.findByRole('link', { name: 'Yellow seedlings' })
  expect(requested(api, '/api/questions/id/5')).toBe(false)
  await userEvent.hover(link)
  await waitFor(() => expect(requested(api, '/api/questions/id/5')).toBe(true))
  expect(requested(api, '/api/answers/question/5')).toBe(true)
  expect(requested(api, '/api/questions/id/5/ai-answer')).toBe(true)

  const storyLink = (await screen.findAllByRole('link', { name: 'Keeping oxygen up in summer ponds' }))[0]
  await userEvent.pointer({ keys: '[MouseLeft>]', target: storyLink })
  await waitFor(() => expect(requested(api, '/api/blogs/slug/oxygen')).toBe(true))
})
