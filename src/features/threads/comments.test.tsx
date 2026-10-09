import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import type { BlogResponse } from '../../api/types'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

const story: BlogResponse = { id: 402, slug: 'rice-blast', title: 'Rice blast', content: '<p>Body.</p>', author: { authorId: 1, name: 'Nasrin' }, status: 'PUBLISHED', agri: {} }

interface CommentResponse {
  commentId: number
  blogId: number
  parentCommentId: number | null
  userId: number
  authorName: string
  content: string
  createdAt: string
  updatedAt: string
}

function comment(commentId: number, overrides: Partial<CommentResponse> = {}): CommentResponse {
  return {
    commentId,
    blogId: 402,
    parentCommentId: null,
    userId: 20,
    authorName: 'Rahim Uddin',
    content: `Response ${commentId}`,
    createdAt: `2026-10-0${commentId}T06:00:00Z`,
    updatedAt: `2026-10-0${commentId}T06:00:00Z`,
    ...overrides,
  }
}

const me = { id: 9, name: 'Karim', email: 'karim@farm.bd' }

function signedIn() {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return {
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: me }),
    'GET /api/bookmarks': () => envelope(200, page([])),
    'GET /api/blogs/id/402/claps': () => envelope(200, { totalClaps: 0, myClaps: 0 }),
  }
}

