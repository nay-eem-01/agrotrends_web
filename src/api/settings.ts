import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Schemas } from './types'

export type UserSettings = Schemas['UserSettingsResponse']
export type UserSettingsChange = Schemas['UpdateUserSettingsRequest']

const settingsKey = ['user', 'settings'] as const

/** Your language and which e-mails you get (both default on; mail goes only to a confirmed address). Signed in. */
export function useUserSettings(enabled: boolean) {
  return useQuery({ queryKey: settingsKey, queryFn: ({ signal }) => api<UserSettings>('/api/user/settings', { signal }), enabled, staleTime: 5 * 60_000 })
}

/** Changes the fields given and leaves the rest; shown at once, put back if the backend refuses. */
export function useUpdateUserSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (change: UserSettingsChange) => api<UserSettings>('/api/user/settings', { method: 'PUT', body: change }),
    onMutate: async (change) => {
      await queryClient.cancelQueries({ queryKey: settingsKey })
      const before = queryClient.getQueryData<UserSettings>(settingsKey)
      if (before) queryClient.setQueryData(settingsKey, { ...before, ...change })
      return { before }
    },
    onError: (_error, _change, context) => {
      if (context?.before) queryClient.setQueryData(settingsKey, context.before)
    },
    onSuccess: (saved) => {
      if (saved) queryClient.setQueryData(settingsKey, saved)
    },
  })
}
