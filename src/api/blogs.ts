import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import type { AgriFilters } from '../lib/agri'
import { api } from './client'
import { ApiError } from './errors'
import { FEED_PAGE_SIZE } from './feed'
import type { BlogResponse, Page } from './types'

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
