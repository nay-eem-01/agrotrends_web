import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { clearSession } from '../../api/client'
import App from '../../App'
import { renderWithProviders } from '../../test/render'

function envelope(status: number, payload: unknown, message = 'OK') {
  return new Response(JSON.stringify({ status: String(status), message, payload, success: status < 400 }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const author = { id: 1, authorId: 5, name: 'Nasrin Akter', email: 'nasrin@farm.bd', mobileNumber: '+8801712345678' }
const profile = {
  authorId: 5,
  name: 'Nasrin Akter',
  designation: 'Agronomist',
  specialities: ['rice', 'soil health'],
  occupation: 'Researcher',
  workPlaceOrInstitution: 'BRRI',
  bio: 'I work on boro rice.',
  profileImageUrl: '/uploads/old.png',
}

const fetchMock = vi.fn<typeof fetch>()
let routes: Record<string, () => Response>

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  localStorage.clear()
  clearSession()
  localStorage.setItem('agrotrends.refreshToken', 'r0')
  routes = {
    'POST /api/auth/refresh-token': () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: author }),
    'GET /api/authors/me': () => envelope(200, profile),
  }
  fetchMock.mockImplementation(async (input, init) => {
    const key = `${init?.method ?? 'GET'} ${String(input)}`
    const handler = routes[key]
    if (!handler) throw new Error(`Unexpected ${key}`)
    return handler()
  })
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

function call(key: string): RequestInit | undefined {
  const found = fetchMock.mock.calls.find(([url, init]) => `${init?.method ?? 'GET'} ${String(url)}` === key)
  return found?.[1]
}

async function openProfile() {
  renderWithProviders(<App />, '/settings')
  const heading = await screen.findByRole('heading', { name: 'Author profile' })
  const section = heading.closest('section')!
  await within(section).findByLabelText('Designation')
  return within(section)
}

test('the editor starts from the saved profile', async () => {
  const profileSection = await openProfile()
  expect(profileSection.getByLabelText('Designation')).toHaveValue('Agronomist')
  expect(profileSection.getByLabelText('Specialities')).toHaveValue('rice, soil health')
  expect(profileSection.getByLabelText('Workplace or institution (optional)')).toHaveValue('BRRI')
  expect(profileSection.getByLabelText('About you (optional)')).toHaveValue('I work on boro rice.')
  expect(profileSection.getByRole('button', { name: 'Change photo' })).toBeInTheDocument()
})

test('saving sends the whole profile', async () => {
  routes['PUT /api/authors/me'] = () => envelope(200, { ...profile, bio: 'Boro and aman rice.' })
  const profileSection = await openProfile()

  await userEvent.clear(profileSection.getByLabelText('About you (optional)'))
  await userEvent.type(profileSection.getByLabelText('About you (optional)'), 'Boro and aman rice.')
  await userEvent.type(profileSection.getByLabelText('Specialities'), ', jute')
  await userEvent.click(profileSection.getByRole('button', { name: 'Save profile' }))

  expect(await profileSection.findByText('Profile saved')).toBeInTheDocument()
  expect(JSON.parse(call('PUT /api/authors/me')!.body as string)).toEqual({
    designation: 'Agronomist',
    specialities: ['rice', 'soil health', 'jute'],
    occupation: 'Researcher',
    workPlaceOrInstitution: 'BRRI',
    bio: 'Boro and aman rice.',
    profileImageUrl: '/uploads/old.png',
  })
})

test('a new photo is uploaded and saved with the profile', async () => {
  routes['POST /api/images'] = () => envelope(200, { url: '/uploads/new.webp' })
  routes['PUT /api/authors/me'] = () => envelope(200, { ...profile, profileImageUrl: '/uploads/new.webp' })
  const profileSection = await openProfile()

  const photo = new File(['img'], 'me.webp', { type: 'image/webp' })
  await userEvent.upload(profileSection.getByLabelText('Profile photo'), photo)
  await userEvent.click(profileSection.getByRole('button', { name: 'Save profile' }))

  await profileSection.findByText('Profile saved')
  const upload = call('POST /api/images')!
  expect(upload.body).toBeInstanceOf(FormData)
  expect((upload.body as FormData).get('file')).toBe(photo)
  expect(JSON.parse(call('PUT /api/authors/me')!.body as string)).toMatchObject({ profileImageUrl: '/uploads/new.webp' })
})

test('a photo of the wrong type is refused before uploading', async () => {
  const profileSection = await openProfile()
  await userEvent.upload(profileSection.getByLabelText('Profile photo'), new File(['gif'], 'me.gif', { type: 'image/gif' }), {
    applyAccept: false,
  })

  expect(profileSection.getByRole('alert')).toHaveTextContent('Choose a JPEG, PNG or WebP image.')
  expect(call('POST /api/images')).toBeUndefined()
})

test('removing the photo saves without one', async () => {
  routes['PUT /api/authors/me'] = () => envelope(200, { ...profile, profileImageUrl: undefined })
  const profileSection = await openProfile()

  await userEvent.click(profileSection.getByRole('button', { name: 'Remove photo' }))
  expect(profileSection.getByRole('button', { name: 'Add photo' })).toBeInTheDocument()
  await userEvent.click(profileSection.getByRole('button', { name: 'Save profile' }))

  await profileSection.findByText('Profile saved')
  expect(JSON.parse(call('PUT /api/authors/me')!.body as string)).not.toHaveProperty('profileImageUrl')
})

test('designation and specialities are required', async () => {
  const profileSection = await openProfile()
  await userEvent.clear(profileSection.getByLabelText('Designation'))
  await userEvent.clear(profileSection.getByLabelText('Specialities'))
  await userEvent.click(profileSection.getByRole('button', { name: 'Save profile' }))

  expect(profileSection.getByLabelText('Designation')).toHaveAccessibleDescription('Enter your designation.')
  expect(profileSection.getByLabelText('Specialities')).toHaveAccessibleDescription('Enter at least one speciality.')
  expect(call('PUT /api/authors/me')).toBeUndefined()
})

test('readers have no author profile section', async () => {
  routes['POST /api/auth/refresh-token'] = () => envelope(200, { accessToken: 'a1', refreshToken: 'r1', user: { ...author, authorId: undefined } })
  renderWithProviders(<App />, '/settings')

  await screen.findByRole('heading', { name: 'Settings' })
  expect(screen.queryByRole('heading', { name: 'Author profile' })).not.toBeInTheDocument()
  expect(call('GET /api/authors/me')).toBeUndefined()
})
