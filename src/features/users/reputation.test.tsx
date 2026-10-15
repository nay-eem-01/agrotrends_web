import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const question = {
  questionId: 5,
  userId: 2,
  title: 'Yellow seedlings',
  content: 'After the cold.',
  authorName: 'Karim',
  authorReputation: 40,
  authorBadges: [],
}
const expertAnswer = {
  answerId: 1,
  questionId: 5,
  userId: 7,
  authorName: 'Dr Nasrin',
  content: 'Cold injury.',
  authorReputation: 1250,
  authorBadges: ['VERIFIED_EXPERT', 'TOP_CONTRIBUTOR'],
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('author lines show reputation and the badges earned in this topic', async () => {
  mockApi({
    'GET /api/questions/id/5': () => envelope(200, question),
    'GET /api/answers/question/5': () => envelope(200, [expertAnswer, { ...expertAnswer, answerId: 2, userId: 8, authorName: 'Rahim', authorReputation: 3, authorBadges: [] }]),
  })
  renderWithProviders(<App />, '/questions/5')

  const expert = await screen.findByRole('article', { name: 'Answer by Dr Nasrin' })
  expect(within(expert).getByText('Verified expert')).toBeInTheDocument()
  expect(within(expert).getByText('Top contributor')).toBeInTheDocument()
  expect(within(expert).getByText('1,250')).toBeInTheDocument()
  expect(within(expert).getByRole('link', { name: 'Dr Nasrin' })).toHaveAttribute('href', '/users/7')
  const plain = screen.getByRole('article', { name: 'Answer by Rahim' })
  expect(within(plain).queryByText('Verified expert')).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Karim' })).toHaveAttribute('href', '/users/2')
})

test('the profile shows reputation by topic, the expert field, and their questions', async () => {
  mockApi({
    'GET /api/questions/id/5': () => envelope(200, question),
    'GET /api/answers/question/5': () => envelope(200, [expertAnswer]),
    'GET /api/users/7/reputation': () =>
      envelope(200, {
        total: 1250,
        topics: [
          { categoryId: 1, categoryName: 'Livestock', points: 1100, acceptedAnswers: 30, badges: ['VERIFIED_EXPERT'], expertField: 'Veterinarian' },
          { categoryId: 2, categoryName: 'Crops', points: 150, acceptedAnswers: 2, badges: [] },
        ],
      }),
    'GET /api/questions/all/user/7': () => envelope(200, page([{ ...question, questionId: 9, userId: 7, title: 'Best feed for calves?', authorName: 'Dr Nasrin' }])),
  })
  renderWithProviders(<App />, '/questions/5')

  await userEvent.click(await screen.findByRole('link', { name: 'Dr Nasrin' }))
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/users/7'))
  expect(await screen.findByRole('heading', { level: 1, name: 'Dr Nasrin' })).toBeInTheDocument()
  expect(await screen.findByText('1,250 reputation')).toBeInTheDocument()
  const livestock = screen.getByText('Livestock').closest('li')!
  expect(within(livestock).getByText('Verified expert · Veterinarian')).toBeInTheDocument()
  expect(within(livestock).getByText(/1,100 points · 30 accepted/)).toBeInTheDocument()
  const crops = screen.getByText('Crops').closest('li')!
  expect(within(crops).queryByText(/Verified expert/)).not.toBeInTheDocument()
  expect(await screen.findByRole('link', { name: 'Best feed for calves?' })).toHaveAttribute('href', '/questions/9')
})
