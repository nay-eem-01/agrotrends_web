import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AgriFilters } from '../lib/agri'
import { api } from './client'
import { ApiError } from './errors'
import { FEED_PAGE_SIZE } from './feed'
import type { Page, Schemas } from './types'

export type Question = Schemas['QuestionResponse']
export type CreateQuestionRequest = Schemas['CreateQuestionRequest']
export type UpdateQuestionRequest = Schemas['UpdateQuestionRequest']
export type AiDraftAnswer = Schemas['AiDraftAnswerResponse']

/** Questions, newest first, optionally filtered by crop, season, region and soil. Public. */
export function useQuestions(filters: AgriFilters) {
  return useInfiniteQuery({
    queryKey: ['questions', 'list', filters],
    queryFn: ({ pageParam, signal }) =>
      api<Page<Question>>('/api/questions/all', {
        params: { pageNo: pageParam, pageSize: FEED_PAGE_SIZE, sortBy: 'creationDate', ascOrDesc: 'desc', ...filters },
        signal,
      }),
    initialPageParam: 0,
    getNextPageParam: (page) => (page.last ? undefined : page.number + 1),
  })
}

export function useQuestion(questionId: number) {
  return useQuery({
    queryKey: ['questions', 'id', questionId],
    queryFn: ({ signal }) => api<Question>(`/api/questions/id/${questionId}`, { signal }),
    enabled: Number.isFinite(questionId),
    retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 1,
  })
}

export type QuestionWrite =
  | { kind: 'create'; request: CreateQuestionRequest }
  | { kind: 'update'; request: UpdateQuestionRequest }
  | { kind: 'delete'; questionId: number }

/** Ask, edit or delete a question; question lists reload afterwards. */
export function useQuestionWrite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (write: QuestionWrite): Promise<Question | null> =>
      write.kind === 'create'
        ? api<Question>('/api/questions/create', { method: 'POST', body: write.request })
        : write.kind === 'update'
          ? api<Question>('/api/questions/update', { method: 'PUT', body: write.request })
          : api<null>(`/api/questions/id/${write.questionId}/delete`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['questions'] }),
  })
}

/** An AI draft answer for an unanswered question: labelled, never posted. 503 while the AI is down. */
export function useAiDraftAnswer(questionId: number) {
  return useMutation({ mutationFn: () => api<AiDraftAnswer>(`/api/questions/id/${questionId}/ai-draft`, { method: 'POST' }) })
}
