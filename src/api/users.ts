import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { api } from './client'
import { FEED_PAGE_SIZE } from './feed'
import type { Page, Schemas } from './types'

/** A user's public summary (docs/BACKEND_REQUESTS.md §1; not in the OpenAPI yet). */
export interface UserProfile {
  userId: number
  name?: string
  authorId?: number | null
  location?: string | null
  coverUrl?: string | null
  joinedAt?: string
  answerCount?: number
  acceptedAnswerCount?: number
  questionCount?: number
  storyCount?: number
  credentials?: { title: string; institution?: string | null; year?: number | null }[]
}

export type UserAnswer = Schemas['AnswerResponse'] & { questionTitle?: string }

/** The profile summary; fails quietly (no retry) until the backend serves it, and the page falls back. */
export function useUserProfile(userId: number) {
  return useQuery({
    queryKey: ['users', userId, 'profile'],
    queryFn: ({ signal }) => api<UserProfile>(`/api/users/${userId}/profile`, { signal }),
    enabled: Number.isInteger(userId) && userId > 0,
    retry: false,
  })
}

/** A user's answers, newest first (§3); the Answers tab stays hidden until this answers. */
export function useUserAnswers(userId: number) {
  return useInfiniteQuery({
    queryKey: ['users', userId, 'answers'],
    queryFn: ({ pageParam, signal }) =>
      api<Page<UserAnswer>>(`/api/answers/all/user/${userId}`, { params: { pageNo: pageParam, pageSize: FEED_PAGE_SIZE }, signal }),
    initialPageParam: 0,
    // Guarded: until the endpoint exists a proxy or older backend may answer with no page at all.
    getNextPageParam: (page) => (page && page.last === false ? page.number + 1 : undefined),
    enabled: Number.isInteger(userId) && userId > 0,
    retry: false,
  })
}
