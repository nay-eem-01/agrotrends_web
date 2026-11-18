import { queryOptions, useQuery } from '@tanstack/react-query'
import { api } from './client'
import { ApiError } from './errors'
import type { Schemas } from './types'

export type AiAnswer = Schemas['QuestionAiAnswerResponse']

export const AI_POLL_MS = 3000
export const AI_POLL_FOR_MS = 60_000

export const aiAnswerKeys = { of: (questionId: number) => ['ai-answer', questionId] as const }

/**
 * The AI answer, or null when there is none to show. Older deployments use 404 for that state.
 * Right after asking, poll every three seconds for up to one minute.
 */
export const aiAnswerQuery = (questionId: number) =>
  queryOptions({
    queryKey: aiAnswerKeys.of(questionId),
    queryFn: async ({ signal }) => {
      try {
        return await api<AiAnswer | null>(`/api/questions/id/${questionId}/ai-answer`, { signal, anonymous: true })
      } catch (error) {
        if (error instanceof ApiError && error.isNotFound) return null
        throw error
      }
    },
    retry: false,
  })

export function useAiAnswer(questionId: number, askedAt?: number, enabled = true) {
  return useQuery({
    ...aiAnswerQuery(questionId),
    enabled,
    refetchInterval: (query) =>
      askedAt != null && query.state.data == null && Date.now() - askedAt < AI_POLL_FOR_MS ? AI_POLL_MS : false,
  })
}
