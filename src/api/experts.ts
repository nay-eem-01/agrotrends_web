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
