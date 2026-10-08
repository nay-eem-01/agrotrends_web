import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import type { AuthorProfileResponse, BlogResponse } from '../../api/types'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const profile: AuthorProfileResponse = {
  authorId: 3,
  name: 'Rahim Uddin',
  designation: 'Agronomist',
  workPlaceOrInstitution: 'BRRI',
  specialities: ['rice', 'soil health'],
  bio: 'I work on boro rice.',
  publishedPostCount: 2,
  followerCount: 41,
  followedByMe: false,
}

const story: BlogResponse = { id: 7, slug: 'boro', title: 'Boro tips', content: '<p>x</p>', author: { authorId: 3, name: 'Rahim Uddin' }, status: 'PUBLISHED', agri: {} }

function signedInAs(user: object) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return {
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user }),
    'GET /api/bookmarks': () => envelope(200, page([])),
  }
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('an author page shows the profile and their stories', async () => {
  mockApi({
    'GET /api/authors/3': () => envelope(200, profile),
    'GET /api/blogs/all/author/3': () => envelope(200, page([story])),
  })
  renderWithProviders(<App />, '/authors/3')

  expect(await screen.findByRole('heading', { level: 1, name: 'Rahim Uddin' })).toBeInTheDocument()
  expect(screen.getByText('Agronomist · BRRI')).toBeInTheDocument()
  expect(screen.getByText('41 followers · 2 stories')).toBeInTheDocument()
  expect(screen.getByText('I work on boro rice.')).toBeInTheDocument()
  expect(within(screen.getByRole('region', { name: 'Specialities' })).getByText('soil health')).toBeInTheDocument()
  expect(await screen.findByRole('link', { name: 'Boro tips' })).toHaveAttribute('href', '/stories/boro')
})

test('a visitor following an author is sent to sign-in', async () => {
  mockApi({ 'GET /api/authors/3': () => envelope(200, profile), 'GET /api/blogs/all/author/3': () => envelope(200, page([])) })
  renderWithProviders(<App />, '/authors/3')

  await userEvent.click(await screen.findByRole('button', { name: 'Follow Rahim Uddin' }))
  expect(screen.getByTestId('path')).toHaveTextContent('/sign-in?next=%2Fauthors%2F3')
})

test('following updates the count at once and survives the reload', async () => {
  let followed = false
  const api = mockApi({
    ...signedInAs({ id: 9, name: 'Karim' }),
    'GET /api/authors/3': () => envelope(200, { ...profile, followedByMe: followed, followerCount: followed ? 42 : 41 }),
    'GET /api/blogs/all/author/3': () => envelope(200, page([])),
    'PUT /api/authors/3/follow': () => {
      followed = true
      return envelope(200, null)
    },
  })
  renderWithProviders(<App />, '/authors/3')

  await userEvent.click(await screen.findByRole('button', { name: 'Follow Rahim Uddin' }))
  expect(screen.getByRole('button', { name: 'Following Rahim Uddin' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByText('42 followers · 2 stories')).toBeInTheDocument()
  await waitFor(() => expect(api.mock.calls.some(([url, init]) => init?.method === 'PUT' && url === '/api/authors/3/follow')).toBe(true))
  const read = api.mock.calls.find(([url]) => url === '/api/authors/3')!
  expect((read[1]!.headers as Record<string, string>).Authorization).toBe('Bearer a1')
})

test('a failed follow is undone', async () => {
  mockApi({
    ...signedInAs({ id: 9, name: 'Karim' }),
    'GET /api/authors/3': () => envelope(200, profile),
    'GET /api/blogs/all/author/3': () => envelope(200, page([])),
    'PUT /api/authors/3/follow': () => envelope(500, null),
  })
  renderWithProviders(<App />, '/authors/3')

  await userEvent.click(await screen.findByRole('button', { name: 'Follow Rahim Uddin' }))
  expect(await screen.findByRole('button', { name: 'Follow Rahim Uddin' })).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByText('41 followers · 2 stories')).toBeInTheDocument()
})

test('authors see Edit profile on their own page', async () => {
  mockApi({
    ...signedInAs({ id: 9, name: 'Rahim Uddin', authorId: 3 }),
    'GET /api/authors/3': () => envelope(200, profile),
    'GET /api/blogs/all/author/3': () => envelope(200, page([])),
  })
  renderWithProviders(<App />, '/authors/3')

  expect(await screen.findByRole('link', { name: 'Edit profile' })).toHaveAttribute('href', '/settings')
  expect(screen.queryByRole('button', { name: /Follow/ })).not.toBeInTheDocument()
})

test('an unknown author is not found', async () => {
  mockApi({ 'GET /api/authors/99': () => envelope(404, null), 'GET /api/blogs/all/author/99': () => envelope(200, page([])) })
  renderWithProviders(<App />, '/authors/99')
  expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
})

test('a story ends with who wrote it and a Follow button', async () => {
  mockApi({
    'GET /api/blogs/slug/boro': () => envelope(200, story),
    'GET /api/authors/3': () => envelope(200, profile),
    'GET /api/comments/blog/7': () => envelope(200, []),
  })
  renderWithProviders(<App />, '/stories/boro')

  const about = await screen.findByRole('complementary', { name: 'About the author' })
  expect(within(about).getByRole('link', { name: 'Rahim Uddin' })).toHaveAttribute('href', '/authors/3')
  expect(within(about).getByText('Agronomist · 41 followers')).toBeInTheDocument()
  expect(within(about).getByRole('button', { name: 'Follow Rahim Uddin' })).toBeInTheDocument()
})
