import { getLang } from '../lib/i18n'
import { ApiError, NETWORK_ERROR_MESSAGE, SERVER_ERROR_MESSAGE } from './errors'
import type { WebTokenResponse } from './types'

/** The envelope around every response body (backend `HttpResponse`). */
interface Envelope<T> {
  status: string
  message: string
  payload: T | null
  success: boolean
}

/** Empty in development (the Vite proxy forwards `/api`); set VITE_API_BASE_URL only for a split deploy. */
const BASE_URL: string = import.meta.env?.VITE_API_BASE_URL ?? ''

const REFRESH_TOKEN_KEY = 'agrotrends.refreshToken'
const REFRESH_PATH = '/api/auth/refresh-token'

/**
 * Refresh this long before the access token's `exp`. Public reads accept an expired token as an anonymous visitor
 * (no 401), so waiting for a 401 would quietly show "followed by me" and similar as false.
 */
const REFRESH_AHEAD_MS = 60_000

/**
 * The access token lives in memory only. The refresh token has to survive a reload, and the backend returns it in
 * the JSON body (not an HttpOnly cookie), so it is kept in localStorage until the backend changes that.
 */
let accessToken: string | null = null
let accessTokenExpiresAt: number | null = null
let refreshing: Promise<WebTokenResponse> | null = null
let onSessionLost: () => void = () => {}

export function getAccessToken(): string | null {
  return accessToken
}

export function hasStoredSession(): boolean {
  return readRefreshToken() !== null
}

/** Store the tokens from sign-in, sign-up or a refresh. */
export function startSession(tokens: Pick<WebTokenResponse, 'accessToken' | 'refreshToken'>): void {
  accessToken = tokens.accessToken ?? null
  accessTokenExpiresAt = accessToken ? tokenExpiry(accessToken) : null
  writeRefreshToken(tokens.refreshToken ?? null)
}

export function clearSession(): void {
  accessToken = null
  accessTokenExpiresAt = null
  writeRefreshToken(null)
}

/** Called when the session can't be refreshed any more (expired, revoked, signed out elsewhere). */
export function setSessionLostHandler(handler: () => void): void {
  onSessionLost = handler
}

type QueryValue = string | number | boolean | null | undefined

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  /** Query string values; null and undefined are left out. */
  params?: Record<string, QueryValue>
  signal?: AbortSignal
}

/**
 * Calls the API and returns the envelope's payload; throws {@link ApiError} for anything else.
 * A 401 on a non-auth path triggers one refresh (shared by concurrent callers) and one retry.
 * A `FormData` body is sent as multipart; anything else as JSON.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!path.startsWith('/api/auth/') && isAccessTokenExpiring()) {
    // Best effort: if it fails the request still goes out and the 401 path (or an anonymous read) takes over.
    await refreshSession().catch(() => undefined)
  }
  const first = await send(path, options)
  if (first.status === 401 && accessToken !== null && !path.startsWith('/api/auth/')) {
    try {
      await refreshSession()
    } catch {
      return parse<T>(first)
    }
    return parse<T>(await send(path, options))
  }
  return parse<T>(first)
}

/** Get a new access token with the stored refresh token. Concurrent callers share one request. */
export function refreshSession(): Promise<WebTokenResponse> {
  if (!refreshing) {
    refreshing = doRefresh().finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

/** On app start: turn a stored refresh token into a session, or resolve null when there is none. */
export async function restoreSession(): Promise<WebTokenResponse | null> {
  if (!hasStoredSession()) return null
  try {
    return await refreshSession()
  } catch {
    return null
  }
}

function isAccessTokenExpiring(now = Date.now()): boolean {
  return accessToken !== null && accessTokenExpiresAt !== null && accessTokenExpiresAt - now <= REFRESH_AHEAD_MS
}

/** The JWT's `exp` in milliseconds, or null when the token can't be read (then only a 401 triggers a refresh). */
export function tokenExpiry(token: string): number | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    const exp = (JSON.parse(json) as { exp?: unknown }).exp
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

async function doRefresh(): Promise<WebTokenResponse> {
  const refreshToken = readRefreshToken()
  if (!refreshToken) throw new ApiError(401, 'Please sign in again.')
  // A network failure throws before the try: the stored token is kept so a later attempt can still succeed.
  const response = await send(REFRESH_PATH, { method: 'POST', body: { refreshToken } }, false)
  try {
    const tokens = await parse<WebTokenResponse>(response)
    startSession(tokens)
    return tokens
  } catch (error) {
    // Expired, revoked or reused refresh token: the session is over. A 5xx leaves it for another try.
    if (error instanceof ApiError && error.status < 500) {
      clearSession()
      onSessionLost()
    }
    throw error
  }
}

async function send(path: string, options: RequestOptions, withToken = true): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  let body: BodyInit | undefined
  if (options.body instanceof FormData) {
    body = options.body
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }
  if (withToken && accessToken) headers.Authorization = `Bearer ${accessToken}`

  try {
    // The backend's messages follow the reader's language; English is its default, so only Bengali is sent.
    const params = getLang() === 'bn' ? { ...options.params, lang: 'bn' } : options.params
    return await fetch(BASE_URL + path + queryString(params), {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, NETWORK_ERROR_MESSAGE)
  }
}

export function queryString(params?: Record<string, QueryValue>): string {
  if (!params) return ''
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.append(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

async function parse<T>(response: Response): Promise<T> {
  let envelope: Envelope<T> | null = null
  try {
    envelope = (await response.json()) as Envelope<T>
  } catch {
    envelope = null
  }

  if (response.ok && envelope?.success !== false) {
    return (envelope?.payload ?? null) as T
  }

  // A 503 is a known, temporary state (the AI service is down) whose message is written for people; keep it.
  if (response.status >= 500 && response.status !== 503) {
    const errorId = (envelope?.payload as { errorId?: string } | null)?.errorId ?? null
    throw new ApiError(response.status, SERVER_ERROR_MESSAGE, errorId)
  }
  throw new ApiError(response.status, envelope?.message || SERVER_ERROR_MESSAGE)
}

function readRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

function writeRefreshToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token)
    else localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    // Storage blocked (private mode): the session lasts until reload.
  }
}
