import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import type { Question } from '../../api/questions'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const question: Question = {
  questionId: 5,
  userId: 2,
  title: 'Why are my boro seedlings yellow?',
  content: '<p>Leaves turned <b>yellow</b> after the cold week.</p>',
  authorName: 'Karim',
  createdAt: '2026-10-08T06:00:00Z',
  agri: { crop: 'boro rice', season: 'RABI' },
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('questions are listed newest first with their farming context', async () => {
  const api = mockApi({ 'GET /api/questions/all': () => envelope(200, page([question])) })
  renderWithProviders(<App />, '/questions')

  const link = await screen.findByRole('link', { name: 'Why are my boro seedlings yellow?' })
  expect(link).toHaveAttribute('href', '/questions/5')
  const row = link.closest('li')!
  expect(within(row).getByText('Leaves turned yellow after the cold week.')).toBeInTheDocument()
  expect(within(row).getByRole('link', { name: 'boro rice' })).toHaveAttribute('href', '/questions?crop=boro+rice')
  expect(within(row).getByRole('link', { name: 'Rabi' })).toHaveAttribute('href', '/questions?season=RABI')
  const sent = api.mock.calls.map(([url]) => new URL(String(url), 'http://x')).find((url) => url.pathname === '/api/questions/all')!
  expect(sent.searchParams.get('ascOrDesc')).toBe('desc')
})

test('season and farming filters stay on the questions page', async () => {
  const api = mockApi({ 'GET /api/questions/all': () => envelope(200, page([])) })
  renderWithProviders(<App />, '/questions?crop=jute')

  expect(await screen.findByRole('heading', { name: 'No questions match these filters' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Filter by crop, season, region or soil' }))
  await userEvent.selectOptions(screen.getByLabelText('Season'), 'Kharif-1')
  await userEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/questions?crop=jute&season=KHARIF_1'))
  const last = new URL(String(api.mock.calls.at(-1)![0]), 'http://x')
  expect(last.searchParams.get('season')).toBe('KHARIF_1')
  expect(last.searchParams.get('crop')).toBe('jute')

  await userEvent.click(screen.getByRole('link', { name: 'Remove filter crop jute' }))
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/questions?season=KHARIF_1'))
})

test('more questions load on request', async () => {
  mockApi({
    'GET /api/questions/all': (url) =>
      url.searchParams.get('pageNo') === '0'
        ? envelope(200, page([question], 0, false))
        : envelope(200, page([{ ...question, questionId: 6, title: 'Second page question' }], 1, true)),
  })
  renderWithProviders(<App />, '/questions')

  await userEvent.click(await screen.findByRole('button', { name: 'Show more questions' }))
  expect(await screen.findByRole('link', { name: 'Second page question' })).toBeInTheDocument()
})

function lastQuery(api: ReturnType<typeof mockApi>) {
  return api.mock.calls
    .map(([url]) => new URL(String(url), 'http://x'))
    .filter((url) => url.pathname === '/api/questions/all')
    .at(-1)!.searchParams
}

test('home lands on questions, with stories as the second tab', async () => {
  mockApi({ 'GET /api/questions/all': () => envelope(200, page([question])), 'GET /api/categories/all': () => envelope(200, page([])) })
  renderWithProviders(<App />, '/')

  expect(await screen.findByRole('link', { name: 'Why are my boro seedlings yellow?' })).toBeInTheDocument()
  const tabs = screen.getByRole('navigation', { name: 'Home sections' })
  expect(within(tabs).getByRole('link', { name: 'Questions' })).toHaveAttribute('aria-current', 'page')
  expect(within(tabs).getByRole('link', { name: 'Stories' })).toHaveAttribute('href', '/stories')
})

test('cards show votes, answers and an accepted answer', async () => {
  mockApi({
    'GET /api/questions/all': () =>
      envelope(200, page([{ ...question, score: 7, answerCount: 3, acceptedAnswerId: 40, category: { id: 2, categoryName: 'Crops' }, tags: ['cold'] }])),
  })
  renderWithProviders(<App />, '/questions')

  const row = (await screen.findByRole('link', { name: 'Why are my boro seedlings yellow?' })).closest('li')!
  expect(within(row).getByText('7')).toBeInTheDocument()
  expect(within(row).getByText('3')).toBeInTheDocument()
  expect(within(row).getByText('An answer was accepted')).toBeInTheDocument()
  expect(within(row).getByRole('link', { name: 'Crops' })).toHaveAttribute('href', '/questions?categoryId=2')
  expect(within(row).getByRole('link', { name: '#cold' })).toHaveAttribute('href', '/questions?tag=cold')
})

test('Unanswered, topic and tag combine with the farming filters', async () => {
  const api = mockApi({
    'GET /api/questions/all': () => envelope(200, page([question])),
    'GET /api/categories/all': () => envelope(200, page([{ id: 2, categoryName: 'Crops' }])),
  })
  renderWithProviders(<App />, '/questions?tag=cold&crop=jute')
  await screen.findByRole('link', { name: 'Why are my boro seedlings yellow?' })
  expect(lastQuery(api).get('tag')).toBe('cold')

  await userEvent.click(screen.getByRole('link', { name: 'Unanswered' }))
  await waitFor(() => expect(lastQuery(api).get('unanswered')).toBe('true'))
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Topic' }), 'Crops')
  await waitFor(() => expect(lastQuery(api).get('categoryId')).toBe('2'))
  expect(Object.fromEntries(['crop', 'tag', 'unanswered'].map((key) => [key, lastQuery(api).get(key)]))).toEqual({ crop: 'jute', tag: 'cold', unanswered: 'true' })

  await userEvent.click(screen.getByRole('link', { name: 'Remove tag cold' }))
  await waitFor(() => expect(lastQuery(api).get('tag')).toBeNull())
  expect(lastQuery(api).get('categoryId')).toBe('2')
})
