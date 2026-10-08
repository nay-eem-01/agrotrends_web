import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import { ApiError } from './errors'
import { FEED_PAGE_SIZE } from './feed'
import type { AuthorProfileResponse, BlogResponse, Page, Schemas } from './types'

export type UpdateAuthorProfileRequest = Schemas['UpdateAuthorProfileRequest']

export const authorKeys = {
  me: ['authors', 'me'] as const,
  profile: (authorId: number) => ['authors', authorId] as const,
  stories: (authorId: number) => ['authors', authorId, 'stories'] as const,
}

/** An author's public profile; `followedByMe` is false for visitors. */
export function useAuthor(authorId: number, enabled = true) {
  return useQuery({
    queryKey: authorKeys.profile(authorId),
    queryFn: ({ signal }) => api<AuthorProfileResponse>(`/api/authors/${authorId}`, { signal }),
    enabled: enabled && Number.isFinite(authorId),
    retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 1,
  })
}

/** An author's published stories, newest first. Public. */
export function useAuthorStories(authorId: number) {
  return useInfiniteQuery({
    queryKey: authorKeys.stories(authorId),
    queryFn: ({ pageParam, signal }) =>
      api<Page<BlogResponse>>(`/api/blogs/all/author/${authorId}`, {
        params: { pageNo: pageParam, pageSize: FEED_PAGE_SIZE, sortBy: 'creationDate', ascOrDesc: 'desc' },
        signal,
      }),
    initialPageParam: 0,
    getNextPageParam: (page) => (page.last ? undefined : page.number + 1),
    enabled: Number.isFinite(authorId),
  })
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
