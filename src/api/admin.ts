import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

/** One member: their counts, open reports about them and active expert topics. */
export function useAdminUser(userId: number) {
  return useQuery({ queryKey: adminKeys.user(userId), queryFn: ({ signal }) => api<AdminUserDetail>(`/api/admin/users/${userId}`, { signal }) })
}

/** Every role with its privileges (only `ADMIN` ones can be granted, edited or deleted). */
export function useRoles(enabled = true) {
  return useQuery({ queryKey: adminKeys.roles, queryFn: ({ signal }) => api<Role[]>('/api/admin/roles', { signal }), enabled })
}

/** Grant an admin role to a member, or take it away (super-admin only; applies at once, no new sign-in). */
export function useUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roleId, grant }: { userId: number; roleId: number; grant: boolean }) =>
      api<null>(`/api/admin/users/${userId}/roles/${roleId}`, { method: grant ? 'POST' : 'DELETE' }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  })
}

/** Privileges an admin role may hold (the ROLE_* ones are never grantable). */
export function usePrivileges() {
  return useQuery({ queryKey: adminKeys.privileges, queryFn: ({ signal }) => api<Privilege[]>('/api/admin/privileges', { signal }) })
}

export type RoleWrite =
  | { kind: 'create'; request: Schemas['CreateRoleRequest'] }
  | { kind: 'update'; request: Schemas['UpdateRoleRequest'] }
  | { kind: 'delete'; roleId: number }

/** Create, edit or delete an ADMIN role (super-admin only). */
export function useRoleWrite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (write: RoleWrite) =>
      write.kind === 'delete'
        ? api<null>(`/api/admin/roles/${write.roleId}`, { method: 'DELETE' })
        : api<Role>('/api/admin/roles', { method: write.kind === 'create' ? 'POST' : 'PUT', body: write.request }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  })
}
