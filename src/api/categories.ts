import { useQuery } from '@tanstack/react-query'
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
