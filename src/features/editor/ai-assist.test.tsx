import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { saveLocalDraft } from '../../lib/draft'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

function author(assist: () => Response) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return {
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 9, name: 'Nasrin', authorId: 3 } }),
    'GET /api/categories/all': () => envelope(200, page([{ id: 1, categoryName: 'Fisheries' }])),
    'GET /api/tags': () => envelope(200, []),
    'POST /api/ai/blog-assist': assist,
  }
}

async function openSheet() {
  renderWithProviders(<App />, '/write')
  await userEvent.click(await screen.findByRole('button', { name: 'Publish' }))
  return within(await screen.findByRole('dialog'))
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
  saveLocalDraft({ title: 'Hilsa runs', html: '<p>Hilsa move upriver.</p>' })
})

afterEach(() => vi.unstubAllGlobals())

test('AI suggests a summary and topics the author can add', async () => {
  const api = mockApi(author(() => envelope(200, { summary: 'Hilsa spawn upriver in the monsoon.', suggestedTags: ['hilsa', 'monsoon'] })))
  const sheet = await openSheet()

  await userEvent.click(sheet.getByRole('button', { name: 'Suggest topics and a summary' }))
  expect(await sheet.findByText('Hilsa spawn upriver in the monsoon.')).toBeInTheDocument()
  expect(sheet.getByText('Suggested by AI. Check before you use it.')).toBeInTheDocument()

  await userEvent.click(sheet.getByRole('button', { name: '+ monsoon' }))
  expect(sheet.getByRole('button', { name: 'Remove topic monsoon' })).toBeInTheDocument()
  expect(sheet.queryByRole('button', { name: '+ monsoon' })).not.toBeInTheDocument()

  const sent = JSON.parse(api.mock.calls.find(([url]) => url === '/api/ai/blog-assist')![1]!.body as string)
  expect(sent).toEqual({ title: 'Hilsa runs', content: '<p>Hilsa move upriver.</p>' })
})

test('an unavailable AI says so and leaves the sheet usable', async () => {
  mockApi(author(() => envelope(503, null, 'The AI advisor is not available right now. Please try again later.')))
  const sheet = await openSheet()

  await userEvent.click(sheet.getByRole('button', { name: 'Suggest topics and a summary' }))
  expect(await sheet.findByRole('alert')).toHaveTextContent('The AI advisor is not available right now.')
  expect(sheet.getByRole('button', { name: 'Publish now' })).toBeEnabled()
})
