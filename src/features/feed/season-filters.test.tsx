import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import type { BlogResponse } from '../../api/types'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

function story(id: number, overrides: Partial<BlogResponse> = {}): BlogResponse {
  return { id, slug: `story-${id}`, title: `Story ${id}`, content: '<p>Body.</p>', author: { authorId: 7, name: 'Nasrin' }, agri: {}, ...overrides }
}

function query(api: ReturnType<typeof mockApi>, path: string): URLSearchParams[] {
  return api.mock.calls
    .map(([url]) => new URL(String(url), 'http://x'))
    .filter((url) => url.pathname === path)
    .map((url) => url.searchParams)
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 8, 12))
  localStorage.clear()
  clearSession()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

test('the strip marks the current season', async () => {
  mockApi({ 'GET /api/feed/latest': () => envelope(200, page([])) })
  renderWithProviders(<App />, '/')

  const strip = screen.getByRole('navigation', { name: 'Crop seasons' })
  const links = within(strip).getAllByRole('link')
  expect(links.map((link) => link.textContent)).toEqual([
    expect.stringMatching(/^Rabi/),
    expect.stringMatching(/^Kharif-1/),
    expect.stringMatching(/^Kharif-2now/),
  ])
  expect(within(links[2]).getByTestId('today-marker')).toBeInTheDocument()
  expect(within(links[0]).queryByTestId('today-marker')).not.toBeInTheDocument()
})

test('choosing a season filters the stories, and choosing it again clears it', async () => {
  const api = mockApi({
    'GET /api/feed/latest': () => envelope(200, page([story(1)])),
    'GET /api/blogs/all': () => envelope(200, page([story(2, { title: 'Aman transplanting', agri: { season: 'KHARIF_2' } })])),
  })
  renderWithProviders(<App />, '/')
  await screen.findByRole('link', { name: 'Story 1' })

  const strip = screen.getByRole('navigation', { name: 'Crop seasons' })
  await userEvent.click(within(strip).getByRole('link', { name: /Kharif-2/ }))

  expect(await screen.findByRole('link', { name: 'Aman transplanting' })).toBeInTheDocument()
  expect(screen.getByTestId('path')).toHaveTextContent('/?season=KHARIF_2')
  const sent = query(api, '/api/blogs/all')[0]
  expect(sent.get('season')).toBe('KHARIF_2')
  expect(sent.get('sortBy')).toBe('creationDate')
  expect(sent.get('ascOrDesc')).toBe('desc')
  expect(within(strip).getByRole('link', { name: /Kharif-2/ })).toHaveAttribute('aria-current', 'true')
  expect(screen.getByRole('link', { name: 'Latest' })).not.toHaveAttribute('aria-current')

  await userEvent.click(within(strip).getByRole('link', { name: /Kharif-2/ }))
  expect(screen.getByTestId('path')).toHaveTextContent(/^\/$/)
})

test('crop, region and soil filters combine with the season', async () => {
  const api = mockApi({ 'GET /api/blogs/all': () => envelope(200, page([story(3, { title: 'Boro on clay loam' })])) })
  renderWithProviders(<App />, '/?season=RABI')
  await screen.findByRole('link', { name: 'Boro on clay loam' })

  await userEvent.click(screen.getByRole('button', { name: 'Filter by crop, region or soil' }))
  await userEvent.type(screen.getByLabelText('Crop'), ' boro rice ')
  await userEvent.type(screen.getByLabelText('Region'), 'Rangpur')
  await userEvent.selectOptions(screen.getByLabelText('Soil'), 'Clay loam')
  await userEvent.click(screen.getByRole('button', { name: 'Show stories' }))

  expect(screen.getByTestId('path')).toHaveTextContent('/?crop=boro+rice&season=RABI&region=Rangpur&soil=CLAY_LOAM')
  const last = query(api, '/api/blogs/all').at(-1)!
  expect(Object.fromEntries(['crop', 'season', 'region', 'soil'].map((key) => [key, last.get(key)]))).toEqual({
    crop: 'boro rice',
    season: 'RABI',
    region: 'Rangpur',
    soil: 'CLAY_LOAM',
  })
})

test('active filters can be removed one at a time', async () => {
  mockApi({ 'GET /api/blogs/all': () => envelope(200, page([story(4)])) })
  renderWithProviders(<App />, '/?crop=jute&soil=SANDY')
  await screen.findByRole('link', { name: 'Story 4' })

  await userEvent.click(screen.getByRole('link', { name: 'Remove filter soil Sandy' }))
  expect(screen.getByTestId('path')).toHaveTextContent('/?crop=jute')
  expect(screen.queryByRole('link', { name: 'Clear all' })).not.toBeInTheDocument()
})

test('crop and season chips on a story are filters', async () => {
  mockApi({
    'GET /api/feed/latest': () => envelope(200, page([story(5, { agri: { crop: 'jute', season: 'KHARIF_1' } })])),
    'GET /api/blogs/all': () => envelope(200, page([])),
  })
  renderWithProviders(<App />, '/')

  await userEvent.click(await screen.findByRole('link', { name: 'Stories about jute' }))
  expect(screen.getByTestId('path')).toHaveTextContent('/?crop=jute')
  expect(await screen.findByRole('heading', { name: 'No stories match these filters' })).toBeInTheDocument()
})
