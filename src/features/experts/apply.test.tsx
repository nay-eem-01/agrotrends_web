import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

function signedIn() {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return { 'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 9, name: 'Dr Nasrin' } }) }
}
const categories = { 'GET /api/categories/all': () => envelope(200, page([{ id: 1, categoryName: 'Livestock' }, { id: 2, categoryName: 'Fisheries' }])) }
const application = (overrides = {}) => ({
  id: 4,
  topics: [{ id: 1, categoryName: 'Livestock' }],
  fieldTitle: 'Veterinarian',
  credentialType: 'LICENCE',
  institution: 'DLS',
  status: 'PENDING',
  createdAt: '2026-10-14T06:00:00Z',
  updatedAt: '2026-10-14T06:00:00Z',
  ...overrides,
})

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('an application is checked, then sent with topics, field, credential and proof', async () => {
  let mine: object[] = []
  const api = mockApi({
    ...signedIn(),
    ...categories,
    'GET /api/experts/applications/me': () => envelope(200, page(mine)),
    'POST /api/images': () => envelope(200, { url: '/uploads/licence.webp' }),
    'POST /api/experts/applications': () => {
      mine = [application()]
      return envelope(200, mine[0])
    },
  })
  renderWithProviders(<App />, '/experts/apply')

  await userEvent.click(await screen.findByRole('button', { name: 'Send application' }))
  expect(screen.getByText('Choose at least one topic.')).toBeInTheDocument()
  expect(screen.getByLabelText('Your field')).toHaveAccessibleDescription('Say what your field is.')
  expect(screen.getByRole('alert')).toHaveTextContent('Add at least one photo or link as proof.')

  await userEvent.click(screen.getByRole('checkbox', { name: 'Livestock' }))
  await userEvent.type(screen.getByLabelText('Your field'), 'Veterinarian')
  await userEvent.type(screen.getByLabelText('Institution or workplace'), 'DLS')
  await userEvent.click(screen.getByRole('radio', { name: 'Professional licence' }))
  await userEvent.upload(screen.getByLabelText('Add a photo', { selector: 'input' }), new File(['x'], 'licence.webp', { type: 'image/webp' }))
  await screen.findByRole('img', { name: 'Photo 1' })
  await userEvent.type(screen.getByLabelText('Link 1'), 'ftp://nope')
  await userEvent.click(screen.getByRole('button', { name: 'Send application' }))
  expect(screen.getByText('Links start with http:// or https://.')).toBeInTheDocument()
  await userEvent.clear(screen.getByLabelText('Link 1'))
  await userEvent.type(screen.getByLabelText('Link 1'), 'https://dls.gov.bd/staff/nasrin')
  await userEvent.click(screen.getByRole('button', { name: 'Send application' }))

  expect(await screen.findByRole('heading', { name: 'Your application is waiting for an admin' })).toBeInTheDocument()
  const sent = api.mock.calls.find(([url]) => url === '/api/experts/applications')!
  expect(JSON.parse(sent[1]!.body as string)).toEqual({
    categoryIds: [1],
    fieldTitle: 'Veterinarian',
    credentialType: 'LICENCE',
    institution: 'DLS',
    proofImageUrls: ['/uploads/licence.webp'],
    links: ['https://dls.gov.bd/staff/nasrin'],
  })
})

test('a pending application shows its status instead of the form', async () => {
  mockApi({ ...signedIn(), ...categories, 'GET /api/experts/applications/me': () => envelope(200, page([application()])) })
  renderWithProviders(<App />, '/experts/apply')
  expect(await screen.findByRole('heading', { name: 'Your application is waiting for an admin' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Send application' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Apply again' })).not.toBeInTheDocument()
})

test('a rejected application shows the admin’s note, never who decided, and can be sent again', async () => {
  mockApi({
    ...signedIn(),
    ...categories,
    'GET /api/experts/applications/me': () => envelope(200, page([application({ status: 'REJECTED', reviewNote: 'The licence photo is unreadable.' })])),
  })
  renderWithProviders(<App />, '/experts/apply')

  const card = await screen.findByRole('region', { name: 'Expert application' })
  expect(within(card).getByText('The licence photo is unreadable.')).toBeInTheDocument()
  expect(within(card).getByRole('heading')).toHaveTextContent('Your application was not approved')
  await userEvent.click(screen.getByRole('button', { name: 'Apply again' }))
  expect(screen.getByRole('button', { name: 'Send application' })).toBeInTheDocument()
})

test('settings shows the status card, or the way to apply', async () => {
  mockApi({
    ...signedIn(),
    'GET /api/authors/me': () => envelope(200, { name: 'Dr Nasrin', specialities: [] }),
    'GET /api/experts/applications/me': () => envelope(200, page([application({ status: 'APPROVED' })])),
  })
  renderWithProviders(<App />, '/settings')
  expect(await screen.findByRole('heading', { name: 'You are a verified expert' })).toBeInTheDocument()
  await waitFor(() => expect(screen.getByRole('link', { name: 'Apply again' })).toHaveAttribute('href', '/experts/apply'))
})

test('the page says why to apply and what happens next, and the proof type is one tap', async () => {
  mockApi({ ...signedIn(), ...categories, 'GET /api/experts/applications/me': () => envelope(200, page([])) })
  renderWithProviders(<App />, '/experts/apply')

  expect(await screen.findByRole('heading', { level: 1, name: 'Become a verified expert' })).toBeInTheDocument()
  const next = screen.getByRole('heading', { name: 'What happens next' }).nextElementSibling as HTMLElement
  expect(within(next).getAllByRole('listitem').map((step) => step.textContent)).toEqual([
    '1Send your applicationAbout three minutes',
    '2An admin looks at your proofThey may approve some of your topics',
    '3Your badge appearsWe send you a notification',
  ])
  const proof = within(await screen.findByRole('group', { name: 'Your proof is a' }))
  await userEvent.click(proof.getByRole('radio', { name: 'Degree certificate' }))
  expect(proof.getByRole('radio', { name: 'Degree certificate' })).toBeChecked()
})
