import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Page, Schemas } from './types'

export type BlogAssist = Schemas['BlogAssistResponse']

/** A short summary and suggested topics for a draft (Gemini, authors only). 503 while the AI is down. */
export function useBlogAssist() {
  return useMutation({
    mutationFn: (draft: Schemas['BlogAssistRequest']) => api<BlogAssist>('/api/ai/blog-assist', { method: 'POST', body: draft }),
  })
}

export type AiAnswer = Schemas['AiAnswerResponse']
export type AiHistoryItem = Schemas['AiHistoryItemResponse']

/** The backend's limit (AppConstants.AI_MAX_QUESTION_LENGTH). */
export const MAX_ADVISOR_QUESTION = 1000

/** Ask the advisor; the answer cites the stories it drew on. 429 at the daily limit, 503 while the AI is down. */
export function useAskAdvisor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (question: string) => api<AiAnswer>('/api/ai/ask', { method: 'POST', body: { question } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai', 'history'] }),
  })
}

/** The reader's earlier questions to the advisor, newest first. */
export function useAdvisorHistory(enabled = true) {
  return useInfiniteQuery({
    queryKey: ['ai', 'history'],
    queryFn: ({ pageParam, signal }) => api<Page<AiHistoryItem>>('/api/ai/history', { params: { pageNo: pageParam, pageSize: 10 }, signal }),
    initialPageParam: 0,
    getNextPageParam: (page) => (page.last ? undefined : page.number + 1),
    enabled,
  })
}

/** Titles longer than this are cut; the backend uses the first 120 characters when none is given. */
export const MAX_ASK_EXPERTS_TITLE = 120

/**
 * Turns a private ask into a public question carrying that AI answer, for experts in the topic to review. 409 when it
 * was published already; the history then says where.
 */
export function useAskExperts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ aiAnswerId, categoryId, title }: { aiAnswerId: number; categoryId: number; title?: string }) =>
      api<Schemas['QuestionResponse']>(`/api/ai/history/${aiAnswerId}/ask-experts`, { method: 'POST', body: { categoryId, title: title || undefined } }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['ai', 'history'] }),
  })
}
