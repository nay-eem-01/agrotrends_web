import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import { feedKeys } from './feed'
import type { AuthorProfileResponse, BlogResponse, Page, Schemas } from './types'

export type AuthorSummary = Schemas['AuthorSummaryResponse']

const LIST_PAGE_SIZE = 20

export const followKeys = {
  authors: ['follows', 'authors'] as const,
  readingList: ['bookmarks', 'list'] as const,
}

/** The reader's saved stories, most recently saved first. */
export function useReadingList() {
  return useInfiniteQuery({
    queryKey: followKeys.readingList,
    queryFn: ({ pageParam, signal }) => api<Page<BlogResponse>>('/api/bookmarks', { params: { pageNo: pageParam, pageSize: 10 }, signal }),
    initialPageParam: 0,
    getNextPageParam: (page) => (page.last ? undefined : page.number + 1),
  })
}

/** Authors the reader follows, most recently followed first. */
export function useFollowedAuthors(enabled = true) {
  return useInfiniteQuery({
    queryKey: followKeys.authors,
    queryFn: ({ pageParam, signal }) =>
      api<Page<AuthorSummary>>('/api/me/following/authors', { params: { pageNo: pageParam, pageSize: LIST_PAGE_SIZE }, signal }),
    initialPageParam: 0,
    getNextPageParam: (page) => (page.last ? undefined : page.number + 1),
    enabled,
  })
}

/** Follow or unfollow an author; For you reloads afterwards. */
export function useToggleAuthorFollow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ authorId, follow }: { authorId: number; follow: boolean }) =>
      api<null>(`/api/authors/${authorId}/follow`, { method: follow ? 'PUT' : 'DELETE' }),
    // An open author profile shows the change at once and gets it back if the request fails.
    onMutate: async ({ authorId, follow }) => {
      const key = ['authors', authorId]
      await queryClient.cancelQueries({ queryKey: key, exact: true })
      const before = queryClient.getQueryData<AuthorProfileResponse>(key)
      if (before && before.followedByMe !== follow) {
        queryClient.setQueryData<AuthorProfileResponse>(key, {
          ...before,
          followedByMe: follow,
          followerCount: Math.max(0, (before.followerCount ?? 0) + (follow ? 1 : -1)),
        })
      }
      return { before }
    },
    onError: (_error, { authorId }, context) => {
      if (context?.before) queryClient.setQueryData(['authors', authorId], context.before)
    },
    onSettled: (_data, _error, { authorId }) => {
      void queryClient.invalidateQueries({ queryKey: feedKeys.feed('following') })
      // The author's public profile carries followedByMe and the follower count.
      void queryClient.invalidateQueries({ queryKey: ['authors', authorId], exact: true })
      void queryClient.invalidateQueries({ queryKey: followKeys.authors })
    },
  })
}
