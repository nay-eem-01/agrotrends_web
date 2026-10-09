import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

function signedIn(routes: object) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return { 'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 9, name: 'Karim' } }), ...routes }
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('earlier questions are listed and open to their answers', async () => {
  mockApi(
    signedIn({
      'GET /api/ai/history': (url: URL) =>
        url.searchParams.get('pageNo') === '0'
          ? envelope(200, page([{ id: 1, question: 'Blast on boro?', answer: 'Use tricyclazole early.', askedAt: '2026-10-08T06:00:00Z' }], 0, false))
          : envelope(200, page([{ id: 2, question: 'Older one', answer: 'Older answer', askedAt: '2026-09-01T06:00:00Z' }], 1, true)),
    }),
  )
  renderWithProviders(<App />, '/advisor/history')

  const question = await screen.findByText('Blast on boro?')
  expect(screen.getByText('Asked Oct 8')).toBeInTheDocument()
  const details = question.closest('details')!
  expect(details).not.toHaveAttribute('open')
  await userEvent.click(question)
  expect(details).toHaveAttribute('open')
  expect(screen.getByText('Use tricyclazole early.')).toBeVisible()

  await userEvent.click(screen.getByRole('button', { name: 'Show older questions' }))
  expect(await screen.findByText('Older one')).toBeInTheDocument()
})

test('no history says what will appear', async () => {
  mockApi(signedIn({ 'GET /api/ai/history': () => envelope(200, page([])) }))
  renderWithProviders(<App />, '/advisor/history')
  expect(await screen.findByText(/What you ask the advisor is kept here/)).toBeInTheDocument()
})

test('history needs sign-in', () => {
  mockApi({})
  renderWithProviders(<App />, '/advisor/history')
  expect(screen.getByTestId('path')).toHaveTextContent('/sign-in?next=%2Fadvisor%2Fhistory')
})
