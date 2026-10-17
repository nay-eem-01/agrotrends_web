import { useT } from '../lib/i18n'
import { MagnifyingGlass, NotePencil } from '@phosphor-icons/react'
import { lazy, Suspense, useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { cn } from 'cn'
import { useSession } from '../features/auth/session'
import { ButtonLink } from '../ui/Button'
import { NotificationBell } from './NotificationBell'
import { Logo } from './Logo'

// The menus (dialog and menu code) load just after the page; a same-size space holds their place meanwhile.
const AccountMenu = lazy(() => import('./AccountMenu').then((m) => ({ default: m.AccountMenu })))
const MobileMenu = lazy(() => import('./MobileMenu').then((m) => ({ default: m.MobileMenu })))
const placeholder = (className: string) => <span aria-hidden="true" className={cn('size-11 shrink-0', className)} />

// The current page is green and underlined at the bar's bottom edge, so it doesn't rely on colour alone.
const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative hidden h-11 items-center gap-1.5 px-2.5 text-sm whitespace-nowrap transition-colors duration-150 lg:flex',
    isActive
      ? 'font-semibold text-primary after:absolute after:inset-x-2.5 after:-bottom-[10px] after:h-0.5 after:rounded-full after:bg-primary'
      : 'text-muted-foreground hover:text-foreground',
  )

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
    <header className="sticky top-0 z-20 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-(--container-page) items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Logo />
        <search className="hidden min-w-0 flex-1 xl:block xl:max-w-72">
          <form onSubmit={search}>
            <label className="flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-muted-foreground transition-[border-color,box-shadow,background-color] duration-150 focus-within:border-primary focus-within:bg-background focus-within:ring-[3px] focus-within:ring-ring/60 hover:border-border-strong">
              <MagnifyingGlass size={18} aria-hidden="true" />
              <span className="sr-only">{t('Search questions and stories')}</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('Search')}
                enterKeyHint="search"
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </label>
          </form>
        </search>
        <nav aria-label={t('Main')} className="ml-auto flex items-center gap-0 md:gap-1">
          {/* Below 1280px the search page's own field is used. Below 380px the menu carries search, to keep the bar on one line. */}
          <Link to="/search" className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground max-[379px]:hidden xl:hidden" aria-label={t('Search')}>
            <MagnifyingGlass size={22} />
          </Link>
          <NavLink to="/" end className={navClass}>
            {t('Discover')}
          </NavLink>
          <NavLink to="/questions" className={navClass}>
            {t('Questions')}
          </NavLink>
          <NavLink to="/stories" className={navClass}>
            {t('Stories')}
          </NavLink>
          <NavLink to="/advisor" className={navClass}>
            {t('AI advisor')}
          </NavLink>
          <NavLink to="/write" className={navClass}>
            <NotePencil size={18} aria-hidden="true" />
            {t('Write')}
          </NavLink>
          {status === 'signed-in' && (
            <>
              <ButtonLink to="/questions/ask" size="sm" className="mx-1 hidden lg:inline-flex">
                {t('Ask')}
              </ButtonLink>
              <NotificationBell />
              <Suspense fallback={placeholder('')}>
                <AccountMenu />
              </Suspense>
            </>
          )}
          {status === 'anonymous' && (
            <>
              <Link to="/sign-in" className="hidden h-11 items-center px-2.5 text-sm whitespace-nowrap text-muted-foreground hover:text-foreground lg:flex">
                {t('Sign in')}
              </Link>
              <ButtonLink to="/sign-up" size="sm" className="ml-1 hidden sm:inline-flex">
                {t('Get started')}
              </ButtonLink>
            </>
          )}
          <Suspense fallback={placeholder('lg:hidden')}>
            <MobileMenu signedIn={status === 'signed-in'} anonymous={status === 'anonymous'} />
          </Suspense>
        </nav>
      </div>
    </header>
  )
}
