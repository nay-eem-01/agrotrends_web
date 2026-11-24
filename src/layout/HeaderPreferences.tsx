import { Moon, Sun } from '@phosphor-icons/react'
import { useT } from '../lib/i18n'
import { setTheme, useTheme } from '../lib/theme'
import { useLanguageSwitch } from './useLanguageSwitch'

const control = 'inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-surface hover:text-foreground'

export function HeaderPreferences({ showLanguage = true }: { showLanguage?: boolean }) {
  const t = useT()
  const theme = useTheme()
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  const ThemeIcon = nextTheme === 'dark' ? Moon : Sun
  const themeLabel = nextTheme === 'dark' ? t('Dark theme') : t('Light theme')

  return (
    <div className="flex shrink-0 items-center">
      {showLanguage && <HeaderLanguageSwitch />}
      <button type="button" aria-label={themeLabel} title={themeLabel} onClick={() => setTheme(nextTheme)} className={`${control} w-11`}>
        <ThemeIcon size={21} aria-hidden="true" />
      </button>
    </div>
  )
}

function HeaderLanguageSwitch() {
  const t = useT()
  const { nextLang, nextLabel, changeLanguage } = useLanguageSwitch()
  return (
    <button type="button" lang={nextLang} title={t('Language')} onClick={changeLanguage} className={`${control} px-2 text-sm font-semibold`}>
      {nextLabel}
    </button>
  )
}
