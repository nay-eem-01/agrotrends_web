import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import { recommendedExpertsKey } from './experts'
import { feedKeys } from './feed'
import type { Page, Schemas } from './types'

export type Category = Schemas['CategoryResponse']

/** Every category (there are few), for topic pickers. Public. */
export function useCategories() {
  return useQuery({
    queryKey: ['categories', 'catalog'],
    queryFn: async ({ signal }) => (await api<Page<Category>>('/api/categories/all', { params: { pageNo: 0, pageSize: 100 }, signal, anonymous: true })).content,
    staleTime: 10 * 60_000,
  })
}

export type CategoryWrite = { kind: 'create'; name: string } | { kind: 'rename'; id: number; name: string } | { kind: 'delete'; id: number }

/** Admin category changes (CATEGORY_CREATE / _UPDATE / _DELETE permissions; 403 otherwise). */
export function useCategoryWrite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (write: CategoryWrite) =>
      write.kind === 'create'
        ? api('/api/categories/create', { method: 'POST', params: { categoryName: write.name } })
        : write.kind === 'rename'
          ? api(`/api/categories/update/categoryId/${write.id}`, { method: 'PUT', text: write.name })
          : api(`/api/categories/id/${write.id}/delete`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories', 'catalog'] }),
  })
}

const followedCategoriesKey = ['categories', 'followed'] as const

export function useFollowedCategories(enabled: boolean) {
  return useQuery({
    queryKey: followedCategoriesKey,
    queryFn: ({ signal }) => api<Category[]>('/api/me/following/categories', { signal }),
    staleTime: 5 * 60_000,
    enabled,
  })
}

export function useToggleCategoryFollow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ categoryId, follow }: { categoryId: number; follow: boolean }) =>
      api<null>(`/api/categories/${categoryId}/follow`, { method: follow ? 'PUT' : 'DELETE' }),
    onMutate: async ({ categoryId, follow }) => {
      await queryClient.cancelQueries({ queryKey: followedCategoriesKey })
      const before = queryClient.getQueryData<Category[]>(followedCategoriesKey)
      const category = queryClient.getQueryData<Category[]>(['categories', 'catalog'])?.find(({ id }) => id === categoryId)
      if (before && (!follow || category)) {
        const rest = before.filter(({ id }) => id !== categoryId)
        queryClient.setQueryData(followedCategoriesKey, follow && category ? [...rest, category] : rest)
      }
      return { previous: before?.find(({ id }) => id === categoryId) }
    },
    onError: (_error, { categoryId }, context) => {
      queryClient.setQueryData<Category[]>(followedCategoriesKey, (current) => {
        if (!current) return current
        const rest = current.filter(({ id }) => id !== categoryId)
        return context?.previous ? [...rest, context.previous] : rest
      })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: followedCategoriesKey }),
        queryClient.invalidateQueries({ queryKey: recommendedExpertsKey }),
        queryClient.invalidateQueries({ queryKey: ['questions', 'list', { following: true }] }),
        queryClient.invalidateQueries({ queryKey: feedKeys.feed('following') }),
      ])
    },
  })
}
