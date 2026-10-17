import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { api } from './client'
import type { Page, Schemas } from './types'

export type AdminStats = Schemas['AdminStatsResponse']
export type AdminUser = Schemas['AdminUserResponse']
export type AdminUserDetail = Schemas['AdminUserDetailResponse']
export type Role = Schemas['RoleResponse']
export type Privilege = Schemas['PrivilegeResponse']

export const adminKeys = {
  stats: ['admin', 'stats'] as const,
  users: (q: string, banned?: boolean) => ['admin', 'users', q, banned ?? 'all'] as const,
  user: (userId: number) => ['admin', 'user', userId] as const,
  roles: ['admin', 'roles'] as const,
  privileges: ['admin', 'privileges'] as const,
}

/** The overview counts (users, posts, open queues). Any staff privilege may read them. */
export function useAdminStats() {
  return useQuery({ queryKey: adminKeys.stats, queryFn: ({ signal }) => api<AdminStats>('/api/admin/stats', { signal }) })
}

/** Members, newest first: `q` inside the name or e-mail, `banned` true or false (left out for everyone). */
export function useAdminUsers(q: string, banned?: boolean) {
  return useInfiniteQuery({
    queryKey: adminKeys.users(q, banned),
    queryFn: ({ pageParam, signal }) => api<Page<AdminUser>>('/api/admin/users', { params: { q: q || undefined, banned, pageNo: pageParam, pageSize: 20 }, signal }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
  })
}
