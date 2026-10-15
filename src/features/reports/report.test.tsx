import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const question = { questionId: 5, userId: 2, title: 'Yellow seedlings', content: 'After the cold.', authorName: 'Karim' }
const answer = { answerId: 1, questionId: 5, userId: 8, authorName: 'Rahim', content: 'Spray 10x the label dose.' }

function signedInAs(id: number) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return {
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id, name: 'Salma' } }),
    'GET /api/users/9/reputation': () => envelope(200, { total: 0, topics: [] }),
    'GET /api/questions/id/5/my-votes': () => envelope(200, { answers: {} }),
    'GET /api/questions/id/5': () => envelope(200, question),
    'GET /api/answers/question/5': () => envelope(200, [answer]),
  }
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('an answer is reported with a reason and details', async () => {
  const api = mockApi({ ...signedInAs(9), 'POST /api/reports': () => envelope(200, { id: 1 }) })
  renderWithProviders(<App />, '/questions/5')

  const card = await screen.findByRole('article', { name: 'Answer by Rahim' })
  await userEvent.click(within(card).getByRole('button', { name: 'Report' }))
  const dialog = await screen.findByRole('dialog', { name: 'Report this answer' })
  await userEvent.click(within(dialog).getByRole('button', { name: 'Send report' }))
  expect(within(dialog).getByText('Choose what is wrong.')).toBeInTheDocument()

  await userEvent.click(within(dialog).getByRole('radio', { name: /Harmful advice/ }))
  await userEvent.type(within(dialog).getByLabelText('Details (optional)'), 'Ten times the dose burns the crop.')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Send report' }))

  expect(await within(dialog).findByText('Thanks, moderators will look at it.')).toBeInTheDocument()
  const sent = api.mock.calls.find(([url]) => url === '/api/reports')!
  expect(JSON.parse(sent[1]!.body as string)).toEqual({ targetType: 'ANSWER', targetId: 1, reason: 'HARMFUL_ADVICE', details: 'Ten times the dose burns the crop.' })
  await userEvent.click(within(dialog).getByRole('button', { name: 'Done' }))
  await waitFor(() => expect(within(card).getByRole('button', { name: 'Reported' })).toBeDisabled())
})

test('reporting the same thing again counts as reported (409)', async () => {
  mockApi({ ...signedInAs(9), 'POST /api/reports': () => envelope(409, null, 'You have already reported this.') })
  renderWithProviders(<App />, '/questions/5')

  await screen.findByRole('heading', { level: 1, name: 'Yellow seedlings' })
  const reports = await screen.findAllByRole('button', { name: 'Report' })
  await userEvent.click(reports[0])
  const dialog = await screen.findByRole('dialog', { name: 'Report this question' })
  await userEvent.click(within(dialog).getByRole('radio', { name: /Spam/ }))
  await userEvent.click(within(dialog).getByRole('button', { name: 'Send report' }))
  expect(await within(dialog).findByText('You have already reported this.')).toBeInTheDocument()
})

test('no report button on your own posts', async () => {
  mockApi({ ...signedInAs(8), 'GET /api/users/8/reputation': () => envelope(200, { total: 0, topics: [] }) })
  renderWithProviders(<App />, '/questions/5')
  const mine = await screen.findByRole('article', { name: 'Answer by Rahim' })
  expect(within(mine).queryByRole('button', { name: 'Report' })).not.toBeInTheDocument()
  // The question is someone else's.
  expect(screen.getAllByRole('button', { name: 'Report' })).toHaveLength(1)
})

test('visitors sign in before reporting', async () => {
  mockApi({ 'GET /api/questions/id/5': () => envelope(200, question), 'GET /api/answers/question/5': () => envelope(200, []) })
  renderWithProviders(<App />, '/questions/5')
  await userEvent.click(await screen.findByRole('button', { name: 'Report' }))
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/sign-in?next=%2Fquestions%2F5'))
})
