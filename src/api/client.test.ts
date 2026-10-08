import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { api, clearSession, getAccessToken, hasStoredSession, queryString, restoreSession, setSessionLostHandler, startSession, tokenExpiry } from './client'
import { ApiError, NETWORK_ERROR_MESSAGE, SERVER_ERROR_MESSAGE } from './errors'

function envelope(status: number, payload: unknown, message = 'OK', success = status < 400) {
  return new Response(JSON.stringify({ status: String(status), message, payload, success }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  localStorage.clear()
  clearSession()
  setSessionLostHandler(() => {})
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

function authHeader(call: number): string | undefined {
  const init = fetchMock.mock.calls[call][1] as RequestInit
  return (init.headers as Record<string, string>).Authorization
}

test('returns the payload and sends the access token', async () => {
  startSession({ accessToken: 'a1', refreshToken: 'r1' })
  fetchMock.mockResolvedValueOnce(envelope(200, { id: 7 }))

  await expect(api('/api/user/me')).resolves.toEqual({ id: 7 })
  expect(authHeader(0)).toBe('Bearer a1')
})

test('sends JSON bodies and drops empty query values', async () => {
  fetchMock.mockResolvedValueOnce(envelope(200, null))
  await api('/api/blogs/all', { method: 'POST', body: { title: 'x' }, params: { pageNo: 0, crop: '', season: undefined } })

  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('/api/blogs/all?pageNo=0')
  expect((init as RequestInit).body).toBe('{"title":"x"}')
  expect(queryString({ q: 'boro rice' })).toBe('?q=boro+rice')
})

test('a 4xx throws the envelope message', async () => {
  fetchMock.mockResolvedValueOnce(envelope(400, null, "Invalid value for 'season'."))
  await expect(api('/api/blogs/all')).rejects.toMatchObject({ status: 400, message: "Invalid value for 'season'." })
})

test('a 500 hides the detail but keeps the errorId', async () => {
  fetchMock.mockResolvedValueOnce(envelope(500, { errorId: 'abc' }, 'NullPointerException at ...'))
  await expect(api('/api/blogs/all')).rejects.toMatchObject({ status: 500, message: SERVER_ERROR_MESSAGE, errorId: 'abc' })
})

test('a network failure is a friendly ApiError', async () => {
  fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
  await expect(api('/api/blogs/all')).rejects.toEqual(new ApiError(0, NETWORK_ERROR_MESSAGE))
})

test('a 401 refreshes once, rotates the tokens and retries', async () => {
  startSession({ accessToken: 'old', refreshToken: 'r1' })
  fetchMock
    .mockResolvedValueOnce(envelope(401, null, 'Token expired'))
    .mockResolvedValueOnce(envelope(200, { accessToken: 'new', refreshToken: 'r2' }))
    .mockResolvedValueOnce(envelope(200, 'done'))

  await expect(api('/api/bookmarks')).resolves.toBe('done')
  expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/refresh-token')
  expect((fetchMock.mock.calls[1][1] as RequestInit).body).toBe('{"refreshToken":"r1"}')
  expect(authHeader(1)).toBeUndefined()
  expect(authHeader(2)).toBe('Bearer new')
  expect(localStorage.getItem('agrotrends.refreshToken')).toBe('r2')
})

test('concurrent 401s share a single refresh', async () => {
  startSession({ accessToken: 'old', refreshToken: 'r1' })
  fetchMock.mockImplementation(async (input, init) => {
    const url = String(input)
    if (url === '/api/auth/refresh-token') return envelope(200, { accessToken: 'new', refreshToken: 'r2' })
    const auth = ((init?.headers ?? {}) as Record<string, string>).Authorization
    return auth === 'Bearer new' ? envelope(200, url) : envelope(401, null)
  })

  await expect(Promise.all([api('/a'), api('/b'), api('/c')])).resolves.toEqual(['/a', '/b', '/c'])
  expect(fetchMock.mock.calls.filter(([url]) => url === '/api/auth/refresh-token')).toHaveLength(1)
})

test('a rejected refresh ends the session', async () => {
  const lost = vi.fn()
  setSessionLostHandler(lost)
  startSession({ accessToken: 'old', refreshToken: 'r1' })
  fetchMock
    .mockResolvedValueOnce(envelope(401, null))
    .mockResolvedValueOnce(envelope(401, null, 'Refresh token has expired. Please sign in again.'))

  await expect(api('/api/bookmarks')).rejects.toMatchObject({ status: 401 })
  expect(lost).toHaveBeenCalledOnce()
  expect(getAccessToken()).toBeNull()
  expect(hasStoredSession()).toBe(false)
})

test('an unreachable server during refresh keeps the stored session', async () => {
  startSession({ accessToken: 'old', refreshToken: 'r1' })
  fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

  await expect(restoreSession()).resolves.toBeNull()
  expect(hasStoredSession()).toBe(true)
})

test('auth paths never trigger a refresh', async () => {
  startSession({ accessToken: 'a', refreshToken: 'r1' })
  fetchMock.mockResolvedValueOnce(envelope(401, null, 'Invalid email or password.'))

  await expect(api('/api/auth/sign-in', { method: 'POST', body: {} })).rejects.toMatchObject({ message: 'Invalid email or password.' })
  expect(fetchMock).toHaveBeenCalledOnce()
})

test('restoring without a stored token does nothing', async () => {
  await expect(restoreSession()).resolves.toBeNull()
  expect(fetchMock).not.toHaveBeenCalled()
})

/** A JWT-shaped token whose `exp` is `secondsFromNow` away (the signature is never checked on the client). */
function jwt(secondsFromNow: number): string {
  const payload = btoa(JSON.stringify({ sub: 'a@b.c', exp: Math.floor(Date.now() / 1000) + secondsFromNow }))
  return `e30.${payload.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')}.sig`
}

test('reads the expiry from a JWT and ignores anything else', () => {
  const token = jwt(900)
  expect(tokenExpiry(token)).toBeGreaterThan(Date.now() + 890_000)
  expect(tokenExpiry('not-a-jwt')).toBeNull()
  expect(tokenExpiry('a.%%%.c')).toBeNull()
})

test('refreshes before a request when the access token is about to expire', async () => {
  const fresh = jwt(900)
  startSession({ accessToken: jwt(30), refreshToken: 'r1' })
  fetchMock
    .mockResolvedValueOnce(envelope(200, { accessToken: fresh, refreshToken: 'r2' }))
    .mockResolvedValueOnce(envelope(200, { followedByMe: true }))

  await expect(api('/api/authors/3')).resolves.toEqual({ followedByMe: true })
  expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/refresh-token')
  expect(authHeader(1)).toBe(`Bearer ${fresh}`)
})

test('a token with time left is used as it is', async () => {
  const token = jwt(600)
  startSession({ accessToken: token, refreshToken: 'r1' })
  fetchMock.mockResolvedValueOnce(envelope(200, 'ok'))

  await api('/api/authors/3')
  expect(fetchMock).toHaveBeenCalledOnce()
  expect(authHeader(0)).toBe(`Bearer ${token}`)
})

test('a failed early refresh still sends the request', async () => {
  startSession({ accessToken: jwt(10), refreshToken: 'r1' })
  fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(envelope(200, 'ok'))

  await expect(api('/api/blogs/all')).resolves.toBe('ok')
  expect(fetchMock).toHaveBeenCalledTimes(2)
})
