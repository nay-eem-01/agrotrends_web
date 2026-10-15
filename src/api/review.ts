import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { aiAnswerKeys } from './aiAnswer'
import { answerKeys } from './answers'
import { api } from './client'
import type { Page, Schemas } from './types'

export type ReviewItem = Schemas['ReviewItemResponse']
export type ReviewAction = 'confirm' | 'correct' | 'flag'

/** The backend's limit on a correction (CorrectAiAnswerRequest). */
export const MAX_CORRECTION = 5000

/** Unchecked AI answers in the caller's expert topics, oldest first. 403 for anyone who isn't a Verified Expert. */
export function useReviewQueue(enabled = true) {
  return useInfiniteQuery({
    queryKey: ['review-queue'],
    queryFn: ({ pageParam, signal }) => api<Page<ReviewItem>>('/api/review-queue', { params: { pageNo: pageParam, pageSize: 10 }, signal }),
    initialPageParam: 0,
    getNextPageParam: (page) => (page.last ? undefined : page.number + 1),
    retry: false,
    enabled,
  })
}

/**
 * Confirm, correct (posts the expert's answer on the question) or flag (hides it) an unchecked AI answer. Settled
 * either way, the AI answer, the answers and the queue reload: a 409 means someone reviewed it first.
 */
export function useReviewAiAnswer(questionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ action, content }: { action: ReviewAction; content?: string }) =>
      api(`/api/questions/id/${questionId}/ai-answer/${action}`, { method: 'POST', body: action === 'correct' ? { content } : undefined }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: aiAnswerKeys.of(questionId) })
      void queryClient.invalidateQueries({ queryKey: answerKeys.list(questionId) })
      void queryClient.invalidateQueries({ queryKey: ['review-queue'] })
    },
  })
}
