import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, vi } from 'vitest'
import App from './App'
import { envelope, mockApi, page } from './test/api'
import { renderWithProviders } from './test/render'

beforeEach(() => {
  localStorage.clear()
  mockApi({ 'GET /api/feed/latest': () => envelope(200, page([])) })
})

afterEach(() => vi.unstubAllGlobals())

function renderAt(path: string) {
  return renderWithProviders(<App />, path)
}

test('home renders inside the shell', async () => {
  renderAt('/')
  expect(screen.getByRole('link', { name: 'AgroTrends home' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 1, name: /farming knowledge/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main')
})

test('unknown paths show not found', async () => {
  renderAt('/nowhere')
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
})

test('searching from the top bar goes to the search page', async () => {
  renderAt('/')
  await userEvent.type(screen.getByPlaceholderText('Search'), 'boro rice{Enter}')
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/search?q=boro%20rice'))
})

test('blank search stays put', async () => {
  renderAt('/')
  await userEvent.type(screen.getByPlaceholderText('Search'), '   {Enter}')
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent(/^\/$/))
})