function bodyOf(api: ReturnType<typeof mockApi>, method: string, path: string): unknown {
  const call = api.mock.calls.find(([url, init]) => init?.method === method && String(url).startsWith(path))
  return call ? JSON.parse(call[1]!.body as string) : undefined
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

async function responsesSection() {
  return within((await screen.findByRole('heading', { name: /^Responses/ })).closest('section')!)
}

test('responses and their replies are listed oldest first, with a count', async () => {
  mockApi({
    'GET /api/blogs/slug/rice-blast': () => envelope(200, story),
    'GET /api/comments/blog/402': () => envelope(200, [comment(2), comment(1, { content: 'First line\nsecond line' })]),
    'GET /api/comments/replies/1': () => envelope(200, [comment(3, { parentCommentId: 1, authorName: 'Salma', content: 'A reply' })]),
    'GET /api/comments/replies/2': () => envelope(200, []),
  })
  renderWithProviders(<App />, '/stories/rice-blast')

  const section = await responsesSection()
  await waitFor(() => expect(section.getByRole('heading', { name: 'Responses (3)' })).toBeInTheDocument())
  const items = section.getAllByRole('article')
  expect(items.map((item) => item.getAttribute('aria-label'))).toEqual(['Response by Rahim Uddin', 'Response by Salma', 'Response by Rahim Uddin'])
  expect(items[0]).toHaveTextContent('First line')
  expect(section.getByRole('button', { name: 'Sign in to respond' })).toBeInTheDocument()
  expect(section.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
})

test('comment HTML is cleaned before it is shown', async () => {
  mockApi({
    'GET /api/blogs/slug/rice-blast': () => envelope(200, story),
    'GET /api/comments/blog/402': () => envelope(200, [comment(1, { content: '<p>Nice<img src=x onerror="window.__c=1"></p>' })]),
    'GET /api/comments/replies/1': () => envelope(200, []),
  })
  renderWithProviders(<App />, '/stories/rice-blast')

  const section = await responsesSection()
  expect(await section.findByText('Nice')).toBeInTheDocument()
  expect(document.querySelector('[onerror]')).toBeNull()
  expect((window as unknown as { __c?: number }).__c).toBeUndefined()
})

test('a visitor replying is sent to sign-in', async () => {
  mockApi({
    'GET /api/blogs/slug/rice-blast': () => envelope(200, story),
    'GET /api/comments/blog/402': () => envelope(200, [comment(1)]),
    'GET /api/comments/replies/1': () => envelope(200, []),
  })
  renderWithProviders(<App />, '/stories/rice-blast')

  const section = await responsesSection()
  await userEvent.click(await section.findByRole('button', { name: 'Reply' }))
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/sign-in?next=%2Fstories%2Frice-blast'))
})

test('responding posts the text and reloads the list', async () => {
  let list = [] as CommentResponse[]
  const api = mockApi({
    ...signedIn(),
    'GET /api/blogs/slug/rice-blast': () => envelope(200, story),
    'GET /api/comments/blog/402': () => envelope(200, list),
    'GET /api/comments/replies/5': () => envelope(200, []),
    'POST /api/comments/create': () => {
      list = [comment(5, { userId: 9, authorName: 'Karim', content: 'Spray early.' })]
      return envelope(200, list[0])
    },
  })
  renderWithProviders(<App />, '/stories/rice-blast')

  const section = await responsesSection()
  await userEvent.click(section.getByRole('button', { name: 'Respond' }))
  expect(section.getByLabelText('Your response')).toHaveAccessibleDescription('Write something first.')

  await userEvent.type(section.getByLabelText('Your response'), '  Spray early.  ')
  await userEvent.click(section.getByRole('button', { name: 'Respond' }))

  expect(await section.findByText('Spray early.')).toBeInTheDocument()
  expect(bodyOf(api, 'POST', '/api/comments/create')).toEqual({ blogId: 402, content: 'Spray early.' })
  expect(section.getByLabelText('Your response')).toHaveValue('')
  expect(section.getByText('Response posted')).toBeInTheDocument()
})

test('replying posts under the parent', async () => {
  const api = mockApi({
    ...signedIn(),
    'GET /api/blogs/slug/rice-blast': () => envelope(200, story),
    'GET /api/comments/blog/402': () => envelope(200, [comment(1)]),
    'GET /api/comments/replies/1': () => envelope(200, []),
    'POST /api/comments/reply': () => envelope(200, comment(6, { parentCommentId: 1 })),
  })
  renderWithProviders(<App />, '/stories/rice-blast')

  const section = await responsesSection()
  await userEvent.click(await section.findByRole('button', { name: 'Reply' }))
  const field = section.getByLabelText('Reply to Rahim Uddin')
  expect(field).toHaveFocus()
  await userEvent.type(field, 'Thanks!')
  await userEvent.click(section.getByRole('button', { name: 'Reply' }))

  await waitFor(() => expect(bodyOf(api, 'POST', '/api/comments/reply')).toEqual({ blogId: 402, parentCommentId: 1, content: 'Thanks!' }))
  await waitFor(() => expect(section.queryByLabelText('Reply to Rahim Uddin')).not.toBeInTheDocument())
})

test('owners edit and delete their own responses', async () => {
  let content = 'Old text'
  let gone = false
  const api = mockApi({
    ...signedIn(),
    'GET /api/blogs/slug/rice-blast': () => envelope(200, story),
    'GET /api/comments/blog/402': () =>
      envelope(200, gone ? [comment(2)] : [comment(1, { userId: 9, authorName: 'Karim', content }), comment(2)]),
    'GET /api/comments/replies/1': () => envelope(200, []),
    'GET /api/comments/replies/2': () => envelope(200, []),
    'PUT /api/comments/update': () => {
      content = 'New text'
      return envelope(200, null)
    },
    'DELETE /api/comments/id/1': () => {
      gone = true
      return envelope(200, null)
    },
  })
  renderWithProviders(<App />, '/stories/rice-blast')

  const section = await responsesSection()
  const mine = await section.findByRole('article', { name: 'Response by Karim' })
  expect(within(section.getByRole('article', { name: 'Response by Rahim Uddin' })).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()

  await userEvent.click(within(mine).getByRole('button', { name: 'Edit' }))
  const field = within(mine).getByLabelText('Edit your response')
  expect(field).toHaveValue('Old text')
  await userEvent.clear(field)
  await userEvent.type(field, 'New text')
  await userEvent.click(within(mine).getByRole('button', { name: 'Save' }))
  expect(await within(mine).findByText('New text')).toBeInTheDocument()
  expect(bodyOf(api, 'PUT', '/api/comments/update')).toEqual({ commentId: 1, blogId: 402, content: 'New text' })

  await userEvent.click(within(mine).getByRole('button', { name: 'Delete' }))
  expect(within(mine).getByText('Delete this response?')).toBeInTheDocument()
  await userEvent.click(within(mine).getByRole('button', { name: 'Delete' }))
  await waitFor(() => expect(section.queryByRole('article', { name: 'Response by Karim' })).not.toBeInTheDocument())
})
