import { useMutation } from '@tanstack/react-query'
import { api } from './client'
import type { Schemas } from './types'

export type UpdateAccountRequest = Schemas['UpdateUserRequest']
export type ChangePasswordRequest = Schemas['ChangePasswordRequest']

/** Edits the caller's own account. A changed e-mail revokes every session (it is the token subject). */
export function updateAccount(request: UpdateAccountRequest): Promise<null> {
  return api<null>('/api/user/update', { method: 'PUT', body: request })
}

/** Changes the caller's password; the backend then signs them out everywhere. */
export function changePassword(request: ChangePasswordRequest): Promise<null> {
  return api<null>('/api/user/change-password', { method: 'POST', body: request })
}

export function useUpdateAccount() {
  return useMutation({ mutationFn: updateAccount })
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword })
}
