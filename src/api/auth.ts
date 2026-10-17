import { useMutation } from '@tanstack/react-query'
import { api } from './client'
import { ApiError } from './errors'
import { joinPhone } from '../lib/auth'
import type { Schemas, UserResponse, WebTokenResponse } from './types'

export type SignInRequest = Schemas['SignInRequest']
export type SignUpRequest = Schemas['SignUpRequest']

export function signIn(request: SignInRequest): Promise<WebTokenResponse> {
  return api<WebTokenResponse>('/api/auth/sign-in', { method: 'POST', body: request })
}

/** Creates the account; the backend returns the user but no tokens, so a sign-in follows. */
export function signUp(request: SignUpRequest): Promise<UserResponse> {
  return api<UserResponse>('/api/auth/sign-up', { method: 'POST', body: request })
}

/** Ends this session on the server and revokes every refresh token of the caller. */
export function signOut(): Promise<null> {
  return api<null>('/api/auth/sign-out')
}

export const SIGNED_UP_BUT_NOT_IN = "Your account is ready, but we couldn't sign you in. Please sign in."

export function useSignIn() {
  return useMutation({ mutationFn: signIn })
}

/** Google's ID token for our tokens; the backend creates the account on first use and counts the e-mail as confirmed. */
export function useGoogleSignIn() {
  return useMutation({ mutationFn: (idToken: string) => api<WebTokenResponse>('/api/auth/google', { method: 'POST', body: { idToken } }) })
}

/** Sign up (an e-mail, a phone number or both), then sign in with whichever was given and the same password. */
export function useSignUp() {
  return useMutation({
    mutationFn: async (request: SignUpRequest) => {
      await signUp(request)
      try {
        return await signIn({ identifier: request.email || joinPhone(request.countryCode ?? '', request.mobileNumber ?? ''), password: request.password })
      } catch (error) {
        // The account exists now; trying the form again would only say the e-mail is taken.
        const status = error instanceof ApiError ? error.status : 0
        throw new ApiError(status, SIGNED_UP_BUT_NOT_IN)
      }
    },
  })
}

/** Confirms the e-mail address with the token from the link the backend mailed; 400 when invalid or expired. */
export function verifyEmail(token: string): Promise<null> {
  return api<null>('/api/auth/verify-email', { method: 'POST', body: { token } })
}

/** Always 200, so accounts can't be discovered; at most three links an hour per address. */
export function useResendVerification() {
  return useMutation({ mutationFn: (email: string) => api<null>('/api/auth/resend-verification', { method: 'POST', body: { email } }) })
}

export function fetchMe(): Promise<UserResponse> {
  return api<UserResponse>('/api/user/me')
}

/** Always succeeds for a well-formed e-mail, so accounts can't be discovered; the e-mail holds the reset link. */
export function forgotPassword(email: string): Promise<null> {
  return api<null>('/api/auth/forgot-password', { method: 'POST', body: { email } })
}

/** Sets a new password with the token from the reset link; the token is single-use. */
export function resetPassword(request: Schemas['ResetPasswordWithTokenRequest']): Promise<null> {
  return api<null>('/api/auth/reset-password', { method: 'POST', body: request })
}

export function useForgotPassword() {
  return useMutation({ mutationFn: forgotPassword })
}

export function useResetPassword() {
  return useMutation({ mutationFn: resetPassword })
}

/** Admins sign in on their own endpoint; the regular one refuses them (and this one refuses everyone else). */
export function useAdminSignIn() {
  return useMutation({ mutationFn: (request: SignInRequest) => api<WebTokenResponse>('/api/admin/sign-in', { method: 'POST', body: request }) })
}

/** Any role besides USER is staff; the backend checks the exact permission on each call. */
export function isAdmin(user: { roles?: string[] } | null | undefined): boolean {
  return (user?.roles ?? []).some((role) => role !== 'USER')
}

export type PhoneRequest = Schemas['PhoneRequest']

/** Confirms the phone number with the 6-digit SMS code; 400 when the code is wrong, used or expired. */
export function useVerifyPhone() {
  return useMutation({ mutationFn: (request: Schemas['VerifyPhoneRequest']) => api<null>('/api/auth/verify-phone', { method: 'POST', body: request }) })
}

/** Always 200, so numbers can't be discovered; at most three codes an hour per number. */
export function useResendPhoneCode() {
  return useMutation({ mutationFn: (request: PhoneRequest) => api<null>('/api/auth/resend-phone-code', { method: 'POST', body: request }) })
}
