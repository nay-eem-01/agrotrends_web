import { useQuery } from '@tanstack/react-query'
import { api } from './client'

/** Public numbers for the sign-in panel (docs/BACKEND_REQUESTS.md §10; not in the OpenAPI yet). */
export interface PublicStats {
  members?: number
  verifiedExperts?: number
  questions?: number
  answeredQuestions?: number
}

/** Hidden (no retry) until the backend serves them; asked for only where the panel shows (from 1024px). */
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
