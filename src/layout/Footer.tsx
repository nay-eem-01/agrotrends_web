import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { setLang, useLang, useT } from '../lib/i18n'

const YEAR = new Date().getFullYear()

export function Footer() {
  const t = useT()
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto flex max-w-(--container-page) flex-wrap items-center gap-x-6 gap-y-2 px-4 py-8 text-sm text-ink-muted sm:px-6">
        <span>© {YEAR} AgroTrends</span>
        <nav aria-label="Footer" className="flex gap-5 sm:ml-auto">
          <Link to="/questions" className="hover:text-ink">{t('Questions')}</Link>
          <Link to="/advisor" className="hover:text-ink">{t('AI advisor')}</Link>
          <Link to="/write" className="hover:text-ink">{t('Write')}</Link>
          <LanguageSwitch />
        </nav>
      </div>
    </footer>
  )
}

/** Switches the interface between English and Bengali; data reloads so the backend's messages follow. */
export function LanguageSwitch({ className }: { className?: string }) {
  const lang = useLang()
  const queryClient = useQueryClient()
  const next = lang === 'bn' ? 'en' : 'bn'
  return (
    <button
      type="button"
      lang={next}
      onClick={() => {
        setLang(next)
        void queryClient.invalidateQueries()
      }}
      className={className ?? 'hover:text-ink'}
    >
      {next === 'bn' ? 'বাংলা' : 'English'}
    </button>
  )
}
