import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { loadLocalDraft } from '../../lib/draft'
import { envelope, mockApi } from '../../test/api'
import { renderWithProviders } from '../../test/render'

function signedInAuthor() {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return {
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 9, name: 'Nasrin', authorId: 3 } }),
  }
}

const photo = () => new File(['img'], 'field.webp', { type: 'image/webp' })
const fileInputs = () => document.querySelectorAll<HTMLInputElement>('input[type="file"]')

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('a cover is uploaded, shown and kept with the device draft', async () => {
  const api = mockApi({ ...signedInAuthor(), 'POST /api/images': () => envelope(200, { url: '/uploads/cover.webp' }) })
  renderWithProviders(<App />, '/write')

  await screen.findByRole('button', { name: 'Add a cover image' })
  // The cover's picker is the second file input (the toolbar's comes first).
  await userEvent.upload(fileInputs()[1], photo())

  expect(await screen.findByRole('button', { name: 'Change cover' })).toBeInTheDocument()
  expect(document.querySelector('img[src="/uploads/cover.webp"]')).not.toBeNull()
  expect((api.mock.calls.find(([url]) => url === '/api/images')![1]!.body as FormData).get('file')).toBeInstanceOf(File)
  await waitFor(() => expect(loadLocalDraft()?.cover).toBe('/uploads/cover.webp'), { timeout: 3000 })

  await userEvent.click(screen.getByRole('button', { name: 'Remove cover' }))
  expect(screen.getByRole('button', { name: 'Add a cover image' })).toBeInTheDocument()
})

test('an inline image is uploaded and placed in the story', async () => {
  mockApi({ ...signedInAuthor(), 'POST /api/images': () => envelope(200, { url: '/uploads/inline.webp' }) })
  renderWithProviders(<App />, '/write')

  await screen.findByRole('button', { name: 'Image' })
  await userEvent.upload(fileInputs()[0], photo())

  await waitFor(() => expect(screen.getByRole('textbox', { name: 'Story' }).querySelector('img[src="/uploads/inline.webp"]')).not.toBeNull())
})

test('a wrong file type is refused before uploading', async () => {
  const api = mockApi(signedInAuthor())
  renderWithProviders(<App />, '/write')

  await screen.findByRole('button', { name: 'Add a cover image' })
  await userEvent.upload(fileInputs()[1], new File(['x'], 'a.gif', { type: 'image/gif' }), { applyAccept: false })

  expect(screen.getByRole('alert')).toHaveTextContent('Choose a JPEG, PNG or WebP image.')
  expect(api.mock.calls.some(([url]) => url === '/api/images')).toBe(false)
})

test("removing a server draft's cover saves without it", async () => {
  const api = mockApi({
    ...signedInAuthor(),
    'GET /api/blogs/id/50': () =>
      envelope(200, { id: 50, title: 'Jute', content: '<p>Steep.</p>', status: 'DRAFT', category: { id: 2 }, imageUrl: '/uploads/old.jpg' }),
    'PUT /api/blogs/update': () => envelope(200, { id: 50, status: 'DRAFT' }),
  })
  renderWithProviders(<App />, '/write/50')

  await userEvent.click(await screen.findByRole('button', { name: 'Remove cover' }))
  await waitFor(() => expect(api.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(true), { timeout: 3000 })
  const sent = JSON.parse(api.mock.calls.find(([, init]) => init?.method === 'PUT')![1]!.body as string)
  expect(sent).not.toHaveProperty('imageUrl')
})
