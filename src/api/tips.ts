import { useQuery } from '@tanstack/react-query'
import { api } from './client'
import type { Category } from './categories'

/** One of this week's farm tasks (docs/BACKEND_REQUESTS.md §11; not in the OpenAPI yet). */
export interface WeekTip {
  id: number
  topic?: Category | null
  text: string
  textBn?: string | null
}

/** This week's tasks for the current Bengali month. Hidden (no retry) until the backend serves them. */
export function useWeekTips() {
  return useQuery({
    queryKey: ['tips', 'this-week'],
    queryFn: ({ signal }) => api<WeekTip[]>('/api/tips/this-week', { signal }),
    retry: false,
    staleTime: 60 * 60_000,
  })
}
