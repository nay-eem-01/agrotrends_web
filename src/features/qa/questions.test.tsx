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
  const sent = new URL(String(api.mock.calls[0][0]), 'http://x')
  expect(sent.searchParams.get('ascOrDesc')).toBe('desc')
})

test('the season strip and filters stay on the questions page', async () => {
  const api = mockApi({ 'GET /api/questions/all': () => envelope(200, page([])) })
  renderWithProviders(<App />, '/questions?crop=jute')

  expect(await screen.findByRole('heading', { name: 'No questions match these filters' })).toBeInTheDocument()
  await userEvent.click(within(screen.getByRole('navigation', { name: 'Crop seasons' })).getByRole('link', { name: /Kharif-1/ }))
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
