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

test('the footer links to every section, the about page, both legal pages, the contact address and our social pages', async () => {
  renderWithProviders(<App />, '/about')
  expect(await screen.findByRole('heading', { level: 1, name: 'About us' })).toBeInTheDocument()

  const footer = screen.getByRole('contentinfo')
  // Under the page and the sidebar, not beside the sidebar inside the page column.
  expect(screen.getByRole('main').contains(footer)).toBe(false)
  expect(footer.parentElement?.contains(screen.getByRole('main'))).toBe(true)
  const explore = within(footer).getByRole('navigation', { name: 'Explore' })
  expect(within(explore).getByRole('link', { name: 'Topics' })).toHaveAttribute('href', '/topics')
  const about = within(footer).getByRole('navigation', { name: 'AgroTrends' })
  expect(within(about).getByRole('link', { name: 'About us' })).toHaveAttribute('href', '/about')
  expect(within(about).getByRole('link', { name: 'Contact us' })).toHaveAttribute('href', `mailto:${CONTACT_EMAIL}`)
  const legal = within(footer).getByRole('navigation', { name: 'Legal' })
  const elsewhere = within(footer).getByRole('list', { name: 'AgroTrends elsewhere' })
  expect(within(elsewhere).getByRole('link', { name: 'Facebook' })).toHaveAttribute('href', 'https://www.facebook.com/AgroTrends')
  expect(within(elsewhere).getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', 'https://www.instagram.com/agrotrendsbd')

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
  expect(screen.getByRole('heading', { name: 'একটি উত্তর কীভাবে যাচাই হয়' })).toBeInTheDocument()
  expect(screen.getByText('যাচাই করা বিশেষজ্ঞ নিশ্চিত করেছেন')).toBeInTheDocument()

  await userEvent.click(within(screen.getByRole('navigation', { name: 'নীতিমালা' })).getByRole('link', { name: 'গোপনীয়তা নীতি' }))
  expect(await screen.findByText('এই পাতাটি আপাতত ইংরেজিতে। বাংলা সংস্করণ শীঘ্রই আসছে।')).toBeInTheDocument()
})

test('the about page shows how an answer gets checked, with the marks the product uses, and leads to asking and applying', async () => {
  renderWithProviders(<App />, '/about')
  expect(await screen.findByRole('heading', { level: 1, name: 'About us' })).toBeInTheDocument()

  const steps = within(screen.getByRole('heading', { name: 'How an answer gets checked' }).closest('section')!).getByRole('list')
  const items = within(steps).getAllByRole('listitem')
  expect(items.map((item) => within(item).getByRole('heading').textContent)).toEqual(['You ask in public', 'The AI answers first', 'An expert checks it', 'People answer, you choose'])
  expect(within(items[0]).getByText('Unanswered')).toBeInTheDocument()
  expect(within(items[1]).getByText('Not yet checked by an expert')).toBeInTheDocument()
  expect(within(items[2]).getByText('Confirmed by a verified expert')).toBeInTheDocument()
  expect(within(items[3]).getByText('Accepted')).toBeInTheDocument()

  const header = screen.getByRole('heading', { level: 1 }).parentElement!
  expect(within(header).getByRole('link', { name: 'See questions' })).toHaveAttribute('href', '/questions')
  // The expert offer comes once, beside the text that explains it.
  expect(within(header).queryByRole('link', { name: 'Become a verified expert' })).not.toBeInTheDocument()
  expect(within(screen.getByRole('heading', { name: 'Verified experts' }).closest('section')!).getByRole('link', { name: 'Become a verified expert' })).toHaveAttribute('href', '/experts/apply')
  for (const [name, href] of [['Browse stories', '/stories'], ['Open the advisor', '/advisor'], ['Write a story', '/write']]) {
    expect(within(screen.getByRole('main')).getByRole('link', { name })).toHaveAttribute('href', href)
  }
  expect(within(screen.getByRole('main')).getByRole('link', { name: CONTACT_EMAIL })).toHaveAttribute('href', `mailto:${CONTACT_EMAIL}`)
})

test('sign-up says that creating an account accepts the terms and the privacy policy', async () => {
  renderWithProviders(<App />, '/sign-up')
  const form = (await screen.findByRole('button', { name: 'Create account' })).closest('form')!
  expect(within(form).getByRole('link', { name: 'Terms of use' })).toHaveAttribute('href', '/terms')
  expect(within(form).getByRole('link', { name: 'Privacy policy' })).toHaveAttribute('href', '/privacy')
})
