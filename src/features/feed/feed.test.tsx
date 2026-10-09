import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { BlogResponse } from '../../api/types'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

function story(id: number, overrides: Partial<BlogResponse> = {}): BlogResponse {
  return {
    id,
    slug: `story-${id}`,
    title: `Story ${id}`,
    content: `<p>Body of story ${id}.</p>`,
    readingTimeMinutes: 3,
    clapCount: 0,
    author: { authorId: 7, name: 'Nasrin Akter' },
    publishedAt: '2026-10-07T10:00:00Z',
    agri: {},
    ...overrides,
  }
}

const reader = { id: 1, name: 'Karim', email: 'karim@farm.bd' }

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('visitors see the latest stories without a For you tab', async () => {
  const api = mockApi({
    'GET /api/feed/latest': () =>
      envelope(200, page([story(1, { title: 'Boro rice in Rangpur', clapCount: 12, agri: { crop: 'boro rice', season: 'RABI' }, imageUrl: '/uploads/a.jpg' })])),
  })
  renderWithProviders(<App />, '/')

  const card = (await screen.findByRole('link', { name: 'Boro rice in Rangpur' })).closest('article')!
  expect(card).toHaveAttribute('class', expect.stringContaining('border-b'))
  expect(within(card).getByRole('link', { name: 'Boro rice in Rangpur' })).toHaveAttribute('href', '/stories/story-1')
  expect(within(card).getByRole('link', { name: 'Nasrin Akter' })).toHaveAttribute('href', '/authors/7')
  expect(within(card).getByText('Body of story 1.')).toBeInTheDocument()
  expect(within(card).getByText(/3 min read/)).toBeInTheDocument()
  expect(within(card).getByLabelText('12 claps')).toBeInTheDocument()
  expect(within(card).getByText('boro rice')).toBeInTheDocument()
  expect(within(card).getByText('Rabi')).toBeInTheDocument()

  const tabs = screen.getByRole('navigation', { name: 'Feeds' })
  expect(within(tabs).queryByRole('link', { name: 'For you' })).not.toBeInTheDocument()
  expect(within(tabs).getByRole('link', { name: 'Latest' })).toHaveAttribute('aria-current', 'page')
  expect(new URL(String(api.mock.calls[0][0]), 'http://x').searchParams.get('pageSize')).toBe('10')
})

test('signed-in readers start on For you, sent with their token', async () => {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  const api = mockApi({
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: reader }),
    'GET /api/feed/following': () => envelope(200, page([story(2, { title: 'From someone you follow' })])),
  })
  renderWithProviders(<App />, '/')

  expect(await screen.findByRole('link', { name: 'From someone you follow' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'For you' })).toHaveAttribute('aria-current', 'page')
  const feedCall = api.mock.calls.find(([url]) => String(url).startsWith('/api/feed/'))!
  expect((feedCall[1]!.headers as Record<string, string>).Authorization).toBe('Bearer a1')
})

test('an empty For you feed points to the latest stories', async () => {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  mockApi({
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: reader }),
    'GET /api/feed/following': () => envelope(200, page([])),
    'GET /api/feed/latest': () => envelope(200, page([story(3)])),
  })
  renderWithProviders(<App />, '/')

  expect(await screen.findByRole('heading', { name: 'Your feed is waiting for you' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('link', { name: 'Read the latest stories' }))
  expect(await screen.findByRole('link', { name: 'Story 3' })).toBeInTheDocument()
})

test('switching to Trending loads that feed', async () => {
  mockApi({
    'GET /api/feed/latest': () => envelope(200, page([story(1)])),
    'GET /api/feed/trending': () => envelope(200, page([story(9, { title: 'Most clapped' })])),
  })
  renderWithProviders(<App />, '/')

  await screen.findByRole('link', { name: 'Story 1' })
  await userEvent.click(screen.getByRole('link', { name: 'Trending' }))
  expect(await screen.findByRole('link', { name: 'Most clapped' })).toBeInTheDocument()
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/?feed=trending'))
})

test('a visitor asking for For you gets Latest', async () => {
  mockApi({ 'GET /api/feed/latest': () => envelope(200, page([story(1)])) })
  renderWithProviders(<App />, '/?feed=following')
  expect(await screen.findByRole('link', { name: 'Story 1' })).toBeInTheDocument()
})

test('more stories load page by page until the end', async () => {
  mockApi({
    'GET /api/feed/latest': (url) =>
      url.searchParams.get('pageNo') === '0'
        ? envelope(200, page([story(1), story(2)], 0, false))
        : envelope(200, page([story(3)], 1, true)),
  })
  renderWithProviders(<App />, '/')

  await screen.findByRole('link', { name: 'Story 2' })
  await userEvent.click(screen.getByRole('button', { name: 'Show more stories' }))
  expect(await screen.findByRole('link', { name: 'Story 3' })).toBeInTheDocument()
  expect(screen.getByText("You're all caught up.")).toBeInTheDocument()
})

test('a failed feed can be retried', async () => {
  let calls = 0
  mockApi({ 'GET /api/feed/latest': () => (++calls === 1 ? envelope(500, null) : envelope(200, page([story(1)]))) })
  renderWithProviders(<App />, '/')

  expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong on our side')
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
  await waitFor(() => expect(screen.getByRole('link', { name: 'Story 1' })).toBeInTheDocument())
})
