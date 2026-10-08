import { vi } from 'vitest'

/** A backend response: the `HttpResponse` envelope with `payload`. */
export function envelope(status: number, payload: unknown, message = 'OK'): Response {
  return new Response(JSON.stringify({ status: String(status), message, payload, success: status < 400 }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** A Spring `Page` of `content`. */
export function page<T>(content: T[], number = 0, last = true) {
  return { content, number, last, size: content.length, totalElements: content.length, totalPages: 1, first: number === 0, empty: content.length === 0 }
}

type Handler = (url: URL, init: RequestInit | undefined) => Response | Promise<Response>

/**
 * Stubs `fetch` with handlers keyed by "METHOD /path" (query string ignored). An unknown request fails the test.
 * Returns the mock, so calls can be inspected; `vi.unstubAllGlobals()` in afterEach removes it.
 */
export function mockApi(routes: Record<string, Handler>) {
  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(String(input), 'http://localhost')
    const key = `${init?.method ?? 'GET'} ${url.pathname}`
    const handler = routes[key]
    if (!handler) throw new Error(`Unexpected request: ${key}`)
    return handler(url, init)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
