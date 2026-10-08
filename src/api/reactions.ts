import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { BlogResponse, Page } from './types'

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

/**
 * Which stories the reader has saved. The API has no per-story "saved by me" yet, so this reads the most recent
 * 100 saves (backend need in the roadmap); older saves show as unsaved until then.
 */
export function useBookmarkedIds(enabled: boolean) {
  return useQuery({
    queryKey: reactionKeys.bookmarkIds,
    queryFn: async ({ signal }) => {
      const saved = await api<Page<BlogResponse>>('/api/bookmarks', { params: { pageNo: 0, pageSize: 100 }, signal })
      return new Set(saved.content.map((story) => story.id))
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
    onError: (_error, _vars, context) => queryClient.setQueryData(reactionKeys.bookmarkIds, context?.before),
    onSettled: () => queryClient.invalidateQueries({ queryKey: reactionKeys.bookmarks, refetchType: 'none' }),
  })
}
