import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import { FEED_PAGE_SIZE } from './feed'
import type { Page, Schemas } from './types'

/** A user's public summary; `authorId` equals `userId`. */
export type UserProfile = Schemas['UserProfileResponse']

export type UpdateUserProfileRequest = Schemas['UpdateUserProfileRequest']

/** The backend's limit on a location. */
export const MAX_LOCATION = 80

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

/** Your location and cover photo (both replaced: send blank to clear); the cover must come from `POST /api/images`. */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdateUserProfileRequest) => api<UserProfile>('/api/user/profile', { method: 'PUT', body: request }),
    onSuccess: (profile) => {
      if (profile.userId != null) queryClient.setQueryData(['users', profile.userId, 'profile'], profile)
    },
  })
}
