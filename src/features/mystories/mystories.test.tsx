import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import type { BlogResponse } from '../../api/types'
import App from '../../App'
import { saveLocalDraft } from '../../lib/draft'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

function signedInAs(user: object) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return { 'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user }) }
}
const author = { id: 9, name: 'Nasrin', authorId: 3 }
const draft: BlogResponse = { id: 80, slug: 'd', title: 'Jute retting', status: 'DRAFT', updatedAt: '2026-10-08T06:00:00Z', readingTimeMinutes: 2 }
const live: BlogResponse = { id: 81, slug: 'live-one', title: 'Hilsa runs', status: 'PUBLISHED', publishedAt: '2026-10-07T06:00:00Z' }

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('drafts list the server drafts and the one on this device', async () => {
  saveLocalDraft({ title: 'Boro notes', html: '<p>x</p>' })
  const api = mockApi({ ...signedInAs(author), 'GET /api/blogs/me/drafts': () => envelope(200, page([draft])) })
  renderWithProviders(<App />, '/me/stories')

  expect(await screen.findByRole('link', { name: 'Jute retting' })).toHaveAttribute('href', '/write/80')
  expect(screen.getByText('Edited Oct 8 · 2 min read')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Boro notes' })).toHaveAttribute('href', '/write')
  const sent = new URL(String(api.mock.calls.find(([url]) => String(url).startsWith('/api/blogs/me/drafts'))![0]), 'http://x')
  expect(sent.searchParams.get('sortBy')).toBe('lastModifiedDate')
})

test('published lists the author’s live stories', async () => {
  mockApi({ ...signedInAs(author), 'GET /api/blogs/all/author/3': () => envelope(200, page([live])) })
  renderWithProviders(<App />, '/me/stories?tab=published')

  expect(await screen.findByRole('link', { name: 'Hilsa runs' })).toHaveAttribute('href', '/stories/live-one')
  expect(screen.getByRole('link', { name: 'Edit Hilsa runs' })).toHaveAttribute('href', '/write/81')
})

test('deleting asks first, then removes the story', async () => {
  let drafts = [draft]
  const api = mockApi({
    ...signedInAs(author),
    'GET /api/blogs/me/drafts': () => envelope(200, page(drafts)),
    'DELETE /api/blogs/id/80/delete': () => {
      drafts = []
      return envelope(200, null)
    },
  })
  renderWithProviders(<App />, '/me/stories')

  await userEvent.click(await screen.findByRole('button', { name: 'Delete Jute retting' }))
  const row = screen.getByText(/Delete “Jute retting”\?/).closest('li')!
  await userEvent.click(within(row).getByRole('button', { name: 'Keep it' }))
  expect(api.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)

  await userEvent.click(screen.getByRole('button', { name: 'Delete Jute retting' }))
  await userEvent.click(screen.getByRole('button', { name: 'Delete story' }))
  await waitFor(() => expect(screen.getByText(/No drafts/)).toBeInTheDocument())
})

test('readers are pointed to their library', async () => {
  mockApi(signedInAs({ id: 10, name: 'Karim' }))
  renderWithProviders(<App />, '/me/stories')
  expect(await screen.findByRole('link', { name: 'Open your library' })).toHaveAttribute('href', '/library')
})
