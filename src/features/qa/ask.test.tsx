import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { chooseOption, pickOption, renderWithProviders } from '../../test/render'

function signedInAs(user: object) {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return { 'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user }) }
}

const question = {
  questionId: 5,
  userId: 9,
  title: 'Yellow seedlings',
  content: '<p>After the cold.</p><p>Week two.</p>',
  authorName: 'Karim',
  category: { id: 1, categoryName: 'Crops' },
  agri: { crop: 'boro rice', season: 'RABI' },
}
const categories = { 'GET /api/categories/all': () => envelope(200, page([{ id: 1, categoryName: 'Crops' }, { id: 2, categoryName: 'Fisheries' }])) }

function body(api: ReturnType<typeof mockApi>, path: string) {
  return JSON.parse(api.mock.calls.find(([url]) => url === path)![1]!.body as string)
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('asking needs sign-in', async () => {
  mockApi({})
  renderWithProviders(<App />, '/questions/ask')
  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/sign-in?next=%2Fquestions%2Fask'))
})

test('a question is checked, posted with its farming details and opened', async () => {
  const api = mockApi({
    ...signedInAs({ id: 9, name: 'Karim' }),
    ...categories,
    'POST /api/questions/create': () => envelope(200, { ...question, questionId: 12 }),
    'GET /api/questions/id/12': () => envelope(200, { ...question, questionId: 12 }),
    'GET /api/answers/question/12': () => envelope(200, []),
  })
  renderWithProviders(<App />, '/questions/ask')

  await userEvent.click(await screen.findByRole('button', { name: 'Post question' }))
  expect(screen.getByLabelText('Your question')).toHaveAccessibleDescription('Write your question in a line.')
  expect(screen.getByLabelText('Details')).toHaveAccessibleDescription('Add what you have seen and tried.')
  expect(screen.getByLabelText('Topic')).toHaveAccessibleDescription('Choose a topic.')

  await userEvent.type(screen.getByLabelText('Your question'), ' Why are seedlings yellow? ')
  await userEvent.type(screen.getByLabelText('Details'), 'BRRI dhan29, 30 days old.')
  await chooseOption(await screen.findByLabelText('Topic'), 'Crops')
  await pickOption(screen.getByLabelText('Season'), 'Rabi')
  await userEvent.type(screen.getByLabelText('Crop'), 'boro rice')
  await userEvent.click(screen.getByRole('button', { name: 'Post question' }))

  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/questions/12'))
  expect(body(api, '/api/questions/create')).toEqual({
    title: 'Why are seedlings yellow?',
    content: 'BRRI dhan29, 30 days old.',
    categoryId: 1,
    agri: { crop: 'boro rice', season: 'RABI' },
  })
})

test('the asker edits their question as plain text', async () => {
  const api = mockApi({
    ...signedInAs({ id: 9, name: 'Karim' }),
    ...categories,
    'GET /api/questions/id/5': () => envelope(200, question),
    'PUT /api/questions/update': () => envelope(200, question),
    'GET /api/answers/question/5': () => envelope(200, []),
  })
  renderWithProviders(<App />, '/questions/5/edit')

  expect(await screen.findByLabelText('Your question')).toHaveValue('Yellow seedlings')
  expect(screen.getByLabelText('Details')).toHaveValue('After the cold. Week two.')
  expect(screen.getByLabelText('Crop')).toHaveValue('boro rice')
  await userEvent.click(screen.getByRole('button', { name: 'Save question' }))

  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/questions/5'))
  expect(body(api, '/api/questions/update')).toMatchObject({ questionId: 5, title: 'Yellow seedlings', categoryId: 1, agri: { crop: 'boro rice', season: 'RABI' } })
})

test("someone else's question can't be edited", async () => {
  mockApi({ ...signedInAs({ id: 10, name: 'Other' }), 'GET /api/questions/id/5': () => envelope(200, question) })
  renderWithProviders(<App />, '/questions/5/edit')
  expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
})

test('a question carries tags and photos', async () => {
  const api = mockApi({
    ...signedInAs({ id: 9, name: 'Karim' }),
    ...categories,
    'GET /api/tags': () => envelope(200, []),
    'POST /api/images': () => envelope(200, { url: '/uploads/leaf.webp' }),
    'POST /api/questions/create': () => envelope(200, { ...question, questionId: 12 }),
    'GET /api/questions/id/12': () => envelope(200, { ...question, questionId: 12 }),
    'GET /api/answers/question/12': () => envelope(200, []),
  })
  renderWithProviders(<App />, '/questions/ask')

  await userEvent.type(await screen.findByLabelText('Your question'), 'Spots on leaves')
  await userEvent.type(screen.getByLabelText('Details'), 'Brown spots after rain.')
  await chooseOption(await screen.findByLabelText('Topic'), 'Crops')
  await userEvent.type(screen.getByLabelText('Tags'), 'Rice Blast{Enter}')
  await userEvent.upload(screen.getByLabelText('Add a photo', { selector: 'input' }), new File(['img'], 'leaf.webp', { type: 'image/webp' }))
  expect(await screen.findByRole('img', { name: 'Photo 1' })).toHaveAttribute('src', '/uploads/leaf.webp')
  await userEvent.click(screen.getByRole('button', { name: 'Post question' }))

  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/questions/12'))
  expect(body(api, '/api/questions/create')).toMatchObject({ categoryId: 1, tags: ['rice blast'], imageUrls: ['/uploads/leaf.webp'] })
})

test('editing keeps untouched tags and photos by leaving them out, and sends changed ones', async () => {
  const withExtras = { ...question, tags: ['rice'], imageUrls: ['/uploads/a.webp', '/uploads/b.webp'] }
  const api = mockApi({
    ...signedInAs({ id: 9, name: 'Karim' }),
    ...categories,
    'GET /api/tags': () => envelope(200, []),
    'GET /api/questions/id/5': () => envelope(200, withExtras),
    'PUT /api/questions/update': () => envelope(200, withExtras),
    'GET /api/answers/question/5': () => envelope(200, []),
  })
  renderWithProviders(<App />, '/questions/5/edit')

  await userEvent.click(await screen.findByRole('button', { name: 'Remove photo 2' }))
  await userEvent.click(screen.getByRole('button', { name: 'Save question' }))

  await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/questions/5'))
  const sent = body(api, '/api/questions/update')
  expect(sent).not.toHaveProperty('tags')
  expect(sent.imageUrls).toEqual(['/uploads/a.webp'])
})
