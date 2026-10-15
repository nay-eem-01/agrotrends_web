import { MutationCache, QueryClient } from '@tanstack/react-query'
import { isConfirmEmailError, requestEmailConfirmation } from './features/auth/confirmEmail'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    // Any write refused for an unconfirmed e-mail explains itself in one dialog, wherever it was made.
    mutationCache: new MutationCache({
      onError: (error) => {
        if (isConfirmEmailError(error)) requestEmailConfirmation()
      },
    }),
    defaultOptions: {
      queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
    },
  })
}
