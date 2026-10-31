import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { api } from './client'
import { FEED_PAGE_SIZE } from './feed'
import type { Page, Schemas } from './types'

/** A user's public summary; `authorId` equals `userId`. */
export type UserProfile = Schemas['UserProfileResponse']

/** One of a user's answers, with its question's title. */
export type UserAnswer = Schemas['UserAnswerResponse']

/** The profile summary (public); if it fails the page falls back to what it has. */
export function useUserProfile(userId: number) {
  return useQuery({
    queryKey: ['users', userId, 'profile'],
    queryFn: ({ signal }) => api<UserProfile>(`/api/users/${userId}/profile`, { signal }),
    enabled: Number.isInteger(userId) && userId > 0,
    retry: false,
  })
}

/** A user's answers, newest first; the Answers tab stays hidden if this fails. */
export function useUserAnswers(userId: number) {
  return useInfiniteQuery({
    queryKey: ['users', userId, 'answers'],
    queryFn: ({ pageParam, signal }) =>
      api<Page<UserAnswer>>(`/api/answers/all/user/${userId}`, { params: { pageNo: pageParam, pageSize: FEED_PAGE_SIZE }, signal }),
    initialPageParam: 0,
    // Guarded: an older backend may answer with no page at all.
    getNextPageParam: (page) => (page && page.last === false ? page.number + 1 : undefined),
    enabled: Number.isInteger(userId) && userId > 0,
    retry: false,
  })
}
