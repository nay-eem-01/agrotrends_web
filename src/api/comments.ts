import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Schemas } from './types'

/**
 * Mirrors the backend's `CommentResponse`, which the OpenAPI document doesn't describe (the comment endpoints are
 * documented as a bare envelope). Replace with the generated type once it is there.
 */
export interface CommentResponse {
  commentId: number
  blogId: number
  parentCommentId: number | null
  userId: number
  authorName: string
  content: string
  createdAt: string
  updatedAt: string
}

export const commentKeys = {
  all: ['comments'] as const,
  forBlog: (blogId: number) => ['comments', 'blog', blogId] as const,
  replies: (commentId: number) => ['comments', 'replies', commentId] as const,
}

const oldestFirst = (a: CommentResponse, b: CommentResponse) => a.createdAt.localeCompare(b.createdAt)

/** A story's top-level responses, oldest first. Public. */
export function useComments(blogId: number) {
  return useQuery({
    queryKey: commentKeys.forBlog(blogId),
    queryFn: async ({ signal }) => (await api<CommentResponse[]>(`/api/comments/blog/${blogId}`, { signal })).sort(oldestFirst),
  })
}

/** Replies of each comment. The API has no reply counts, so every thread is read (backend need in the roadmap). */
export function useReplies(commentIds: number[]) {
  return useQueries({
    queries: commentIds.map((commentId) => ({
      queryKey: commentKeys.replies(commentId),
      queryFn: async ({ signal }: { signal: AbortSignal }) =>
        (await api<CommentResponse[]>(`/api/comments/replies/${commentId}`, { signal })).sort(oldestFirst),
    })),
  })
}

type Write =
  | { kind: 'create'; request: Schemas['CreateCommentRequest'] }
  | { kind: 'reply'; request: Schemas['ReplyCommentRequest'] }
  | { kind: 'update'; request: Schemas['UpdateCommentRequest'] }
  | { kind: 'delete'; commentId: number }

function send(write: Write): Promise<unknown> {
  switch (write.kind) {
    case 'create':
      return api('/api/comments/create', { method: 'POST', body: write.request })
    case 'reply':
      return api('/api/comments/reply', { method: 'POST', body: write.request })
    case 'update':
      return api('/api/comments/update', { method: 'PUT', body: write.request })
    case 'delete':
      return api(`/api/comments/id/${write.commentId}`, { method: 'DELETE' })
  }
}

/** Respond, reply, edit or delete; the story's responses and threads reload afterwards. */
export function useCommentWrite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: send,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: commentKeys.all }),
  })
}
