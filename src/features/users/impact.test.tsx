import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

function profileApi(impact: object) {
  return {
    'GET /api/users/7/profile': () => envelope(200, { userId: 7, name: 'Dr Nasrin', authorId: 3 }),
    'GET /api/authors/3': () => envelope(200, { authorId: 3, name: 'Dr Nasrin', followerCount: 0, publishedPostCount: 0 }),
    'GET /api/users/7/reputation': () => envelope(200, { total: 0, topics: [] }),
    'GET /api/questions/all/user/7': () => envelope(200, page([])),
    'GET /api/answers/all/user/7': () => envelope(200, page([])),
    'GET /api/blogs/all/author/3': () => envelope(200, page([])),
    'GET /api/users/7/impact': () => envelope(200, impact),
  }
}

test('a profile says what the person’s work did, only the parts above zero', async () => {
  mockApi(profileApi({ answers: 42, acceptedAnswers: 12, readersReached: 3400, citedInAiAnswers: 7, storyCitations: 0 }))
  renderWithProviders(<App />, '/users/7')
  const impact = await screen.findByRole('region', { name: 'Impact' })
  expect(within(impact).getByText('Readers reached by answers').nextSibling).toHaveTextContent('3,400')
  expect(within(impact).getByText('Cited in AI answers').nextSibling).toHaveTextContent('7')
  expect(within(impact).queryByText('Story citations')).not.toBeInTheDocument()
})

test('someone just starting gets no impact line', async () => {
  mockApi(profileApi({ answers: 0, readersReached: 0, citedInAiAnswers: 0, storyCitations: 0 }))
  renderWithProviders(<App />, '/users/7')
  await screen.findByRole('heading', { level: 1, name: 'Dr Nasrin' })
  expect(screen.queryByText('Impact')).not.toBeInTheDocument()
})

test('a story the advisor cites says so on its page and in lists', async () => {
  const story = { id: 3, slug: 'oxygen', title: 'Keeping oxygen up', content: '<p>Before sunrise.</p>', status: 'PUBLISHED', publishedAt: '2026-10-30T06:00:00Z', author: { authorId: 1, name: 'Nasrin' }, citedCount: 12 }
  mockApi({
    'GET /api/blogs/slug/oxygen': () => envelope(200, story),
    'GET /api/categories/all': () => envelope(200, page([])),
    'GET /api/feed/latest': () => envelope(200, page([{ ...story, excerpt: 'Before sunrise.' }])),
    'GET /api/feed/trending': () => envelope(200, page([])),
  })
  const view = renderWithProviders(<App />, '/stories/oxygen')
  expect(await screen.findByText('Cited in 12 AI answers')).toBeInTheDocument()
  view.unmount()

  renderWithProviders(<App />, '/stories')
  const tile = (await screen.findAllByRole('link', { name: 'Keeping oxygen up' }))[0].closest('article') ?? document.body
  expect(within(tile as HTMLElement).getByText('Cited in 12 AI answers')).toBeInTheDocument()
})
