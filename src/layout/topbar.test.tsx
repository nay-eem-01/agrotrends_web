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

test('the search stays in the bar: typing there searches, and it keeps the words on the results page', async () => {
  mockApi({ 'GET /api/questions/all': () => envelope(200, page([])), 'GET /api/categories/all': () => envelope(200, page([])), 'GET /api/search': () => envelope(200, page([])) })
  renderWithProviders(<App />, '/')

  const field = await screen.findByRole('searchbox', { name: 'Search AgroTrends' })
  expect(field).toHaveAttribute('aria-keyshortcuts', 'Control+K Meta+K')
  await userEvent.click(field)
  // No dialog pops up; the field itself takes the words.
  expect(screen.queryByRole('dialog', { name: 'Search AgroTrends' })).not.toBeInTheDocument()
  await userEvent.type(field, 'boro rice{Enter}')
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/search?q=boro%20rice'))
  expect(screen.getByRole('searchbox', { name: 'Search AgroTrends' })).toHaveValue('boro rice')
})

test('below 1024px the search icon and Ctrl+K open the search dialog', async () => {
  mockApi({ 'GET /api/questions/all': () => envelope(200, page([])), 'GET /api/categories/all': () => envelope(200, page([])) })
  renderWithProviders(<App />, '/')

  const icon = await screen.findByRole('button', { name: 'Search' })
  expect(icon).toHaveAttribute('aria-keyshortcuts', 'Control+K Meta+K')
  await userEvent.click(icon)
  expect(await screen.findByRole('dialog', { name: 'Search AgroTrends' })).toBeInTheDocument()
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Search AgroTrends' })).not.toBeInTheDocument())

  // jsdom lays nothing out, so the bar's field counts as hidden and Ctrl+K falls back to the dialog.
  await userEvent.keyboard('{Control>}k{/Control}')
  expect(await screen.findByRole('dialog', { name: 'Search AgroTrends' })).toBeInTheDocument()
})

test('a signed-in reader reaches their profile from the sidebar and the account menu', async () => {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  mockApi({
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 7, name: 'Rahim Uddin' } }),
    'GET /api/questions/all': () => envelope(200, page([])),
    'GET /api/categories/all': () => envelope(200, page([])),
  })
  renderWithProviders(<App />, '/questions')

  const sidebar = await screen.findByRole('complementary', { name: 'Navigation' })
  expect(await within(sidebar).findByRole('link', { name: 'Your profile' })).toHaveAttribute('href', '/users/7')
  await userEvent.click(await screen.findByRole('button', { name: 'Account' }))
  expect(await screen.findByRole('menuitem', { name: 'Your profile' })).toHaveAttribute('href', '/users/7')
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

test('signing in is a focused page: only the logo and a way back, no sidebar, search or tab bar', async () => {
  mockApi({})
  renderWithProviders(<App />, '/sign-in')

  expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'AgroTrends home' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back to AgroTrends' })).toHaveAttribute('href', '/')
  expect(screen.queryByRole('complementary', { name: 'Navigation' })).not.toBeInTheDocument()
  expect(screen.queryByRole('searchbox', { name: 'Search AgroTrends' })).not.toBeInTheDocument()
  expect(screen.queryByRole('navigation', { name: 'Sections' })).not.toBeInTheDocument()
})
