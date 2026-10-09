import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const story = { id: 7, slug: 'boro', title: 'Boro tips', content: '<p>x</p>', status: 'PUBLISHED', author: { authorId: 3, name: 'Rahim' } }

function routes(related: () => Response) {
  return {
    'GET /api/blogs/slug/boro': () => envelope(200, story),
    'GET /api/authors/3': () => envelope(200, { authorId: 3, name: 'Rahim' }),
    'GET /api/comments/blog/7': () => envelope(200, []),
    'GET /api/bookmarks': () => envelope(200, page([])),
    'GET /api/blogs/id/7/claps': () => envelope(200, { totalClaps: 0, myClaps: 0 }),
    'GET /api/blogs/id/7/related': related,
  }
}

function signedIn() {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return { 'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 9, name: 'Karim' } }) }
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('signed-in readers see related stories', async () => {
  mockApi({ ...signedIn(), ...routes(() => envelope(200, [{ blogId: 8, title: 'Aman tips' }])) })
  renderWithProviders(<App />, '/stories/boro')

  const section = (await screen.findByRole('heading', { name: 'Related stories' })).closest('section')!
  expect(within(section).getByRole('link', { name: 'Aman tips' })).toHaveAttribute('href', '/s/8')
})

test('no related stories, or a failure, shows nothing', async () => {
  mockApi({ ...signedIn(), ...routes(() => envelope(503, null, 'Not now')) })
  renderWithProviders(<App />, '/stories/boro')
  await screen.findByRole('heading', { level: 1, name: 'Boro tips' })
  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(screen.queryByRole('heading', { name: 'Related stories' })).not.toBeInTheDocument()
})

test('visitors are not asked for related stories', async () => {
  const api = mockApi(routes(() => envelope(200, [])))
  renderWithProviders(<App />, '/stories/boro')
  await screen.findByRole('heading', { level: 1, name: 'Boro tips' })
  expect(api.mock.calls.some(([url]) => String(url).includes('/related'))).toBe(false)
})
