import { useQuery } from '@tanstack/react-query'
import { api } from './client'
import { ApiError } from './errors'
import type { Schemas } from './types'

export type AiAnswer = Schemas['QuestionAiAnswerResponse']

export const AI_POLL_MS = 3000
export const AI_POLL_FOR_MS = 60_000

export const aiAnswerKeys = { of: (questionId: number) => ['ai-answer', questionId] as const }

/**
 * The AI answer on a question, or null when there is none to show (not generated yet, failed, flagged, or the question
 * is hidden: all 404). Right after asking (`askedAt`), it polls every 3 s for up to a minute, then stops quietly.
 */
export function useAiAnswer(questionId: number, askedAt?: number) {
  return useQuery({
    queryKey: aiAnswerKeys.of(questionId),
    queryFn: async ({ signal }) => {
      try {
        return await api<AiAnswer>(`/api/questions/id/${questionId}/ai-answer`, { signal })
      } catch (error) {
        if (error instanceof ApiError && error.isNotFound) return null
        throw error
      }
    },
    retry: false,
    refetchInterval: (query) =>
      askedAt != null && query.state.data == null && Date.now() - askedAt < AI_POLL_FOR_MS ? AI_POLL_MS : false,
  })
}
