import { useQuery } from '@tanstack/react-query'
import { api } from './client'
import type { Schemas } from './types'

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
