import { useT } from '../lib/i18n'
import { MagnifyingGlass, NotePencil, Plus } from '@phosphor-icons/react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { cn } from 'cn'
import { useSession } from '../features/auth/session'
import { ButtonLink } from '../ui/Button'
import { NotificationBell } from './NotificationBell'
import { Logo } from './Logo'

// The menus (dialog and menu code) load just after the page; a same-size space holds their place meanwhile.
const AccountMenu = lazy(() => import('./AccountMenu').then((m) => ({ default: m.AccountMenu })))
const MobileMenu = lazy(() => import('./MobileMenu').then((m) => ({ default: m.MobileMenu })))
const SearchDialog = lazy(() => import('./SearchDialog').then((m) => ({ default: m.SearchDialog })))
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
  const { status } = useSession()
  const [searching, setSearching] = useState(false)

  // Ctrl/⌘+K opens the search from anywhere.
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        setSearching(true)
      }
    }
    document.addEventListener('keydown', shortcut)
    return () => document.removeEventListener('keydown', shortcut)
  }, [])

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-(--container-page) items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Logo />
        {/* Wide screens: the search is a pill on the leaf wash that opens the search dialog; Ctrl/⌘+K does the same. */}
        <button
          type="button"
          onClick={() => setSearching(true)}
          aria-keyshortcuts="Control+K Meta+K"
          className="hidden h-10 w-72 items-center gap-2 rounded-full bg-surface pr-2 pl-4 text-sm text-muted-foreground transition-[background-color,color] duration-150 hover:bg-secondary hover:text-foreground xl:flex"
        >
          <MagnifyingGlass size={18} aria-hidden="true" />
          <span className="flex-1 text-left">{t('Search')}</span>
          <kbd aria-hidden="true" className="rounded-full bg-background px-2 py-0.5 font-sans text-xs">
            Ctrl K
          </kbd>
        </button>
        <nav aria-label={t('Main')} className="ml-auto flex items-center gap-0 md:gap-1">
          <button
            type="button"
            onClick={() => setSearching(true)}
            aria-label={t('Search')}
            aria-keyshortcuts="Control+K Meta+K"
            className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground max-[379px]:hidden xl:hidden"
          >
            <MagnifyingGlass size={22} aria-hidden="true" />
          </button>
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
                <Plus size={16} weight="bold" aria-hidden="true" />
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
      {searching && (
        <Suspense fallback={null}>
          <SearchDialog open={searching} onOpenChange={setSearching} />
        </Suspense>
      )}
    </header>
  )
}
