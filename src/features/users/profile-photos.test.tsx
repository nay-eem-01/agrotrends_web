import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

const profile = { userId: 7, name: 'Dr Nasrin', authorId: 3, coverUrl: '/uploads/cover.jpg' }
const author = { authorId: 3, name: 'Dr Nasrin', profileImageUrl: '/uploads/nasrin.jpg', followerCount: 0, publishedPostCount: 0 }

test('the profile photo and the cover open full size, and close again', async () => {
  mockApi({
    'GET /api/users/7/profile': () => envelope(200, profile),
    'GET /api/authors/3': () => envelope(200, author),
    'GET /api/users/7/reputation': () => envelope(200, { total: 0, topics: [] }),
    'GET /api/questions/all/user/7': () => envelope(200, page([])),
    'GET /api/answers/all/user/7': () => envelope(200, page([])),
    'GET /api/blogs/all/author/3': () => envelope(200, page([])),
  })
  renderWithProviders(<App />, '/users/7')

  await userEvent.click(await screen.findByRole('button', { name: "Dr Nasrin's profile photo" }))
  const photo = await screen.findByRole('dialog', { name: "Dr Nasrin's profile photo" })
  expect(within(photo).getByRole('img', { name: "Dr Nasrin's profile photo" })).toHaveAttribute('src', '/uploads/nasrin.jpg')
  await userEvent.click(within(photo).getByRole('button', { name: 'Close' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: "Dr Nasrin's cover photo" }))
  const cover = await screen.findByRole('dialog', { name: "Dr Nasrin's cover photo" })
  expect(within(cover).getByRole('img', { name: "Dr Nasrin's cover photo" })).toHaveAttribute('src', '/uploads/cover.jpg')
})

test('without pictures there is nothing to open', async () => {
  mockApi({
    'GET /api/users/7/profile': () => envelope(200, { ...profile, coverUrl: null }),
    'GET /api/authors/3': () => envelope(200, { ...author, profileImageUrl: null }),
    'GET /api/users/7/reputation': () => envelope(200, { total: 0, topics: [] }),
    'GET /api/questions/all/user/7': () => envelope(200, page([])),
    'GET /api/answers/all/user/7': () => envelope(200, page([])),
    'GET /api/blogs/all/author/3': () => envelope(200, page([])),
  })
  renderWithProviders(<App />, '/users/7')
  await screen.findByRole('heading', { level: 1, name: 'Dr Nasrin' })
  expect(screen.queryByRole('button', { name: /profile photo|cover photo/ })).not.toBeInTheDocument()
})

test('the account menu in the top bar shows your profile photo', async () => {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  mockApi({
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 9, name: 'Salma Akter', authorId: 9 } }),
    'GET /api/authors/me': () => envelope(200, { authorId: 9, name: 'Salma Akter', profileImageUrl: '/uploads/salma.jpg' }),
    'GET /api/notifications/unread-count': () => envelope(200, 0),
    'GET /api/categories/all': () => envelope(200, page([])),
    'GET /api/tags': () => envelope(200, []),
  })
  renderWithProviders(<App />, '/about')

  const trigger = await screen.findByRole('button', { name: 'Account' })
  await vi.waitFor(() => expect(trigger.querySelector('img')).toHaveAttribute('src', '/uploads/salma.jpg'))
})
