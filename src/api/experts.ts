import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Page, Schemas } from './types'

export type ExpertApplication = Schemas['ExpertApplicationResponse']
export type ExpertApplicationRequest = Schemas['ExpertApplicationRequest']
export type CredentialType = ExpertApplicationRequest['credentialType']

/** The backend's limits (ExpertApplicationRequest). */
export const EXPERT_LIMITS = { topics: 3, field: 150, institution: 150, images: 4, links: 3 } as const

export const CREDENTIAL_LABELS: Record<CredentialType, string> = {
  DEGREE: 'Degree certificate',
  STAFF_ID: 'Staff ID card',
  FACULTY_PAGE: 'Faculty or staff web page',
  LICENCE: 'Professional licence',
  OTHER: 'Something else',
}

export const expertKeys = { mine: ['experts', 'mine'] as const }

/** The caller's applications, newest first; the first is the one that matters. */
export function useMyApplications(enabled = true) {
  return useQuery({
    queryKey: expertKeys.mine,
    queryFn: ({ signal }) => api<Page<ExpertApplication>>('/api/experts/applications/me', { params: { pageNo: 0, pageSize: 5 }, signal }),
    enabled,
  })
}

/** Apply to be a Verified Expert in 1–3 topics. 409 while an earlier application is still pending. */
export function useApplyAsExpert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: ExpertApplicationRequest) => api<ExpertApplication>('/api/experts/applications', { method: 'POST', body: request }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: expertKeys.mine }),
  })
}

/** Links must be http(s); anything else is refused before sending. */
export function isWebLink(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export type ApplicationStatus = NonNullable<ExpertApplication['status']>

/** Applications by status, oldest first (staff with EXPERT_REVIEW). */
export function useExpertApplications(status: ApplicationStatus) {
  return useQuery({
    queryKey: ['admin', 'expert-applications', status],
    queryFn: ({ signal }) => api<Page<ExpertApplication>>('/api/admin/expert-applications', { params: { status, pageNo: 0, pageSize: 50 }, signal }),
    retry: false,
  })
}

export type ExpertDecision =
  | { action: 'approve'; applicationId: number; categoryIds?: number[]; note?: string }
  | { action: 'reject'; applicationId: number; note: string }
  | { action: 'revoke'; userId: number; categoryId: number }

/** Approve all or some topics, reject with a reason, or revoke a badge. Settled either way, the lists reload (409: decided already). */
export function useExpertDecision() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (decision: ExpertDecision) =>
      decision.action === 'revoke'
        ? api<null>(`/api/admin/users/${decision.userId}/expert-badges/${decision.categoryId}`, { method: 'DELETE' })
        : api<ExpertApplication>(`/api/admin/expert-applications/${decision.applicationId}/${decision.action}`, {
            method: 'POST',
            body: decision.action === 'approve' ? { categoryIds: decision.categoryIds, note: decision.note || undefined } : { note: decision.note },
          }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'expert-applications'] })
      void queryClient.invalidateQueries({ queryKey: ['reputation'] })
    },
  })
}

/** The backend's limit on a decision note. */
export const MAX_DECISION_NOTE = 500
