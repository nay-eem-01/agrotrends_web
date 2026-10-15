import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { envelope, mockApi, page } from '../../test/api'
import { renderWithProviders } from '../../test/render'

function staff() {
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  return {
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { id: 1, name: 'Admin', roles: ['SUPER_ADMIN'] } }),
    'GET /api/users/1/reputation': () => envelope(200, { total: 0, topics: [] }),
  }
}
const application = (overrides = {}) => ({
  id: 4,
  userId: 7,
  applicantName: 'Dr Nasrin',
  topics: [
    { id: 1, categoryName: 'Livestock' },
    { id: 2, categoryName: 'Fisheries' },
  ],
  fieldTitle: 'Veterinarian',
  credentialType: 'LICENCE',
  institution: 'DLS',
  proofImageUrls: ['/uploads/licence.webp'],
  links: ['https://dls.gov.bd/staff/nasrin'],
  status: 'PENDING',
  createdAt: '2026-10-14T06:00:00Z',
  ...overrides,
})

function body(api: ReturnType<typeof mockApi>, path: string) {
  return JSON.parse(api.mock.calls.find(([url]) => url === path)![1]!.body as string)
}

beforeEach(() => {
  localStorage.clear()
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

test('a waiting application shows its proof, and approving every topic sends no topic list', async () => {
  const api = mockApi({
    ...staff(),
    'GET /api/admin/expert-applications': () => envelope(200, page([application()])),
    'POST /api/admin/expert-applications/4/approve': () => envelope(200, application({ status: 'APPROVED' })),
  })
  renderWithProviders(<App />, '/admin/experts')

  const card = await screen.findByRole('article', { name: 'Application from Dr Nasrin' })
  expect(within(card).getByRole('img', { name: 'Proof 1' }).closest('a')).toHaveAttribute('target', '_blank')
  expect(within(card).getByRole('link', { name: /dls\.gov\.bd/ })).toHaveAttribute('rel', 'noopener noreferrer')
  await userEvent.click(within(card).getByRole('button', { name: 'Approve' }))
  await waitFor(() => expect(api.mock.calls.some(([url]) => url === '/api/admin/expert-applications/4/approve')).toBe(true))
  expect(body(api, '/api/admin/expert-applications/4/approve')).toEqual({})
})

test('approving some topics sends them with the note', async () => {
  const api = mockApi({
    ...staff(),
    'GET /api/admin/expert-applications': () => envelope(200, page([application()])),
    'POST /api/admin/expert-applications/4/approve': () => envelope(200, application({ status: 'APPROVED' })),
  })
  renderWithProviders(<App />, '/admin/experts')

  const card = await screen.findByRole('article', { name: 'Application from Dr Nasrin' })
  await userEvent.click(within(card).getByRole('checkbox', { name: 'Fisheries' }))
  await userEvent.type(within(card).getByLabelText('Note to the applicant'), 'Fisheries needs more proof.')
  await userEvent.click(within(card).getByRole('button', { name: 'Approve' }))
  await waitFor(() => expect(api.mock.calls.some(([url]) => url === '/api/admin/expert-applications/4/approve')).toBe(true))
  expect(body(api, '/api/admin/expert-applications/4/approve')).toEqual({ categoryIds: [1], note: 'Fisheries needs more proof.' })
})

test('rejecting needs a reason; a second decision shows the backend’s message', async () => {
  mockApi({
    ...staff(),
    'GET /api/admin/expert-applications': () => envelope(200, page([application()])),
    'POST /api/admin/expert-applications/4/reject': () => envelope(409, null, 'This application has already been decided.'),
  })
  renderWithProviders(<App />, '/admin/experts')

  const card = await screen.findByRole('article', { name: 'Application from Dr Nasrin' })
  await userEvent.click(within(card).getByRole('button', { name: 'Reject' }))
  expect(within(card).getByLabelText('Note to the applicant')).toHaveAccessibleDescription('Say why, for the applicant.')
  await userEvent.type(within(card).getByLabelText('Note to the applicant'), 'Licence expired.')
  await userEvent.click(within(card).getByRole('button', { name: 'Reject' }))
  expect(await within(card).findByRole('alert')).toHaveTextContent('This application has already been decided.')
})

test('revoking a badge asks first and says AI answers reopen', async () => {
  const api = mockApi({
    ...staff(),
    'GET /api/admin/expert-applications': () => envelope(200, page([application({ status: 'APPROVED', topics: [{ id: 1, categoryName: 'Livestock' }] })])),
    'DELETE /api/admin/users/7/expert-badges/1': () => envelope(200, null),
  })
  renderWithProviders(<App />, '/admin/experts?status=APPROVED')

  await userEvent.click(await screen.findByRole('button', { name: 'Revoke Livestock' }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Revoke the Livestock badge?' })
  expect(dialog).toHaveTextContent('goes back to unchecked')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Revoke badge' }))
  await waitFor(() => expect(api.mock.calls.some(([url, init]) => url === '/api/admin/users/7/expert-badges/1' && init?.method === 'DELETE')).toBe(true))
})

test('without the privilege, the backend’s 403 is shown', async () => {
  mockApi({ ...staff(), 'GET /api/admin/expert-applications': () => envelope(403, null, 'You do not have the EXPERT_REVIEW privilege.') })
  renderWithProviders(<App />, '/admin/experts')
  expect(await screen.findByRole('alert')).toHaveTextContent('You do not have the EXPERT_REVIEW privilege.')
})
