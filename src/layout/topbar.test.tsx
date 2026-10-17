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
