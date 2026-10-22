import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi } from '../../test/api'
import { openMoreActions, renderWithProviders } from '../../test/render'

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
  await userEvent.click((await openMoreActions(card)).getByRole('menuitem', { name: 'Report' }))
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
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect((await openMoreActions(card)).getByRole('menuitem', { name: 'Reported' })).toHaveAttribute('aria-disabled', 'true')
})

test('reporting the same thing again counts as reported (409)', async () => {
  mockApi({ ...signedInAs(9), 'POST /api/reports': () => envelope(409, null, 'You have already reported this.') })
  renderWithProviders(<App />, '/questions/5')

  await screen.findByRole('heading', { level: 1, name: 'Yellow seedlings' })
  // The question's menu comes first on the page.
  await userEvent.click((await openMoreActions()).getByRole('menuitem', { name: 'Report' }))
  const dialog = await screen.findByRole('dialog', { name: 'Report this question' })
  await userEvent.click(within(dialog).getByRole('radio', { name: /Spam/ }))
  await userEvent.click(within(dialog).getByRole('button', { name: 'Send report' }))
  expect(await within(dialog).findByText('You have already reported this.')).toBeInTheDocument()
})

test('no report button on your own posts', async () => {
  mockApi({ ...signedInAs(8), 'GET /api/users/8/reputation': () => envelope(200, { total: 0, topics: [] }) })
  renderWithProviders(<App />, '/questions/5')
  const mine = await screen.findByRole('article', { name: 'Answer by Rahim' })
  const menu = await openMoreActions(mine)
  expect(menu.queryByRole('menuitem', { name: 'Report' })).not.toBeInTheDocument()
  expect(menu.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
})

test('visitors sign in before reporting', async () => {
  mockApi({ 'GET /api/questions/id/5': () => envelope(200, question), 'GET /api/answers/question/5': () => envelope(200, []) })
  renderWithProviders(<App />, '/questions/5')
  await screen.findByRole('heading', { level: 1 })
  await userEvent.click((await openMoreActions()).getByRole('menuitem', { name: 'Report' }))
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/sign-in?next=%2Fquestions%2F5'))
})
