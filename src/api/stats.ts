import { useQuery } from '@tanstack/react-query'
import { api } from './client'
import type { Schemas } from './types'

/** Public numbers for the sign-in panel: members, verified experts, questions and answered questions. */
export type PublicStats = Schemas['PublicStatsResponse']

/**
 * Counted at most hourly by the backend. The sign-in panel shows from 1024px, so by default it is asked for only
 * there; `everywhere` asks on any screen (Discover's expert line).
 */
export function usePublicStats({ everywhere = false } = {}) {
  const wide = typeof window !== 'undefined' && window.matchMedia?.('(min-width: 1024px)').matches === true
  return useQuery({
    enabled: everywhere || wide,
    queryKey: ['stats', 'public'],
    queryFn: ({ signal }) => api<PublicStats>('/api/stats/public', { signal }),
    retry: false,
    staleTime: 60 * 60_000,
  })
}
