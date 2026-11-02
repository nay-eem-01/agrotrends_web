import { queryOptions, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QuestionFilters } from '../lib/agri'
import { api } from './client'
import { ApiError } from './errors'
import { FEED_PAGE_SIZE } from './feed'
import type { Page, Schemas } from './types'

export type Question = Schemas['QuestionResponse']
export type CreateQuestionRequest = Schemas['CreateQuestionRequest']
export type UpdateQuestionRequest = Schemas['UpdateQuestionRequest']

/** Questions, newest first, filtered by topic, tag, unanswered and farming context (all combinable). Public. */
export function useQuestions(filters: QuestionFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['questions', 'list', filters],
    queryFn: ({ pageParam, signal }) =>
      api<Page<Question>>('/api/questions/all', {
        params: { pageNo: pageParam, pageSize: FEED_PAGE_SIZE, sortBy: 'creationDate', ascOrDesc: 'desc', ...filters },
        signal,
      }),
    initialPageParam: 0,
    getNextPageParam: (page) => (page.last ? undefined : page.number + 1),
    enabled,
  })
}

/** Question search: quoted phrases and -exclusions work; a blank query is never sent (the backend refuses it). */
export function useQuestionSearch(q: string) {
  return useInfiniteQuery({
    queryKey: ['questions', 'search', q],
    queryFn: ({ pageParam, signal }) => api<Page<Question>>('/api/questions/search', { params: { q, pageNo: pageParam, pageSize: FEED_PAGE_SIZE }, signal }),
    initialPageParam: 0,
    getNextPageParam: (page) => (page.last ? undefined : page.number + 1),
    enabled: q.trim() !== '',
  })
}

/** One question; shared by `useQuestion` and the link prefetch so both fill the same cache entry. */
export const questionQuery = (questionId: number) =>
  queryOptions({
    queryKey: ['questions', 'id', questionId],
    queryFn: ({ signal }) => api<Question>(`/api/questions/id/${questionId}`, { signal }),
    retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 1,
  })

export function useQuestion(questionId: number) {
  return useQuery({ ...questionQuery(questionId), enabled: Number.isFinite(questionId) })
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
