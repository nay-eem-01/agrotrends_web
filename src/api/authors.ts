import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { AuthorProfileResponse, Schemas } from './types'

export type UpdateAuthorProfileRequest = Schemas['UpdateAuthorProfileRequest']

export const authorKeys = {
  me: ['authors', 'me'] as const,
}

/** The signed-in author's own profile (403 for readers, so only enable it for authors). */
export function useMyAuthorProfile(enabled: boolean) {
  return useQuery({
    queryKey: authorKeys.me,
    queryFn: ({ signal }) => api<AuthorProfileResponse>('/api/authors/me', { signal }),
    enabled,
  })
}

export function useUpdateMyAuthorProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdateAuthorProfileRequest) =>
      api<AuthorProfileResponse>('/api/authors/me', { method: 'PUT', body: request }),
    onSuccess: (profile) => {
      queryClient.setQueryData(authorKeys.me, profile)
      // The public author page shows the same profile.
      if (profile.authorId != null) void queryClient.invalidateQueries({ queryKey: ['authors', profile.authorId] })
    },
  })
}
