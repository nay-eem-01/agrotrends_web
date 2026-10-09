import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

/**
 * Story responses (comments) and question answers work the same way: top-level items, one level of replies, owner
 * edit and delete. The backend's two DTOs aren't in the OpenAPI document, so they are mirrored and made one shape.
 */
export type ThreadKind = 'comments' | 'answers'

export interface ThreadItem {
  id: number
  userId: number
  authorName: string
  content: string
  createdAt: string
  updatedAt: string
}

interface Raw {
  commentId?: number
  answerId?: number
  userId: number
  authorName: string
  content: string
  createdAt: string
  updatedAt: string
}

const routes = {
  comments: {
    list: (parentId: number) => `/api/comments/blog/${parentId}`,
    replies: (id: number) => `/api/comments/replies/${id}`,
    create: (parentId: number, content: string) => ({ path: '/api/comments/create', body: { blogId: parentId, content } }),
    reply: (parentId: number, id: number, content: string) => ({ path: '/api/comments/reply', body: { blogId: parentId, parentCommentId: id, content } }),
    update: (parentId: number, id: number, content: string) => ({ path: '/api/comments/update', body: { commentId: id, blogId: parentId, content } }),
    remove: (id: number) => `/api/comments/id/${id}`,
  },
  answers: {
    list: (parentId: number) => `/api/answers/question/${parentId}`,
    replies: (id: number) => `/api/answers/replies/${id}`,
    create: (parentId: number, content: string) => ({ path: '/api/answers/create', body: { questionId: parentId, content } }),
    reply: (parentId: number, id: number, content: string) => ({ path: '/api/answers/reply', body: { questionId: parentId, parentAnswerId: id, content } }),
    update: (_parentId: number, id: number, content: string) => ({ path: '/api/answers/update/', body: { answerId: id, content } }),
    remove: (id: number) => `/api/answers/delete/id/${id}`,
  },
}

const normalise = (raw: Raw): ThreadItem => ({ ...raw, id: (raw.commentId ?? raw.answerId)! })
const oldestFirst = (a: ThreadItem, b: ThreadItem) => a.createdAt.localeCompare(b.createdAt)

async function read(path: string, signal: AbortSignal): Promise<ThreadItem[]> {
  return (await api<Raw[]>(path, { signal })).map(normalise).sort(oldestFirst)
}

export const threadKeys = {
  all: (kind: ThreadKind) => [kind] as const,
  list: (kind: ThreadKind, parentId: number) => [kind, 'list', parentId] as const,
  replies: (kind: ThreadKind, id: number) => [kind, 'replies', id] as const,
}

/** Top-level items of a story or question, oldest first. Public. */
export function useThread(kind: ThreadKind, parentId: number) {
  return useQuery({ queryKey: threadKeys.list(kind, parentId), queryFn: ({ signal }) => read(routes[kind].list(parentId), signal) })
}

/** Replies of each item. The API has no reply counts, so every thread is read (backend need in the roadmap). */
export function useThreadReplies(kind: ThreadKind, ids: number[]) {
  return useQueries({
    queries: ids.map((id) => ({ queryKey: threadKeys.replies(kind, id), queryFn: ({ signal }: { signal: AbortSignal }) => read(routes[kind].replies(id), signal) })),
  })
}

export type ThreadWrite =
  | { action: 'create'; content: string }
  | { action: 'reply'; id: number; content: string }
  | { action: 'update'; id: number; content: string }
  | { action: 'delete'; id: number }

/** Post, reply, edit or delete in a story's or question's thread; the thread reloads afterwards. */
export function useThreadWrite(kind: ThreadKind, parentId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (write: ThreadWrite) => {
      const r = routes[kind]
      if (write.action === 'delete') return api(r.remove(write.id), { method: 'DELETE' })
      const { path, body } =
        write.action === 'create' ? r.create(parentId, write.content) : write.action === 'reply' ? r.reply(parentId, write.id, write.content) : r.update(parentId, write.id, write.content)
      return api(path, { method: write.action === 'update' ? 'PUT' : 'POST', body })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: threadKeys.all(kind) }),
  })
}
