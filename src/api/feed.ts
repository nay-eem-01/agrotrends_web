import { useInfiniteQuery } from '@tanstack/react-query'
import { api } from './client'
import type { BlogResponse, Page } from './types'

export type FeedKind = 'following' | 'latest' | 'trending'

export const FEED_PAGE_SIZE = 10

export const feedKeys = {
  feed: (kind: FeedKind) => ['feed', kind] as const,
}

/** A home feed, page by page. `following` needs a signed-in reader; the others are public. */
export function useFeed(kind: FeedKind, enabled = true) {
  return useInfiniteQuery({
    queryKey: feedKeys.feed(kind),
    queryFn: ({ pageParam, signal }) =>
      api<Page<BlogResponse>>(`/api/feed/${kind}`, { params: { pageNo: pageParam, pageSize: FEED_PAGE_SIZE }, signal }),
    initialPageParam: 0,
    getNextPageParam: (page) => (page.last ? undefined : page.number + 1),
    enabled,
  })
}
