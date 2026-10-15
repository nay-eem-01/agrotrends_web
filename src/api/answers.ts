import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Schemas } from './types'

export type Answer = Schemas['AnswerResponse']

export const answerKeys = {
  all: ['answers'] as const,
  list: (questionId: number) => ['answers', 'list', questionId] as const,
  replies: (answerId: number) => ['answers', 'replies', answerId] as const,
}

/** A question's direct answers, in the backend's order: accepted first, then by score, then oldest. Public. */
export function useAnswers(questionId: number) {
  return useQuery({
    queryKey: answerKeys.list(questionId),
    queryFn: ({ signal }) => api<Answer[]>(`/api/answers/question/${questionId}`, { signal }),
  })
}

/** Replies under one answer, oldest first; read when the reader opens them (there is no reply count). */
export function useAnswerReplies(answerId: number, enabled: boolean) {
  return useQuery({
    queryKey: answerKeys.replies(answerId),
    queryFn: async ({ signal }) =>
      (await api<Answer[]>(`/api/answers/replies/${answerId}`, { signal })).sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? '')),
    enabled,
  })
}

export type AnswerWrite =
  | { action: 'create'; content: string }
  | { action: 'reply'; answerId: number; content: string }
  | { action: 'update'; answerId: number; content: string }
  | { action: 'delete'; answerId: number }

/** Answer, reply, edit or delete under a question; answers, replies and the question (its answer count) reload. */
export function useAnswerWrite(questionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (write: AnswerWrite) => {
      switch (write.action) {
        case 'create':
          return api<Answer>('/api/answers/create', { method: 'POST', body: { questionId, content: write.content } })
        case 'reply':
          return api<Answer>('/api/answers/reply', { method: 'POST', body: { questionId, parentAnswerId: write.answerId, content: write.content } })
        case 'update':
          // The trailing slash is the backend's path.
          return api<Answer>('/api/answers/update/', { method: 'PUT', body: { answerId: write.answerId, content: write.content } })
        case 'delete':
          return api<null>(`/api/answers/delete/id/${write.answerId}`, { method: 'DELETE' })
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: answerKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['questions', 'id', questionId] })
    },
  })
}

/** The asker accepts an answer (`accept`) or takes it back; the list reorders (accepted first) and the question updates. */
export function useAcceptAnswer(questionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ answerId, accept }: { answerId: number; accept: boolean }) =>
      api<Answer>(`/api/answers/id/${answerId}/accept`, { method: accept ? 'PUT' : 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: answerKeys.list(questionId) })
      void queryClient.invalidateQueries({ queryKey: ['questions', 'id', questionId] })
    },
  })
}
