import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AgriFilters } from '../lib/agri'
import { api } from './client'
import { ApiError } from './errors'
import { FEED_PAGE_SIZE } from './feed'
import type { BlogResponse, Page, Schemas } from './types'

export const blogKeys = {
  list: (filters: AgriFilters) => ['blogs', 'list', filters] as const,
}

/** Published stories matching the farming filters, newest first. Public. */
export function useBlogs(filters: AgriFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: blogKeys.list(filters),
    queryFn: ({ pageParam, signal }) =>
      api<Page<BlogResponse>>('/api/blogs/all', {
        params: { pageNo: pageParam, pageSize: FEED_PAGE_SIZE, sortBy: 'creationDate', ascOrDesc: 'desc', ...filters },
        signal,
      }),
    initialPageParam: 0,
    getNextPageParam: (page) => (page.last ? undefined : page.number + 1),
    enabled,
  })
}

/** A story by its URL slug: public when published; a draft only for its author (404 for anyone else). */
export function useStory(slug: string, enabled = true) {
  return useQuery({
    queryKey: ['blogs', 'slug', slug],
    queryFn: ({ signal }) => api<BlogResponse>(`/api/blogs/slug/${encodeURIComponent(slug)}`, { signal }),
    enabled,
    // A 404 won't turn up on a second try.
    retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 1,
  })
}

/** Stories matching `q` (title, body and tags, ranked by the backend). Public; disabled for a blank query. */
export function useSearch(q: string) {
  return useInfiniteQuery({
    queryKey: ['blogs', 'search', q],
    queryFn: ({ pageParam, signal }) =>
      api<Page<BlogResponse>>('/api/blogs/search', { params: { q, pageNo: pageParam, pageSize: FEED_PAGE_SIZE }, signal }),
    initialPageParam: 0,
    getNextPageParam: (page) => (page.last ? undefined : page.number + 1),
    enabled: q.trim() !== '',
  })
}

export type CreateBlogRequest = Schemas['CreateBlogRequest']
export type UpdateBlogRequest = Schemas['UpdateBlogRequest']

/** A story by id, for its author to edit (drafts are 404 for anyone else). */
export function useBlogById(blogId: number, enabled = true) {
  return useQuery({
    queryKey: ['blogs', 'id', blogId],
    queryFn: ({ signal }) => api<BlogResponse>(`/api/blogs/id/${blogId}`, { signal }),
    enabled: enabled && Number.isFinite(blogId),
    retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 1,
  })
}

/** Create (as a draft or published), update, publish, unpublish or delete one of the author's stories. */
export function useBlogWrite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (write: BlogWrite) => sendBlogWrite(write),
    onSuccess: (story, write) => {
      if (story?.id != null) queryClient.setQueryData(['blogs', 'id', story.id], story)
      // Feeds, lists, drafts and the story page may all show it; only what is on screen refetches. Autosaves skip it.
      if (write.kind !== 'update' || !write.quiet) void queryClient.invalidateQueries()
    },
  })
}

export type BlogWrite =
  | { kind: 'create'; request: CreateBlogRequest }
  | { kind: 'update'; request: UpdateBlogRequest; quiet?: boolean }
  | { kind: 'publish' | 'unpublish' | 'delete'; blogId: number }

function sendBlogWrite(write: BlogWrite): Promise<BlogResponse | null> {
  switch (write.kind) {
    case 'create':
      return api<BlogResponse>('/api/blogs/create', { method: 'POST', body: write.request })
    case 'update':
      return api<BlogResponse>('/api/blogs/update', { method: 'PUT', body: write.request })
    case 'delete':
      return api<null>(`/api/blogs/id/${write.blogId}/delete`, { method: 'DELETE' })
    default:
      return api<BlogResponse>(`/api/blogs/id/${write.blogId}/${write.kind}`, { method: 'POST' })
  }
}
