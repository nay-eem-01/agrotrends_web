import { useT } from '../lib/i18n'
import { List, MagnifyingGlass, NotePencil, Plus } from '@phosphor-icons/react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from 'cn'
import { useSession } from '../features/auth/session'
import { ButtonLink } from '../ui/Button'
import { NotificationBell } from './NotificationBell'
import { Logo } from './Logo'
import { useSidebar } from './AppSidebar'

// The menus (dialog and menu code) load just after the page; a same-size space holds their place meanwhile.
const AccountMenu = lazy(() => import('./AccountMenu').then((m) => ({ default: m.AccountMenu })))
const MobileMenu = lazy(() => import('./MobileMenu').then((m) => ({ default: m.MobileMenu })))
const SearchDialog = lazy(() => import('./SearchDialog').then((m) => ({ default: m.SearchDialog })))
const placeholder = (className: string) => <span aria-hidden="true" className={cn('size-11 shrink-0', className)} />

export function TopBar() {
  const t = useT()
  const { status } = useSession()
  const sidebar = useSidebar()
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
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:pl-4">
        {/* The sections live in the sidebar (layout/AppSidebar); this opens it or hides it to icons. */}
        <button
          type="button"
          onClick={sidebar.toggle}
          aria-expanded={sidebar.open}
          aria-controls="app-sidebar"
          aria-label={sidebar.open ? t('Hide navigation') : t('Show navigation')}
          className="hidden size-10 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-surface hover:text-foreground lg:flex"
        >
          <List size={22} aria-hidden="true" />
        </button>
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
          <ButtonLink to="/write" variant="secondary" size="sm" className="mx-1 hidden lg:inline-flex">
            <NotePencil size={16} aria-hidden="true" />
            {t('Write')}
          </ButtonLink>
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
