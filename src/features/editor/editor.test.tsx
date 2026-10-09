import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import type { BlogResponse } from '../../api/types'
import App from '../../App'
import { loadLocalDraft, saveLocalDraft } from '../../lib/draft'
import { envelope, mockApi } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const author = { id: 9, name: 'Nasrin', authorId: 3 }

function signedInAs(user: object) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return { 'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user }) }
}

const draft: BlogResponse = {
  id: 50,
  slug: 'draft-50',
  title: 'Jute retting',
  content: '<p>Steep the stalks.</p>',
  status: 'DRAFT',
  category: { id: 2, categoryName: 'Crops' },
  tags: ['jute'],
  agri: { crop: 'jute', season: 'KHARIF_1' },
  imageUrl: '/uploads/j.jpg',
}

function puts(api: ReturnType<typeof mockApi>) {
  return api.mock.calls.filter(([, init]) => init?.method === 'PUT').map(([, init]) => JSON.parse(init!.body as string))
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('visitors are sent to sign-in and readers are told only authors publish', async () => {
  mockApi({})
  const { unmount } = renderWithProviders(<App />, '/write')
  expect(screen.getByTestId('path')).toHaveTextContent('/sign-in?next=%2Fwrite')
  unmount()

  mockApi(signedInAs({ id: 9, name: 'Karim' }))
  renderWithProviders(<App />, '/write')
  expect(await screen.findByRole('heading', { name: 'Publishing is for authors' })).toBeInTheDocument()
})

test('a new story is kept on this device and comes back after a reload', async () => {
  saveLocalDraft({ title: 'Boro', html: '<p>Transplant early.</p>' })
  mockApi(signedInAs(author))
  renderWithProviders(<App />, '/write')

  const title = await screen.findByRole('textbox', { name: 'Title' })
  expect(title).toHaveValue('Boro')
  expect(screen.getByRole('textbox', { name: 'Story' })).toHaveTextContent('Transplant early.')

  await userEvent.type(title, ' seedlings')
  await waitFor(() => expect(loadLocalDraft()?.title).toBe('Boro seedlings'), { timeout: 3000 })
  expect(screen.getByText('Draft saved on this device')).toBeInTheDocument()
})

test('a server draft saves itself with its other details intact', async () => {
  const api = mockApi({
    ...signedInAs(author),
    'GET /api/blogs/id/50': () => envelope(200, draft),
    'PUT /api/blogs/update': (_url, init) => envelope(200, { ...draft, ...JSON.parse(init!.body as string) }),
  })
  renderWithProviders(<App />, '/write/50')

  const title = await screen.findByRole('textbox', { name: 'Title' })
  await userEvent.type(title, ' in ponds')
  await waitFor(() => expect(puts(api)).toHaveLength(1), { timeout: 3000 })
  expect(puts(api)[0]).toEqual({
    blogId: 50,
    title: 'Jute retting in ponds',
    content: '<p>Steep the stalks.</p>',
    categoryId: 2,
    imageUrl: '/uploads/j.jpg',
    tags: ['jute'],
    agri: { crop: 'jute', season: 'KHARIF_1' },
  })
  await waitFor(() => expect(screen.getByText('Draft saved')).toBeInTheDocument())
})

test('a published story changes only on Save changes', async () => {
  const api = mockApi({
    ...signedInAs(author),
    'GET /api/blogs/id/51': () => envelope(200, { ...draft, id: 51, status: 'PUBLISHED' }),
    'PUT /api/blogs/update': () => envelope(200, { ...draft, id: 51, status: 'PUBLISHED' }),
  })
  renderWithProviders(<App />, '/write/51')

  const title = await screen.findByRole('textbox', { name: 'Title' })
  const save = screen.getByRole('button', { name: 'Save changes' })
  expect(save).toBeDisabled()
  await userEvent.type(title, '!')
  expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
  await new Promise((resolve) => setTimeout(resolve, 1500))
  expect(puts(api)).toHaveLength(0)

  await userEvent.click(save)
  await waitFor(() => expect(puts(api)).toHaveLength(1))
  expect(puts(api)[0].title).toBe('Jute retting!')
})

test("someone else's story is not found", async () => {
  mockApi({ ...signedInAs(author), 'GET /api/blogs/id/99': () => envelope(404, null) })
  renderWithProviders(<App />, '/write/99')
  expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
})
