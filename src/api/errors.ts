import { getLang, translate } from '../lib/i18n'
/**
 * A failed API call. `message` is the backend's envelope message, which is written to be shown to the user;
 * `errorId` is set on a 500 so a bug report can be matched to a server log line.
 */
export class ApiError extends Error {
  readonly status: number
  readonly errorId: string | null

  constructor(status: number, message: string, errorId: string | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errorId = errorId
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  get isNotFound(): boolean {
    return this.status === 404
  }
}

export const NETWORK_ERROR_MESSAGE = "Can't reach AgroTrends right now. Check your connection and try again."
export const SERVER_ERROR_MESSAGE = 'Something went wrong on our side. Please try again.'

/** A message to show for anything thrown by a query or mutation; the app's own messages follow the language. */
export function errorMessage(error: unknown): string {
  const message = error instanceof ApiError ? error.message : SERVER_ERROR_MESSAGE
  return translate(getLang(), message)
}
