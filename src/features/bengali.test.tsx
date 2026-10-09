import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../api/client'
import App from '../App'
import { setLang } from '../lib/i18n'
import { envelope, mockApi, page } from '../test/api'
import { renderWithProviders } from '../test/render'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 8, 12))
  localStorage.clear()
  clearSession()
})

afterEach(() => {
  setLang('en')
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const story = { id: 1, slug: 's', title: 'বোরো ধানের চারা', content: '<p>x</p>', readingTimeMinutes: 4, publishedAt: '2026-10-07T06:00:00Z', author: { authorId: 2, name: 'রহিম' }, agri: { season: 'RABI' } }

test('switching to Bengali changes the interface and asks the API in Bengali', async () => {
  const api = mockApi({ 'GET /api/feed/latest': () => envelope(200, page([story])), 'GET /api/tags': () => envelope(200, []) })
  renderWithProviders(<App />, '/')
  await screen.findByRole('link', { name: 'বোরো ধানের চারা' })

  await userEvent.click(screen.getByRole('button', { name: 'বাংলা' }))

  expect(document.documentElement.lang).toBe('bn')
  expect(screen.getAllByRole('link', { name: 'প্রশ্ন' }).length).toBeGreaterThan(0)
  expect(screen.getByRole('heading', { name: 'যাঁরা ফসল ফলান, তাঁদের কাছ থেকে চাষের জ্ঞান।' })).toBeInTheDocument()
  const strip = screen.getByRole('navigation', { name: 'Crop seasons' })
  expect(within(strip).getByText('খরিফ-২')).toBeInTheDocument()
  const card = screen.getByRole('link', { name: 'বোরো ধানের চারা' }).closest('article')!
  expect(within(card).getByText(/৪ মিনিটে পড়া/)).toBeInTheDocument()
  expect(within(card).getByText(/৭ অক্টো/)).toBeInTheDocument()
  await waitFor(() => expect(api.mock.calls.some(([url]) => String(url).startsWith('/api/feed/latest') && String(url).includes('lang=bn'))).toBe(true))
  expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument()
})

test('the choice is remembered', async () => {
  localStorage.setItem('agrotrends.lang', 'bn')
  setLang('bn')
  mockApi({ 'GET /api/questions/all': () => envelope(200, page([])) })
  renderWithProviders(<App />, '/questions')
  expect(await screen.findByRole('heading', { level: 1, name: 'প্রশ্ন' })).toBeInTheDocument()
  expect(await screen.findByRole('heading', { name: 'এখনো কোনো প্রশ্ন নেই' })).toBeInTheDocument()
})
