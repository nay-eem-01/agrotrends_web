import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../api/client'
import App from '../App'
import { envelope, mockApi, page } from '../test/api'
import { renderWithProviders } from '../test/render'

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('the phone menu reaches every destination, and closes on the way there', async () => {
  mockApi({ 'GET /api/questions/all': () => envelope(200, page([])), 'GET /api/categories/all': () => envelope(200, page([])) })
  renderWithProviders(<App />, '/')

  await userEvent.click(await screen.findByRole('button', { name: 'Menu' }))
  const menu = within(await screen.findByRole('dialog', { name: 'Menu' }))
  for (const name of ['Discover', 'Questions', 'Stories', 'AI advisor', 'Write', 'Search']) expect(menu.getByRole('link', { name })).toBeInTheDocument()
  expect(menu.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/sign-up')
  expect(menu.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in')

  await userEvent.click(menu.getByRole('link', { name: 'AI advisor' }))
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/advisor'))
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument())
})

test('the phone tab bar marks the current section and leads to asking', async () => {
  mockApi({ 'GET /api/questions/all': () => envelope(200, page([])), 'GET /api/categories/all': () => envelope(200, page([])) })
  renderWithProviders(<App />, '/questions')

  const tabs = within(await screen.findByRole('navigation', { name: 'Sections' }))
  expect(tabs.getByRole('link', { name: 'Questions' })).toHaveAttribute('aria-current', 'page')
  expect(tabs.getByRole('link', { name: 'Discover' })).not.toHaveAttribute('aria-current')
  expect(tabs.getByRole('link', { name: 'Ask a question' })).toHaveAttribute('href', '/questions/ask')
})

test('the search pill and Ctrl+K open the same search dialog', async () => {
  mockApi({ 'GET /api/questions/all': () => envelope(200, page([])), 'GET /api/categories/all': () => envelope(200, page([])) })
  renderWithProviders(<App />, '/')

  const [pill] = await screen.findAllByRole('button', { name: 'Search' })
  expect(pill).toHaveAttribute('aria-keyshortcuts', 'Control+K Meta+K')
  await userEvent.click(pill)
  expect(await screen.findByRole('dialog', { name: 'Search AgroTrends' })).toBeInTheDocument()
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Search AgroTrends' })).not.toBeInTheDocument())

  await userEvent.keyboard('{Control>}k{/Control}')
  expect(await screen.findByRole('dialog', { name: 'Search AgroTrends' })).toBeInTheDocument()
})

test('the sections live in the sidebar only, and the menu button hides it to icons and back', async () => {
  mockApi({ 'GET /api/questions/all': () => envelope(200, page([])), 'GET /api/categories/all': () => envelope(200, page([])) })
  renderWithProviders(<App />, '/questions')

  const sidebar = await screen.findByRole('complementary', { name: 'Navigation' })
  expect(within(sidebar).getByRole('link', { name: 'Questions' })).toHaveAttribute('aria-current', 'page')
  // The top bar no longer repeats the sections.
  expect(within(screen.getByRole('navigation', { name: 'Main' })).queryByRole('link', { name: 'Questions' })).not.toBeInTheDocument()

  const toggle = screen.getByRole('button', { name: 'Hide navigation' })
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await userEvent.click(toggle)
  expect(screen.getByRole('button', { name: 'Show navigation' })).toHaveAttribute('aria-expanded', 'false')
  // Hidden to icons, the links are still there and still named.
  expect(within(sidebar).getByRole('link', { name: 'Questions' })).toHaveAttribute('title', 'Questions')
  expect(localStorage.getItem('agrotrends.sidebar')).toBe('closed')
})
