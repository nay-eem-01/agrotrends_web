import { useQueryClient } from '@tanstack/react-query'
import { useUpdateUserSettings } from '../api/settings'
import { useSession } from '../features/auth/session'
import { setLang, useLang } from '../lib/i18n'

export function useLanguageSwitch() {
  const lang = useLang()
  const queryClient = useQueryClient()
  const { status } = useSession()
  const save = useUpdateUserSettings()
  const nextLang = lang === 'bn' ? 'en' : 'bn'

  function changeLanguage() {
    setLang(nextLang)
    // Keep e-mail language in sync with the interface for signed-in readers.
    if (status === 'signed-in') save.mutate({ preferredLang: nextLang })
    void queryClient.invalidateQueries()
  }

  return { nextLang, nextLabel: nextLang === 'bn' ? 'বাংলা' : 'English', changeLanguage }
}
