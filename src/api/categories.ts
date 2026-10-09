import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Page, Schemas } from './types'

export type Category = Schemas['CategoryResponse']

/** Every category (there are few), for the publish sheet. Public. */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async ({ signal }) => (await api<Page<Category>>('/api/categories/all', { params: { pageNo: 0, pageSize: 100 }, signal })).content,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
}
