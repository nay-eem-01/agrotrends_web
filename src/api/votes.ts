import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from './client'
import type { Schemas } from './types'

export type Direction = 'UP' | 'DOWN'
export type VoteState = Schemas['VoteResponse']
export type VoteTarget = 'questions' | 'answers'

export const voteKeys = {
  mine: (questionId: number) => ['votes', 'mine', questionId] as const,
}

/** The caller's votes on a question and all its answers, in one call. Signed-in only. */
export function useMyVotes(questionId: number, enabled: boolean) {
  return useQuery({
    queryKey: voteKeys.mine(questionId),
    queryFn: ({ signal }) => api<Schemas['MyVotesResponse']>(`/api/questions/id/${questionId}/my-votes`, { signal }),
    enabled,
  })
}

/** Cast or change a vote (`direction`), or withdraw it (`null`); returns the new score and the caller's vote. */
export function useVote(target: VoteTarget, id: number) {
  return useMutation({
    mutationFn: (direction: Direction | null) =>
      direction
        ? api<VoteState>(`/api/${target}/id/${id}/vote`, { method: 'PUT', params: { direction } })
        : api<VoteState>(`/api/${target}/id/${id}/vote`, { method: 'DELETE' }),
  })
}

/** What a click on `direction` leads to, given the current vote: the same arrow again withdraws it. */
export function nextVote(current: Direction | undefined, direction: Direction): Direction | null {
  return current === direction ? null : direction
}

/** The score shown straight away, before the backend answers. */
export function optimisticScore(score: number, from: Direction | undefined, to: Direction | null): number {
  const value = (vote: Direction | null | undefined) => (vote === 'UP' ? 1 : vote === 'DOWN' ? -1 : 0)
  return score - value(from) + value(to)
}
