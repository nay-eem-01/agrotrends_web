import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const admin = { id: 1, name: 'Admin', email: 'admin@agrotrends.local', roles: ['SUPER ADMIN'] }

function signedInAs(user: object) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return { 'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user }) }
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('admins sign in on the admin endpoint', async () => {
  const api = mockApi({
    'POST /api/admin/sign-in': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: admin }),
    'GET /api/categories/all': () => envelope(200, page([{ id: 1, categoryName: 'Crops' }])),
  })
  renderWithProviders(<App />, '/admin/categories')

  await userEvent.type(await screen.findByLabelText('Admin e-mail'), 'admin@agrotrends.local')
  await userEvent.type(screen.getByLabelText('Password'), 'secret')
  await userEvent.click(screen.getByRole('button', { name: 'Sign in as admin' }))

  expect(await screen.findByRole('list', { name: 'Categories' })).toHaveTextContent('Crops')
  expect(api.mock.calls.some(([url]) => url === '/api/admin/sign-in')).toBe(true)
})

test('a reader is told their account has no admin access', async () => {
  mockApi(signedInAs({ id: 9, name: 'Karim', roles: ['USER'] }))
  renderWithProviders(<App />, '/admin/categories')
  expect(await screen.findByText('Your account has no admin access. Sign in with an admin account.')).toBeInTheDocument()
})

test('categories are added, renamed and deleted', async () => {
  let categories = [{ id: 1, categoryName: 'Crops' }]
  const api = mockApi({
    ...signedInAs(admin),
    'GET /api/categories/all': () => envelope(200, page(categories)),
    'POST /api/categories/create': (url) => {
      categories = [...categories, { id: 2, categoryName: url.searchParams.get('categoryName')! }]
      return envelope(200, categories[1])
    },
    'PUT /api/categories/update/categoryId/1': (_url, init) => {
      categories = [{ id: 1, categoryName: String(init!.body) }, ...categories.slice(1)]
      return envelope(200, categories[0])
    },
    'DELETE /api/categories/id/2/delete': () => {
      categories = categories.filter((c) => c.id !== 2)
      return envelope(200, null)
    },
  })
  renderWithProviders(<App />, '/admin/categories')

  await userEvent.type(await screen.findByLabelText('New category'), 'Fisheries')
  await userEvent.click(screen.getByRole('button', { name: 'Add category' }))
  const list = await screen.findByRole('list', { name: 'Categories' })
  await waitFor(() => expect(list).toHaveTextContent('Fisheries'))

  await userEvent.type(screen.getByLabelText('New category'), 'crops')
  await userEvent.click(screen.getByRole('button', { name: 'Add category' }))
  expect(screen.getByLabelText('New category')).toHaveAccessibleDescription('That category already exists.')

  await userEvent.click(within(list).getByRole('button', { name: 'Rename Crops' }))
  await userEvent.clear(within(list).getByLabelText('Rename Crops'))
  await userEvent.type(within(list).getByLabelText('Rename Crops'), 'Field crops')
  await userEvent.click(within(list).getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(list).toHaveTextContent('Field crops'))
  const rename = api.mock.calls.find(([url]) => String(url) === '/api/categories/update/categoryId/1')!
  expect(rename[1]!.body).toBe('Field crops')
  expect((rename[1]!.headers as Record<string, string>)['Content-Type']).toBe('text/plain')

  await userEvent.click(within(list).getByRole('button', { name: 'Delete Fisheries' }))
  await userEvent.click(within(list).getByRole('button', { name: 'Delete category' }))
  await waitFor(() => expect(list).not.toHaveTextContent('Fisheries'))
})
