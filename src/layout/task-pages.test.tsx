import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../api/client'
import App from '../App'
import { envelope, mockApi, page } from '../test/api'
import { renderWithProviders } from '../test/render'
import { isComposing } from './AppLayout'

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('asking, editing a question and writing a story are composing pages; reading them is not', () => {
  expect(isComposing('/questions/ask')).toBe(true)
  expect(isComposing('/questions/5/edit')).toBe(true)
  expect(isComposing('/write')).toBe(true)
  expect(isComposing('/write/12')).toBe(true)
  expect(isComposing('/questions/5')).toBe(false)
  expect(isComposing('/questions')).toBe(false)
  expect(isComposing('/writers')).toBe(false)
})

test('the ask page has no tab bar or footer around the form, and photos are a labelled field', async () => {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  mockApi({
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 9, name: 'Salma', emailVerified: true } }),
    'GET /api/categories/all': () => envelope(200, page([{ id: 1, categoryName: 'Crops' }])),
    'GET /api/tags': () => envelope(200, []),
    'GET /api/questions/search': () => envelope(200, page([])),
    'GET /api/notifications/unread-count': () => envelope(200, 0),
  })
  renderWithProviders(<App />, '/questions/ask')

  expect(await screen.findByRole('heading', { level: 1, name: 'Ask a question' })).toBeInTheDocument()
  expect(screen.queryByRole('navigation', { name: 'Sections' })).not.toBeInTheDocument()
  expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  expect(screen.getByRole('group', { name: 'Photos (optional)' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Add a photo' })).toBeVisible()
  // Formatting stays in the toolbar; the photo is no longer one of its icons.
  expect(within(screen.getByRole('toolbar', { name: 'Formatting' })).queryByRole('button', { name: /photo/i })).not.toBeInTheDocument()
})

test('reading pages keep the tab bar and the footer', async () => {
  mockApi({ 'GET /api/categories/all': () => envelope(200, page([])), 'GET /api/tags': () => envelope(200, []) })
  renderWithProviders(<App />, '/about')

  expect(await screen.findByRole('heading', { level: 1, name: 'About us' })).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Sections' })).toBeInTheDocument()
  expect(screen.getByRole('contentinfo')).toBeInTheDocument()
})
