import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const question = { questionId: 5, userId: 2, title: 'Yellow seedlings', content: '<p>After the cold.</p>', authorName: 'Karim', score: 0, answerCount: 0, createdAt: '2026-10-31T06:00:00Z' }
const story = { id: 3, slug: 'oxygen', title: 'Keeping oxygen up', content: '<p>Before sunrise.</p>', status: 'PUBLISHED', publishedAt: '2026-10-30T06:00:00Z', author: { authorId: 1, name: 'Nasrin' } }

function questionApi() {
  return mockApi({
    'GET /api/questions/id/5': () => envelope(200, question),
    'GET /api/answers/question/5': () => envelope(200, []),
    'GET /api/questions/id/5/ai-answer': () => envelope(404, null, 'Not found'),
    'GET /api/categories/all': () => envelope(200, page([])),
  })
}

function touchScreen() {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(pointer: coarse)', addEventListener() {}, removeEventListener() {} }))
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, 'share')
})

test('on a computer, Share offers Copy link and each service with the question address', async () => {
  questionApi()
  const writeText = vi.fn(() => Promise.resolve())
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  renderWithProviders(<App />, '/questions/5?from=feed#your-answer')

  await userEvent.click(await screen.findByRole('button', { name: 'Share' }))
  const menu = await screen.findByRole('menu')
  const address = `${window.location.origin}/share/questions/5`
  expect(within(menu).getByRole('menuitem', { name: 'Facebook' })).toHaveAttribute('href', `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(address)}`)
  expect(within(menu).getByRole('menuitem', { name: 'WhatsApp' })).toHaveAttribute('target', '_blank')
  for (const name of ['X', 'LinkedIn', 'Telegram', 'E-mail']) expect(within(menu).getByRole('menuitem', { name })).toBeInTheDocument()
  // Messenger's link only opens its phone app.
  expect(within(menu).queryByRole('menuitem', { name: 'Messenger' })).not.toBeInTheDocument()

  await userEvent.click(within(menu).getByRole('menuitem', { name: 'Copy link' }))
  expect(writeText).toHaveBeenCalledWith(address)
  expect(await screen.findByText('Link copied')).toBeInTheDocument()
})

test("on a phone, Share opens the phone's own share sheet with the title and address", async () => {
  questionApi()
  touchScreen()
  const share = vi.fn(() => Promise.resolve())
  Object.defineProperty(navigator, 'share', { value: share, configurable: true })
  renderWithProviders(<App />, '/questions/5')

  await userEvent.click(await screen.findByRole('button', { name: 'Share' }))
  expect(share).toHaveBeenCalledWith({ title: 'Yellow seedlings', text: 'Yellow seedlings', url: `${window.location.origin}/share/questions/5` })
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})

test('on a phone without a share sheet (an in-app browser), the menu also offers Messenger', async () => {
  questionApi()
  touchScreen()
  renderWithProviders(<App />, '/questions/5')

  await userEvent.click(await screen.findByRole('button', { name: 'Share' }))
  const messenger = within(await screen.findByRole('menu')).getByRole('menuitem', { name: 'Messenger' })
  expect(messenger.getAttribute('href')).toMatch(/^fb-messenger:\/\/share\/\?link=/)
  expect(messenger).not.toHaveAttribute('target')
})

test('a published story can be shared; a draft has nothing to share', async () => {
  mockApi({
    'GET /api/blogs/slug/oxygen': () => envelope(200, story),
    'GET /api/blogs/slug/draft': () => envelope(200, { ...story, slug: 'draft', status: 'DRAFT' }),
    'GET /api/categories/all': () => envelope(200, page([])),
  })
  const view = renderWithProviders(<App />, '/stories/oxygen')
  expect(await screen.findByRole('heading', { level: 1, name: 'Keeping oxygen up' })).toBeInTheDocument()
  expect(screen.getAllByRole('button', { name: 'Share' }).length).toBeGreaterThan(0)
  view.unmount()

  renderWithProviders(<App />, '/stories/draft')
  expect(await screen.findByRole('heading', { level: 1, name: 'Keeping oxygen up' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument()
})
