import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditorView } from '@tiptap/pm/view'
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

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

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

test('a cover upload shows processing while the server prepares the image', async () => {
  let finish!: (response: Response) => void
  const result = new Promise<Response>((resolve) => { finish = resolve })
  mockApi({ ...signedInAuthor(), 'POST /api/images': () => result })
  renderWithProviders(<App />, '/write')

  const cover = await screen.findByRole('button', { name: 'Add a cover image' })
  await userEvent.upload(fileInputs()[1], photo())
  expect(await screen.findByText('Processing image…')).toBeInTheDocument()
  expect(cover).toBeDisabled()

  finish(envelope(200, { url: '/uploads/cover.webp' }))
  expect(await screen.findByRole('button', { name: 'Change cover' })).toBeEnabled()
  expect(screen.queryByText('Processing image…')).not.toBeInTheDocument()
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

test('dropping a file onto an existing story cover replaces it', async () => {
  mockApi({
    ...signedInAuthor(),
    'GET /api/blogs/id/50': () =>
      envelope(200, { id: 50, title: 'Jute', content: '<p>Steep.</p>', status: 'DRAFT', imageUrl: '/uploads/old.jpg' }),
    'POST /api/images': () => envelope(200, { url: '/uploads/new.webp' }),
  })
  renderWithProviders(<App />, '/write/50')

  const changeCover = await screen.findByRole('button', { name: 'Change cover' })
  const dataTransfer = { types: ['Files'], files: [photo()], items: [] }
  expect(fireEvent.dragOver(changeCover, { dataTransfer })).toBe(false)
  expect(fireEvent.drop(changeCover, { dataTransfer })).toBe(false)
  await waitFor(() => expect(document.querySelector('img[src="/uploads/new.webp"]')).not.toBeNull())
})

test('dropping an image into the story inserts it at the drop position', async () => {
  mockApi({
    ...signedInAuthor(),
    'GET /api/blogs/id/50': () =>
      envelope(200, { id: 50, title: 'Jute', content: '<p>First</p><p>Second</p>', status: 'DRAFT' }),
    'POST /api/images': () => envelope(200, { url: '/uploads/inline.webp' }),
  })
  // jsdom cannot resolve a screen coordinate to an editor position.
  vi.spyOn(EditorView.prototype, 'posAtCoords').mockReturnValue({ pos: 7, inside: -1 })
  renderWithProviders(<App />, '/write/50')

  const body = await screen.findByRole('textbox', { name: 'Story' })
  fireEvent.drop(body, { dataTransfer: { types: ['Files'], files: [photo()], items: [] } })

  await waitFor(() => {
    const image = body.querySelector('img[src="/uploads/inline.webp"]')
    expect(image?.previousElementSibling).toHaveTextContent('First')
    expect(image?.nextElementSibling).toHaveTextContent('Second')
  })
})

test('dropping a folder on an image control explains what to upload', async () => {
  const api = mockApi(signedInAuthor())
  renderWithProviders(<App />, '/write')

  const cover = await screen.findByRole('button', { name: 'Add a cover image' })
  fireEvent.drop(cover, {
    dataTransfer: { types: ['Files'], files: [], items: [{ webkitGetAsEntry: () => ({ isDirectory: true }) }] },
  })

  expect(screen.getByRole('alert')).toHaveTextContent('Drop an image file instead of a folder.')
  expect(api.mock.calls.some(([url]) => url === '/api/images')).toBe(false)
})
