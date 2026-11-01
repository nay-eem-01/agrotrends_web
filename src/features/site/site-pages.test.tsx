import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { setLang } from '../../lib/i18n'
import { CONTACT_EMAIL } from '../../lib/site'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

beforeEach(() => {
  localStorage.clear()
  clearSession()
  mockApi({ 'GET /api/categories/all': () => envelope(200, page([])), 'GET /api/tags': () => envelope(200, []) })
})

afterEach(() => {
  setLang('en')
  vi.unstubAllGlobals()
})

test('the footer links to every section, the about page and both legal pages, and to the contact address', async () => {
  renderWithProviders(<App />, '/about')
  expect(await screen.findByRole('heading', { level: 1, name: 'About us' })).toBeInTheDocument()

  const footer = screen.getByRole('contentinfo')
  const explore = within(footer).getByRole('navigation', { name: 'Explore' })
  expect(within(explore).getByRole('link', { name: 'Topics' })).toHaveAttribute('href', '/topics')
  const about = within(footer).getByRole('navigation', { name: 'AgroTrends' })
  expect(within(about).getByRole('link', { name: 'About us' })).toHaveAttribute('href', '/about')
  expect(within(about).getByRole('link', { name: 'Contact us' })).toHaveAttribute('href', `mailto:${CONTACT_EMAIL}`)
  const legal = within(footer).getByRole('navigation', { name: 'Legal' })
  // Social links stay hidden until their pages are filled in.
  expect(within(footer).queryByRole('list', { name: 'AgroTrends elsewhere' })).not.toBeInTheDocument()

  await userEvent.click(within(legal).getByRole('link', { name: 'Privacy policy' }))
  expect(await screen.findByRole('heading', { level: 1, name: 'Privacy policy' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Who else handles it' })).toBeInTheDocument()
  expect(screen.getAllByRole('link', { name: CONTACT_EMAIL }).length).toBeGreaterThan(0)

  await userEvent.click(within(legal).getByRole('link', { name: 'Terms of use' }))
  expect(await screen.findByRole('heading', { level: 1, name: 'Terms of use' })).toBeInTheDocument()
  expect(screen.getByText(/governed by the laws of Bangladesh/)).toBeInTheDocument()
})

test('in Bengali the about page is translated and the legal pages say they are English for now', async () => {
  setLang('bn')
  renderWithProviders(<App />, '/about')
  expect(await screen.findByRole('heading', { level: 1, name: 'আমাদের কথা' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'আমরা কারা' })).toBeInTheDocument()

  await userEvent.click(within(screen.getByRole('navigation', { name: 'নীতিমালা' })).getByRole('link', { name: 'গোপনীয়তা নীতি' }))
  expect(await screen.findByText('এই পাতাটি আপাতত ইংরেজিতে। বাংলা সংস্করণ শীঘ্রই আসছে।')).toBeInTheDocument()
})

test('sign-up says that creating an account accepts the terms and the privacy policy', async () => {
  renderWithProviders(<App />, '/sign-up')
  const form = (await screen.findByRole('button', { name: 'Create account' })).closest('form')!
  expect(within(form).getByRole('link', { name: 'Terms of use' })).toHaveAttribute('href', '/terms')
  expect(within(form).getByRole('link', { name: 'Privacy policy' })).toHaveAttribute('href', '/privacy')
})
