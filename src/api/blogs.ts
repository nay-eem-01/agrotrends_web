import { useInfiniteQuery } from '@tanstack/react-query'
import type { AgriFilters } from '../lib/agri'
import { api } from './client'
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
