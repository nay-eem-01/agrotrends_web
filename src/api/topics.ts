import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import { FEED_PAGE_SIZE, feedKeys } from './feed'
import type { BlogResponse, Page } from './types'

export const topicKeys = {
  search: (q: string) => ['tags', 'search', q] as const,
  followed: ['tags', 'followed'] as const,
  stories: (tag: string) => ['tags', 'stories', tag] as const,
}

/** Up to 20 tag names starting with `q` (the first 20 when empty). Public. */
export function useTags(q = '') {
  return useQuery({
    queryKey: topicKeys.search(q),
    queryFn: ({ signal }) => api<string[]>('/api/tags', { params: { q }, signal }),
  })
}

/** Published stories with a tag, newest first. Public. */
export function useTagStories(tag: string) {
  return useInfiniteQuery({
    queryKey: topicKeys.stories(tag),
    queryFn: ({ pageParam, signal }) =>
      api<Page<BlogResponse>>(`/api/blogs/all/tag/${encodeURIComponent(tag)}`, {
        params: { pageNo: pageParam, pageSize: FEED_PAGE_SIZE, sortBy: 'creationDate', ascOrDesc: 'desc' },
        signal,
      }),
    initialPageParam: 0,
    getNextPageParam: (page) => (page.last ? undefined : page.number + 1),
  })
}

/** Tags the reader follows (the 100 most recent; the API has no per-tag flag). Signed-in only. */
export function useFollowedTags(enabled: boolean) {
  return useQuery({
    queryKey: topicKeys.followed,
    queryFn: async ({ signal }) => {
      const followed = await api<Page<string>>('/api/me/following/tags', { params: { pageNo: 0, pageSize: 100 }, signal })
      return followed.content
    },
    enabled,
    staleTime: 5 * 60_000,
  })
}

/** Follow or unfollow a tag; the list updates at once, rolls back on failure, and For you reloads. */
export function useToggleTagFollow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tag, follow }: { tag: string; follow: boolean }) =>
      api<null>(`/api/tags/${encodeURIComponent(tag)}/follow`, { method: follow ? 'PUT' : 'DELETE' }),
    onMutate: async ({ tag, follow }) => {
      await queryClient.cancelQueries({ queryKey: topicKeys.followed })
      const before = queryClient.getQueryData<string[]>(topicKeys.followed)
      const without = (before ?? []).filter((name) => name !== tag)
      queryClient.setQueryData(topicKeys.followed, follow ? [tag, ...without] : without)
      return { before }
    },
    onError: (_error, _vars, context) => queryClient.setQueryData(topicKeys.followed, context?.before),
    onSettled: () => queryClient.invalidateQueries({ queryKey: feedKeys.feed('following') }),
  })
}
