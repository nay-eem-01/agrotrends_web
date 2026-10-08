import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import type { BlogResponse } from '../../api/types'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const story: BlogResponse = {
  id: 402,
  slug: 'rice-blast',
  title: 'Rice blast',
  content: '<p>Body.</p>',
  clapCount: 10,
  author: { authorId: 1, name: 'Nasrin Akter' },
  status: 'PUBLISHED',
  agri: {},
}
const reader = { id: 9, name: 'Karim', email: 'karim@farm.bd' }

function signedInAs(user: object) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return { 'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user }) }
}

function calls(api: ReturnType<typeof mockApi>, method: string, path: string) {
  return api.mock.calls.filter(([url, init]) => (init?.method ?? 'GET') === method && String(url).startsWith(path))
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('visitors see the clap count and are sent to sign-in to clap or save', async () => {
  const api = mockApi({ 'GET /api/blogs/slug/rice-blast': () => envelope(200, story) })
  renderWithProviders(<App />, '/stories/rice-blast')

  const [clap] = await screen.findAllByRole('button', { name: 'Sign in to clap' })
  expect(clap).toHaveTextContent('10')
  await userEvent.click(clap)
  expect(screen.getByTestId('path')).toHaveTextContent('/sign-in?next=%2Fstories%2Frice-blast')
  expect(calls(api, 'GET', '/api/blogs/id/')).toHaveLength(0)
})

test('a burst of claps is sent as one request', async () => {
  let mine = 2
  const api = mockApi({
    ...signedInAs(reader),
    'GET /api/blogs/slug/rice-blast': () => envelope(200, story),
    'GET /api/bookmarks': () => envelope(200, page([])),
    'GET /api/blogs/id/402/claps': () => envelope(200, { totalClaps: 12, myClaps: mine }),
    'POST /api/blogs/id/402/claps': (url) => {
      const count = Number(url.searchParams.get('count'))
      mine += count
      return envelope(200, { totalClaps: 10 + mine, myClaps: mine })
    },
  })
  renderWithProviders(<App />, '/stories/rice-blast')

  const [clap] = await screen.findAllByRole('button', { name: 'Clap for this story' })
  await waitFor(() => expect(clap).toHaveTextContent('12'))
  await userEvent.click(clap)
  await userEvent.click(clap)
  await userEvent.click(clap)
  expect(clap).toHaveTextContent('15')

  await waitFor(() => expect(calls(api, 'POST', '/api/blogs/id/402/claps')).toHaveLength(1))
  expect(new URL(String(calls(api, 'POST', '/api/blogs/id/402/claps')[0][0]), 'http://x').searchParams.get('count')).toBe('3')
  await waitFor(() => expect(clap).toHaveTextContent('15'))
})

test('holding the clap button keeps clapping', async () => {
  const api = mockApi({
    ...signedInAs(reader),
    'GET /api/blogs/slug/rice-blast': () => envelope(200, story),
    'GET /api/bookmarks': () => envelope(200, page([])),
    'GET /api/blogs/id/402/claps': () => envelope(200, { totalClaps: 10, myClaps: 0 }),
    'POST /api/blogs/id/402/claps': (url) => envelope(200, { totalClaps: 10 + Number(url.searchParams.get('count')), myClaps: Number(url.searchParams.get('count')) }),
  })
  renderWithProviders(<App />, '/stories/rice-blast')

  const [clap] = await screen.findAllByRole('button', { name: 'Clap for this story' })
  fireEvent.pointerDown(clap)
  await new Promise((resolve) => setTimeout(resolve, 700))
  fireEvent.pointerUp(clap)
  fireEvent.click(clap)

  await waitFor(() => expect(calls(api, 'POST', '/api/blogs/id/402/claps')).toHaveLength(1))
  const sent = Number(new URL(String(calls(api, 'POST', '/api/blogs/id/402/claps')[0][0]), 'http://x').searchParams.get('count'))
  expect(sent).toBeGreaterThanOrEqual(2)
})

test('claps stop at 50', async () => {
  mockApi({
    ...signedInAs(reader),
    'GET /api/blogs/slug/rice-blast': () => envelope(200, story),
    'GET /api/bookmarks': () => envelope(200, page([])),
    'GET /api/blogs/id/402/claps': () => envelope(200, { totalClaps: 60, myClaps: 49 }),
    'POST /api/blogs/id/402/claps': () => envelope(200, { totalClaps: 61, myClaps: 50 }),
  })
  renderWithProviders(<App />, '/stories/rice-blast')

  const [clap] = await screen.findAllByRole('button', { name: 'Clap for this story' })
  await waitFor(() => expect(clap).toHaveTextContent('60'))
  await userEvent.click(clap)
  expect(clap).toBeDisabled()
  expect(clap).toHaveAccessibleName('You gave this story 50 claps')
})

test('an author cannot clap their own story', async () => {
  const api = mockApi({
    ...signedInAs({ ...reader, authorId: 1 }),
    'GET /api/blogs/slug/rice-blast': () => envelope(200, story),
    'GET /api/bookmarks': () => envelope(200, page([])),
  })
  renderWithProviders(<App />, '/stories/rice-blast')

  await screen.findByRole('heading', { name: 'Rice blast' })
  expect(screen.queryByRole('button', { name: /clap/i })).not.toBeInTheDocument()
  expect(calls(api, 'GET', '/api/blogs/id/402/claps')).toHaveLength(0)
})

test('saving and unsaving a story', async () => {
  const api = mockApi({
    ...signedInAs(reader),
    'GET /api/blogs/slug/rice-blast': () => envelope(200, story),
    'GET /api/bookmarks': () => envelope(200, page([])),
    'GET /api/blogs/id/402/claps': () => envelope(200, { totalClaps: 10, myClaps: 0 }),
    'PUT /api/blogs/id/402/bookmark': () => envelope(200, null),
    'DELETE /api/blogs/id/402/bookmark': () => envelope(200, null),
  })
  renderWithProviders(<App />, '/stories/rice-blast')

  const [save] = await screen.findAllByRole('button', { name: 'Save “Rice blast”' })
  await waitFor(() => expect(save).toHaveAttribute('aria-pressed', 'false'))
  await userEvent.click(save)
  expect(save).toHaveAttribute('aria-pressed', 'true')
  await waitFor(() => expect(calls(api, 'PUT', '/api/blogs/id/402/bookmark')).toHaveLength(1))

  await userEvent.click(save)
  expect(save).toHaveAttribute('aria-pressed', 'false')
  await waitFor(() => expect(calls(api, 'DELETE', '/api/blogs/id/402/bookmark')).toHaveLength(1))
})

test('a failed save is undone', async () => {
  mockApi({
    ...signedInAs(reader),
    'GET /api/blogs/slug/rice-blast': () => envelope(200, story),
    'GET /api/bookmarks': () => envelope(200, page([])),
    'GET /api/blogs/id/402/claps': () => envelope(200, { totalClaps: 10, myClaps: 0 }),
    'PUT /api/blogs/id/402/bookmark': () => envelope(500, null),
  })
  renderWithProviders(<App />, '/stories/rice-blast')

  const [save] = await screen.findAllByRole('button', { name: 'Save “Rice blast”' })
  await userEvent.click(save)
  await waitFor(() => expect(save).toHaveAttribute('aria-pressed', 'false'))
})

test('feed cards show which stories are saved', async () => {
  mockApi({
    ...signedInAs(reader),
    'GET /api/feed/following': () => envelope(200, page([story, { ...story, id: 403, slug: 'other', title: 'Other' }])),
    'GET /api/bookmarks': () => envelope(200, page([story])),
  })
  renderWithProviders(<App />, '/')

  const card = (await screen.findByRole('link', { name: 'Rice blast' })).closest('article')!
  await waitFor(() => expect(within(card).getByRole('button', { name: 'Save “Rice blast”' })).toHaveAttribute('aria-pressed', 'true'))
  const other = screen.getByRole('link', { name: 'Other' }).closest('article')!
  expect(within(other).getByRole('button', { name: 'Save “Other”' })).toHaveAttribute('aria-pressed', 'false')
})
