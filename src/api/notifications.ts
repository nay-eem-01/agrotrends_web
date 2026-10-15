import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Page, Schemas } from './types'

export type Notification = Schemas['NotificationResponse']

/** The unread count is polled (there is no push): every minute while the tab is visible, and on focus. */
export const UNREAD_POLL_MS = 60_000

export const notificationKeys = {
  all: ['notifications'] as const,
  unread: ['notifications', 'unread'] as const,
  list: (unreadOnly: boolean, pageSize: number) => ['notifications', 'list', unreadOnly, pageSize] as const,
}

export function useUnreadCount(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: async ({ signal }) => (await api<{ count: number }>('/api/notifications/unread-count', { signal })).count,
    enabled,
    refetchInterval: UNREAD_POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  })
}

/** Newest first; `unreadOnly` for the unread tab. */
export function useNotifications({ unreadOnly = false, pageSize = 20, enabled = true }: { unreadOnly?: boolean; pageSize?: number; enabled?: boolean } = {}) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(unreadOnly, pageSize),
    queryFn: ({ pageParam, signal }) =>
      api<Page<Notification>>('/api/notifications', { params: { unreadOnly: unreadOnly || undefined, pageNo: pageParam, pageSize }, signal }),
    initialPageParam: 0,
    getNextPageParam: (page) => (page.last ? undefined : page.number + 1),
    enabled,
  })
}

/** Mark one read (`id`) or all; the count and the lists reload. */
export function useMarkRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number | 'all') =>
      id === 'all' ? api('/api/notifications/read-all', { method: 'POST' }) : api(`/api/notifications/${id}/read`, { method: 'POST' }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}
