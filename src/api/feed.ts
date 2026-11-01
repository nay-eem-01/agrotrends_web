import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { api } from './client'
import type { Question } from './questions'
import type { Page, StorySummary } from './types'

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
      api<Page<StorySummary>>(`/api/feed/${kind}`, { params: { pageNo: pageParam, pageSize: FEED_PAGE_SIZE }, signal }),
    initialPageParam: 0,
    getNextPageParam: (page) => (page.last ? undefined : page.number + 1),
    enabled,
  })
}

/** The week's most-voted questions (last 14 days, hidden ones left out): public, one short list for the home rail. */
export function useTrendingQuestions(size = 5) {
  return useQuery({
    queryKey: ['feed', 'trending-questions', size],
    queryFn: ({ signal }) => api<Page<Question>>('/api/feed/trending/questions', { params: { pageNo: 0, pageSize: size }, signal }),
    staleTime: 5 * 60_000,
  })
}
