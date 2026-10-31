import { useQuery } from '@tanstack/react-query'
import { api } from './client'
import type { Schemas } from './types'

/** Public numbers for the sign-in panel: members, verified experts, questions and answered questions. */
export type PublicStats = Schemas['PublicStatsResponse']

/** Counted at most hourly by the backend; asked for only where the panel shows (from 1024px). */
export function usePublicStats() {
  const wide = typeof window !== 'undefined' && window.matchMedia?.('(min-width: 1024px)').matches === true
  return useQuery({
    enabled: wide,
    queryKey: ['stats', 'public'],
    queryFn: ({ signal }) => api<PublicStats>('/api/stats/public', { signal }),
    retry: false,
    staleTime: 60 * 60_000,
  })
}
