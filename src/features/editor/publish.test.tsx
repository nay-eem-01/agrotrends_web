import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import type { BlogResponse } from '../../api/types'
import App from '../../App'
import { loadLocalDraft, saveLocalDraft } from '../../lib/draft'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

function signedInAuthor() {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return {
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 9, name: 'Nasrin', authorId: 3 } }),
    'GET /api/categories/all': () => envelope(200, page([{ id: 1, categoryName: 'Crops' }, { id: 2, categoryName: 'Fisheries' }])),
    'GET /api/tags': (url: URL) => envelope(200, url.searchParams.get('q') === 'ri' ? ['rice', 'rice blast'] : []),
  }
}

function bodies(api: ReturnType<typeof mockApi>, method: string, path: string) {
  return api.mock.calls.filter(([url, init]) => init?.method === method && String(url) === path).map(([, init]) => JSON.parse(init!.body as string))
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('Publish stays off until the story has a title and text', async () => {
  mockApi(signedInAuthor())
  renderWithProviders(<App />, '/write')
  expect(await screen.findByRole('button', { name: 'Publish' })).toBeDisabled()
})

test('publishing a new story sends its details and opens it', async () => {
  saveLocalDraft({ title: 'Boro in cold spells', html: '<p>Cover the seedbed.</p>', cover: '/uploads/c.jpg' })
  const story: BlogResponse = { id: 70, slug: 'boro-cold', title: 'Boro in cold spells', content: '<p>Cover the seedbed.</p>', status: 'PUBLISHED', agri: {} }
  const api = mockApi({
    ...signedInAuthor(),
    'POST /api/blogs/create': () => envelope(200, story),
    'GET /api/blogs/slug/boro-cold': () => envelope(200, story),
    'GET /api/comments/blog/70': () => envelope(200, []),
    'GET /api/bookmarks': () => envelope(200, page([])),
  })
  renderWithProviders(<App />, '/write')

  await userEvent.click(await screen.findByRole('button', { name: 'Publish' }))
  const sheet = within(await screen.findByRole('dialog', { name: 'Ready to publish?' }))

  await userEvent.click(sheet.getByRole('button', { name: 'Publish now' }))
  expect(sheet.getByLabelText('Category')).toHaveAccessibleDescription('Choose a category.')
  expect(bodies(api, 'POST', '/api/blogs/create')).toHaveLength(0)

  await userEvent.selectOptions(sheet.getByLabelText('Category'), 'Crops')
  const topics = sheet.getByLabelText('Topics')
  await userEvent.type(topics, 'Ri')
  await userEvent.click(await sheet.findByRole('button', { name: 'rice blast' }))
  await userEvent.type(topics, 'Cold Stress{Enter}')
  await userEvent.click(sheet.getByRole('radio', { name: /Rabi/ }))
  await userEvent.type(sheet.getByLabelText('Crop'), ' boro rice ')
  await userEvent.selectOptions(sheet.getByLabelText('Soil'), 'Clay loam')
  await userEvent.click(sheet.getByRole('button', { name: 'Publish now' }))

  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/stories/boro-cold'))
  expect(bodies(api, 'POST', '/api/blogs/create')[0]).toEqual({
    categoryId: 1,
    tags: ['rice blast', 'cold stress'],
    agri: { crop: 'boro rice', season: 'RABI', soil: 'CLAY_LOAM' },
    title: 'Boro in cold spells',
    content: '<p>Cover the seedbed.</p>',
    imageUrl: '/uploads/c.jpg',
    status: 'PUBLISHED',
  })
  expect(loadLocalDraft()).toBeNull()
  expect(await screen.findByText('Published')).toBeInTheDocument()
})

test('topics stop at five', async () => {
  saveLocalDraft({ title: 'T', html: '<p>x</p>' })
  mockApi(signedInAuthor())
  renderWithProviders(<App />, '/write')

  await userEvent.click(await screen.findByRole('button', { name: 'Publish' }))
  const sheet = within(await screen.findByRole('dialog'))
  const topics = sheet.getByLabelText('Topics')
  await userEvent.type(topics, 'a{Enter}b{Enter}c{Enter}d{Enter}e{Enter}')
  expect(topics).toBeDisabled()
  expect(sheet.getByText("That's the most a story can have (5).")).toBeInTheDocument()
  await userEvent.click(sheet.getByRole('button', { name: 'Remove topic c' }))
  expect(topics).toBeEnabled()
})

test('saving as a draft keeps it private and opens it for editing', async () => {
  saveLocalDraft({ title: 'Jute', html: '<p>Steep.</p>' })
  const draft: BlogResponse = { id: 71, slug: 'jute', title: 'Jute', content: '<p>Steep.</p>', status: 'DRAFT', category: { id: 2 } }
  const api = mockApi({ ...signedInAuthor(), 'POST /api/blogs/create': () => envelope(200, draft), 'GET /api/blogs/id/71': () => envelope(200, draft) })
  renderWithProviders(<App />, '/write')

  await userEvent.click(await screen.findByRole('button', { name: 'Publish' }))
  const sheet = within(await screen.findByRole('dialog'))
  await userEvent.selectOptions(sheet.getByLabelText('Category'), 'Fisheries')
  await userEvent.click(sheet.getByRole('button', { name: 'Save as draft' }))

  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/write/71'))
  expect(bodies(api, 'POST', '/api/blogs/create')[0]).toMatchObject({ status: 'DRAFT', categoryId: 2 })
  expect(await screen.findByText('Draft saved')).toBeInTheDocument()
})

test('publishing a server draft saves its details first', async () => {
  const draft: BlogResponse = { id: 72, slug: 'jute-72', title: 'Jute', content: '<p>Steep.</p>', status: 'DRAFT', category: { id: 2 }, tags: ['jute'], agri: { crop: 'jute' } }
  const api = mockApi({
    ...signedInAuthor(),
    'GET /api/blogs/id/72': () => envelope(200, draft),
    'PUT /api/blogs/update': () => envelope(200, draft),
    'POST /api/blogs/id/72/publish': () => envelope(200, { ...draft, status: 'PUBLISHED' }),
    'GET /api/blogs/slug/jute-72': () => envelope(200, { ...draft, status: 'PUBLISHED' }),
    'GET /api/comments/blog/72': () => envelope(200, []),
    'GET /api/bookmarks': () => envelope(200, page([])),
  })
  renderWithProviders(<App />, '/write/72')

  await userEvent.click(await screen.findByRole('button', { name: 'Publish' }))
  const sheet = within(await screen.findByRole('dialog'))
  expect(sheet.getByLabelText('Category')).toHaveValue('2')
  expect(sheet.getByText('jute', { selector: 'span' })).toBeInTheDocument()
  await userEvent.click(sheet.getByRole('button', { name: 'Publish' }))

  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/stories/jute-72'))
  expect(bodies(api, 'PUT', '/api/blogs/update')[0]).toMatchObject({ blogId: 72, categoryId: 2, tags: ['jute'], agri: { crop: 'jute' } })
  expect(api.mock.calls.some(([url, init]) => init?.method === 'POST' && url === '/api/blogs/id/72/publish')).toBe(true)
})

test('a published story can be unpublished from its details', async () => {
  let live: BlogResponse = { id: 73, slug: 'live', title: 'Live', content: '<p>x</p>', status: 'PUBLISHED', category: { id: 1 } }
  mockApi({
    ...signedInAuthor(),
    'GET /api/blogs/id/73': () => envelope(200, live),
    'POST /api/blogs/id/73/unpublish': () => {
      live = { ...live, status: 'DRAFT' }
      return envelope(200, live)
    },
  })
  renderWithProviders(<App />, '/write/73')

  await userEvent.click(await screen.findByRole('button', { name: 'Details' }))
  await userEvent.click(within(await screen.findByRole('dialog', { name: 'Story details' })).getByRole('button', { name: 'Unpublish' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument())
  expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument()
})

test('an author can open their own story in the editor', async () => {
  const live: BlogResponse = { id: 74, slug: 'mine', title: 'Mine', content: '<p>x</p>', status: 'PUBLISHED', author: { authorId: 3, name: 'Nasrin' } }
  mockApi({
    ...signedInAuthor(),
    'GET /api/blogs/slug/mine': () => envelope(200, live),
    'GET /api/authors/3': () => envelope(200, { authorId: 3, name: 'Nasrin' }),
    'GET /api/comments/blog/74': () => envelope(200, []),
    'GET /api/bookmarks': () => envelope(200, page([])),
  })
  renderWithProviders(<App />, '/stories/mine')
  expect(await screen.findByRole('link', { name: 'Edit story' })).toHaveAttribute('href', '/write/74')
})
