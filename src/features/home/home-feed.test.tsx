import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const story = { id: 3, slug: 'oxygen', title: 'Keeping oxygen up in summer ponds', excerpt: 'Most losses happen before sunrise.', publishedAt: '2026-10-30T06:00:00Z', author: { authorId: 1, name: 'Nasrin' }, category: { id: 2, categoryName: 'Fisheries' } }
const question = { questionId: 5, userId: 2, title: 'Why are my tilapia gasping?', content: '<p>At dawn.</p>', authorName: 'Karim', createdAt: '2026-10-31T06:00:00Z', answerCount: 0, score: 0, category: { id: 2, categoryName: 'Fisheries' } }

function routes(extra = {}) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return {
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 9, name: 'Salma Akter' } }),
    'GET /api/categories/all': () => envelope(200, page([{ id: 1, categoryName: 'Crops' }, { id: 2, categoryName: 'Fisheries' }])),
    'GET /api/questions/all': () => envelope(200, page([question])),
    'GET /api/blogs/all': () => envelope(200, page([story])),
    'GET /api/blogs/all/category/2': () => envelope(200, page([story])),
    'GET /api/feed/trending': () => envelope(200, page([story])),
    'GET /api/feed/trending/questions': () => envelope(200, page([{ ...question, questionId: 8, title: 'Boro seedlings turning yellow', answerCount: 4 }])),
    'GET /api/me/following/tags': () => envelope(200, page(['tilapia'])),
    'GET /api/experts': () => envelope(404, null, 'Not found'),
    'GET /api/notifications/unread-count': () => envelope(200, 0),
    ...extra,
  }
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('signed in, home is one feed of stories and questions with your topics beside it', async () => {
  const api = mockApi(routes())
  renderWithProviders(<App />, '/')

  const feed = await screen.findByRole('region', { name: 'Your feed' })
  await within(feed).findByRole('link', { name: 'Keeping oxygen up in summer ponds' })
  // Newest first: the question (31 Oct) before the story (30 Oct).
  const titles = within(feed).getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
  expect(titles.indexOf('Why are my tilapia gasping?')).toBeLessThan(titles.indexOf('Keeping oxygen up in summer ponds'))
  expect(within(feed).getByRole('link', { name: 'Ask the community, or ask the AI advisor…' })).toHaveAttribute('href', '/questions/ask')

  // Your topics live in the app's sidebar, not in the feed.
  const navigation = screen.getByRole('complementary', { name: 'Navigation' })
  expect(await within(navigation).findByRole('link', { name: 'tilapia' })).toHaveAttribute('href', '/tags/tilapia')
  const rail = screen.getByRole('complementary', { name: 'More to read' })
  // Trending questions and trending stories are two separate lists.
  const asked = await within(rail).findByRole('region', { name: 'Trending questions' })
  expect(within(asked).getByRole('link', { name: 'Boro seedlings turning yellow' })).toHaveAttribute('href', '/questions/8')
  expect(within(asked).getByText('4 answers')).toBeInTheDocument()
  const stories = await within(rail).findByRole('region', { name: 'Trending stories' })
  expect(within(stories).getByRole('link', { name: 'Keeping oxygen up in summer ponds' })).toHaveAttribute('href', '/stories/oxygen')
  // No experts list until the backend has one.
  expect(within(rail).queryByRole('heading', { name: 'Experts to follow' })).not.toBeInTheDocument()

  await userEvent.click(within(screen.getByRole('navigation', { name: 'Topics' })).getByRole('link', { name: 'Fisheries' }))
  await waitFor(() => expect(api.mock.calls.some(([url]) => String(url).startsWith('/api/blogs/all/category/2'))).toBe(true))
  expect(api.mock.calls.some(([url]) => String(url).includes('categoryId=2'))).toBe(true)
})

test('experts to follow appear once the backend serves them, and phones get the quick actions', async () => {
  const api = mockApi(
    routes({
      'GET /api/experts': () => envelope(200, page([{ userId: 7, authorId: 7, name: 'Dr Nasrin', expertField: 'Fish health', institution: 'BAU', followedByMe: false }])),
      'PUT /api/authors/7/follow': () => envelope(200, null),
    }),
  )
  renderWithProviders(<App />, '/')

  const rail = await screen.findByRole('complementary', { name: 'More to read' })
  expect(await within(rail).findByRole('link', { name: /Dr Nasrin/ })).toHaveAttribute('href', '/users/7')
  // Follow right in the list; the author id is the user id.
  await userEvent.click(within(rail).getByRole('button', { name: 'Follow Dr Nasrin' }))
  await waitFor(() => expect(api.mock.calls.some(([url, init]) => String(url) === '/api/authors/7/follow' && init?.method === 'PUT')).toBe(true))
  expect(within(screen.getByRole('navigation', { name: 'Quick actions' })).getByRole('link', { name: 'Ask a question' })).toHaveAttribute('href', '/questions/ask')
})
