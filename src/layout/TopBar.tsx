import { useT } from '../lib/i18n'
import { MagnifyingGlass, NotePencil } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { cn } from 'cn'
import { useSession } from '../features/auth/session'
import { ButtonLink } from '../ui/Button'
import { AccountMenu } from './AccountMenu'
import { Logo } from './Logo'

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn('hidden h-11 items-center px-2 text-sm transition-colors duration-150 md:flex', isActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground')

export function TopBar() {
  const t = useT()
  const navigate = useNavigate()
  const { status } = useSession()
  const [query, setQuery] = useState('')

  function search(event: FormEvent) {
    event.preventDefault()
    const q = query.trim()
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-(--container-page) items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Logo />
        <search className="hidden min-w-0 flex-1 sm:block sm:max-w-60">
          <form onSubmit={search}>
            <label className="flex h-10 items-center gap-2 rounded-full bg-field px-3 text-ink-muted focus-within:ring-2 focus-within:ring-paddy">
              <MagnifyingGlass size={18} aria-hidden="true" />
              <span className="sr-only">{t('Search questions and stories')}</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('Search')}
                className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
              />
            </label>
          </form>
        </search>
        <nav aria-label={t('Main')} className="ml-auto flex items-center gap-0 sm:gap-3">
          <Link to="/search" className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted hover:text-ink sm:hidden" aria-label={t('Search')}>
            <MagnifyingGlass size={22} />
          </Link>
          <NavLink to="/" end className={navClass}>
            {t('Questions')}
          </NavLink>
          <NavLink to="/stories" className={navClass}>
            {t('Stories')}
          </NavLink>
          <NavLink to="/advisor" className={navClass}>
            {t('Advisor')}
          </NavLink>
          <Link to="/write" className="hidden h-11 items-center gap-1.5 px-2 text-sm text-ink-muted hover:text-ink md:flex">
            <NotePencil size={20} aria-hidden="true" />
            {t('Write')}
          </Link>
          {status === 'signed-in' && (
            <>
              <Link to="/write" className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted hover:text-ink md:hidden" aria-label={t('Write')}>
                <NotePencil size={22} />
              </Link>
              <ButtonLink to="/questions/ask" size="sm" className="ml-1 hidden sm:inline-flex">
                {t('Ask')}
              </ButtonLink>
              <AccountMenu />
            </>
          )}
          {status === 'anonymous' && (
            <>
              <Link to="/sign-in" className="hidden h-11 items-center px-2 text-sm whitespace-nowrap text-ink-muted hover:text-ink sm:flex">
                {t('Sign in')}
              </Link>
              <ButtonLink to="/sign-up" size="sm">
                {t('Get started')}
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
