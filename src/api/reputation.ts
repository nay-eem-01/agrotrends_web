import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { api } from './client'
import { FEED_PAGE_SIZE } from './feed'
import type { Question } from './questions'
import type { Page, Schemas } from './types'

export type Reputation = Schemas['ReputationResponse']
export type Badge = 'TOP_CONTRIBUTOR' | 'VERIFIED_EXPERT'

/** A user's reputation in total and by topic (highest first), with badges and expert field. Public. */
export function useReputation(userId: number) {
  return useQuery({
    queryKey: ['reputation', userId],
    queryFn: ({ signal }) => api<Reputation>(`/api/users/${userId}/reputation`, { signal }),
    enabled: Number.isFinite(userId),
  })
}

/** The questions a user asked, newest first. Public. */
export function useUserQuestions(userId: number) {
  return useInfiniteQuery({
    queryKey: ['questions', 'user', userId],
    queryFn: ({ pageParam, signal }) =>
      api<Page<Question>>(`/api/questions/all/user/${userId}`, {
        params: { pageNo: pageParam, pageSize: FEED_PAGE_SIZE, sortBy: 'creationDate', ascOrDesc: 'desc' },
        signal,
      }),
    initialPageParam: 0,
    getNextPageParam: (page) => (page.last ? undefined : page.number + 1),
    enabled: Number.isFinite(userId),
  })
}
