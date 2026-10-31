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
  expect(await screen.findByText('1,250')).toBeInTheDocument()
  const numbers = screen.getAllByRole('term').map((term) => `${term.textContent} ${term.nextElementSibling?.textContent ?? term.previousElementSibling?.textContent}`)
  expect(numbers).toContain('Reputation 1,250')
  expect(numbers).toContain('Accepted answers 32')
  expect(screen.getAllByText('Veterinarian')).toHaveLength(2) // the headline and the credential
  expect(screen.getByRole('heading', { name: 'Credentials' })).toBeInTheDocument()
  expect(screen.getAllByText('Verified expert in Livestock')).toHaveLength(2) // the headline chip and the credential
  expect(screen.queryByRole('link', { name: 'Edit profile' })).not.toBeInTheDocument()
  const livestock = screen.getByText('Livestock').closest('li')!
  expect(within(livestock).getByText('Verified expert · Veterinarian')).toBeInTheDocument()
  expect(within(livestock).getByText(/1,100 points · 30 accepted/)).toBeInTheDocument()
  const crops = screen.getByText('Crops').closest('li')!
  expect(within(crops).queryByText(/Verified expert/)).not.toBeInTheDocument()
  expect(await screen.findByRole('link', { name: 'Best feed for calves?' })).toHaveAttribute('href', '/questions/9')
})

test('your own profile offers Edit profile instead of Report', async () => {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  mockApi({
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 7, name: 'Dr Nasrin' } }),
    'GET /api/users/7/reputation': () => envelope(200, { total: 0, topics: [] }),
    'GET /api/questions/all/user/7': () => envelope(200, page([])),
  })
  renderWithProviders(<App />, '/users/7')

  expect(await screen.findByRole('link', { name: 'Edit profile' })).toHaveAttribute('href', '/settings')
  expect(screen.queryByRole('button', { name: /Report/ })).not.toBeInTheDocument()
})

test('with the backend summary and author profile: headline, location, followers, Follow and credentials', async () => {
  mockApi({
    'GET /api/users/7/profile': () => envelope(200, { userId: 7, name: 'Dr Nasrin', authorId: 3, location: 'Mymensingh', answerCount: 184, acceptedAnswerCount: 92, storyCount: 12, credentials: [{ title: 'PhD, Aquaculture', institution: 'BAU', year: 2016 }] }),
    'GET /api/authors/3': () => envelope(200, { authorId: 3, name: 'Dr Nasrin', designation: 'Fish health specialist', workPlaceOrInstitution: 'BAU', bio: 'Pond health.', followerCount: 1800, followedByMe: false, publishedPostCount: 12 }),
    'GET /api/users/7/reputation': () => envelope(200, { total: 2310, topics: [] }),
    'GET /api/questions/all/user/7': () => envelope(200, page([])),
    'GET /api/answers/all/user/7': () => envelope(200, page([{ answerId: 4, questionId: 5, questionTitle: 'Tilapia gasping?', score: 18, accepted: true, createdAt: '2026-10-30T06:00:00Z' }])),
    'GET /api/blogs/all/author/3': () => envelope(200, page([])),
  })
  renderWithProviders(<App />, '/users/7')

  expect(await screen.findByText('Fish health specialist · BAU')).toBeInTheDocument()
  expect(screen.getByText('Mymensingh')).toBeInTheDocument()
  expect(screen.getByText('1,800 followers')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Follow Dr Nasrin' })).toHaveAttribute('aria-pressed', 'false')
  const numbers = screen.getAllByRole('term').map((term) => `${term.textContent} ${term.nextElementSibling?.textContent}`)
  expect(numbers).toEqual(['Reputation 2,310', 'Answers 184', 'Accepted 92', 'Stories 12'])
  expect(screen.getByText('PhD, Aquaculture')).toBeInTheDocument()
  const recent = (await screen.findByRole('heading', { name: 'Recent contributions' })).closest('section')!
  expect(await within(recent).findByRole('link', { name: 'Tilapia gasping?' })).toHaveAttribute('href', '/questions/5#answer-4')

  const sections = within(screen.getByRole('navigation', { name: 'Profile sections' }))
  expect(sections.getAllByRole('button').map((button) => button.textContent)).toEqual(['Overview', 'Stories12', 'Questions0', 'Answers1'])
})
