import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import { recommendedExpertsKey } from './experts'
import { feedKeys } from './feed'
import type { Page, Schemas } from './types'

export type Category = Schemas['CategoryResponse']

const catalogKey = ['categories', 'catalog'] as const
const catalogStorageKey = 'agrotrends.topics.catalog'
const catalogFreshness = 10 * 60_000

function readCatalog() {
  try {
    const saved = JSON.parse(localStorage.getItem(catalogStorageKey) ?? 'null')
    if (!Array.isArray(saved) || saved.length === 0) return undefined
    return saved.every((topic) => Number.isSafeInteger(topic?.id) && topic.id > 0 && typeof topic.categoryName === 'string')
      ? (saved as Category[])
      : undefined
  } catch {
    return undefined
  }
}

/** Keep the last complete public catalogue available while refreshing it or recovering from a failed request. */
export function useCategories() {
  return useQuery({
    queryKey: catalogKey,
    initialData: readCatalog,
    initialDataUpdatedAt: 0,
    queryFn: async ({ signal }) => {
      const categories: Category[] = []
      let pageNo = 0
      for (;;) {
        const page = await api<Page<Category>>('/api/categories/all', { params: { pageNo, pageSize: 100 }, signal, anonymous: true })
        categories.push(...page.content)
        if (page.last !== false) break
        pageNo += 1
      }
      try {
        if (categories.length) localStorage.setItem(catalogStorageKey, JSON.stringify(categories))
        else localStorage.removeItem(catalogStorageKey)
      } catch {
        // The catalogue is still available in memory when browser storage is unavailable.
      }
      return categories
    },
    staleTime: catalogFreshness,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogKey }),
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
      const category = queryClient.getQueryData<Category[]>(catalogKey)?.find(({ id }) => id === categoryId)
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
