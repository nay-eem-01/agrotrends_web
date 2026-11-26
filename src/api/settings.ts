import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Schemas } from './types'

export type UserSettings = Schemas['UserSettingsResponse']
export type UserSettingsChange = Schemas['UpdateUserSettingsRequest']

export const settingsKey = ['user', 'settings'] as const

/** Your language and which e-mails you get (both default on; mail goes only to a confirmed address). Signed in. */
export function useUserSettings(enabled: boolean) {
  return useQuery({ queryKey: settingsKey, queryFn: ({ signal }) => api<UserSettings>('/api/user/settings', { signal }), enabled, staleTime: 5 * 60_000 })
}

/** Changes the fields given and leaves the rest; shown at once, put back if the backend refuses. */
export function useUpdateUserSettings() {
  const queryClient = useQueryClient()
  function mergeChangedFields(source: UserSettings, change: UserSettingsChange) {
    const keys = Object.keys(change) as (keyof UserSettingsChange)[]
    queryClient.setQueryData<UserSettings>(settingsKey, (current) => current
      ? { ...current, ...Object.fromEntries(keys.map((key) => [key, source[key]])) }
      : source)
  }

  return useMutation({
    mutationFn: (change: UserSettingsChange) => api<UserSettings>('/api/user/settings', { method: 'PUT', body: change }),
    onMutate: async (change) => {
      await queryClient.cancelQueries({ queryKey: settingsKey })
      const before = queryClient.getQueryData<UserSettings>(settingsKey)
      if (before) queryClient.setQueryData(settingsKey, { ...before, ...change })
      return { before }
    },
    onError: (_error, change, context) => {
      if (context?.before) mergeChangedFields(context.before, change)
    },
    onSuccess: (saved, change) => {
      if (saved) mergeChangedFields(saved, change)
    },
  })
}
