import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Page, StorySummary } from './types'

export interface ClapState {
  totalClaps: number
  myClaps: number
}

/** A reader can clap one story at most this many times (backend ClapService). */
export const MAX_CLAPS = 50

export const reactionKeys = {
  claps: (blogId: number) => ['claps', blogId] as const,
  bookmarkIds: ['bookmarks', 'ids'] as const,
  bookmarks: ['bookmarks'] as const,
}

/** Total claps and the reader's own; signed-in only. */
export function useClaps(blogId: number, enabled: boolean) {
  return useQuery({
    queryKey: reactionKeys.claps(blogId),
    queryFn: ({ signal }) => api<ClapState>(`/api/blogs/id/${blogId}/claps`, { signal }),
    enabled,
  })
}

/** Adds `count` claps in one request; the reply is the new state. */
export function useClap(blogId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (count: number) => api<ClapState>(`/api/blogs/id/${blogId}/claps`, { method: 'POST', params: { count } }),
    onSuccess: (state) => queryClient.setQueryData(reactionKeys.claps(blogId), state),
  })
}

/** All saved IDs, including older results, are shared by the story controls. */
export function useBookmarkedIds(enabled: boolean) {
  return useQuery({
    queryKey: reactionKeys.bookmarkIds,
    queryFn: async ({ signal }) => {
      const ids = new Set<number>()
      let pageNo = 0
      for (;;) {
        const saved = await api<Page<StorySummary>>('/api/bookmarks', { params: { pageNo, pageSize: 100 }, signal })
        for (const story of saved.content) if (story.id != null) ids.add(story.id)
        if (saved.last !== false) return ids
        pageNo += 1
      }
    },
    enabled,
    staleTime: 5 * 60_000,
  })
}

/** Save or unsave a story; the saved set updates at once and rolls back if the request fails. */
export function useToggleBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ blogId, save }: { blogId: number; save: boolean }) =>
      api<null>(`/api/blogs/id/${blogId}/bookmark`, { method: save ? 'PUT' : 'DELETE' }),
    onMutate: async ({ blogId, save }) => {
      await queryClient.cancelQueries({ queryKey: reactionKeys.bookmarkIds })
      const before = queryClient.getQueryData<Set<number | undefined>>(reactionKeys.bookmarkIds)
      const next = new Set(before)
      if (save) next.add(blogId)
      else next.delete(blogId)
      queryClient.setQueryData(reactionKeys.bookmarkIds, next)
      return { before }
    },
    onError: (_error, { blogId }, context) => {
      queryClient.setQueryData<Set<number | undefined>>(reactionKeys.bookmarkIds, (current) => {
        const next = new Set(current)
        if (context?.before?.has(blogId)) next.add(blogId)
        else next.delete(blogId)
        return next
      })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: reactionKeys.bookmarks, refetchType: 'none' }),
  })
}
