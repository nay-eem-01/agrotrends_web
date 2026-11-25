import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { settingsKey, useUpdateUserSettings } from '../api/settings'
import { errorMessage } from '../api/errors'
import { useSession } from '../features/auth/session'
import { getLang, setLang, useLang } from '../lib/i18n'

export function useLanguageSwitch() {
  const lang = useLang()
  const queryClient = useQueryClient()
  const { status } = useSession()
  const save = useUpdateUserSettings()
  const nextLang = lang === 'bn' ? 'en' : 'bn'

  function reloadTranslatedContent() {
    void queryClient.invalidateQueries({ predicate: ({ queryKey }) => queryKey[0] !== settingsKey[0] || queryKey[1] !== settingsKey[1] })
  }

  function changeLanguage() {
    if (save.isPending) return
    setLang(nextLang)
    // Keep e-mail language in sync with the interface for signed-in readers.
    if (status === 'signed-in') {
      save.mutate({ preferredLang: nextLang }, {
        onError: (error) => {
          if (getLang() === nextLang) setLang(lang)
          reloadTranslatedContent()
          toast.error(errorMessage(error))
        },
      })
    }
    reloadTranslatedContent()
  }

  return { nextLang, nextLabel: nextLang === 'bn' ? 'বাংলা' : 'English', changeLanguage }
}
