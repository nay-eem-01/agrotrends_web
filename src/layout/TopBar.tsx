import { useT } from '../lib/i18n'
import { ArrowLeft, List, MagnifyingGlass, NotePencil, Plus } from '@phosphor-icons/react'
import { lazy, Suspense, useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
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

export function TopBar({ focused = false }: { focused?: boolean }) {
  const t = useT()
  const { status } = useSession()
  const sidebar = useSidebar()
  const [searching, setSearching] = useState(false)
  const inline = useRef<HTMLInputElement>(null)
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const current = pathname === '/search' ? (params.get('q') ?? '') : ''

  // Ctrl/⌘+K goes to the search from anywhere: the field in the bar when it is shown, the dialog otherwise.
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        if (inline.current?.offsetParent) inline.current.focus()
        else setSearching(true)
      }
    }
    document.addEventListener('keydown', shortcut)
    return () => document.removeEventListener('keydown', shortcut)
  }, [])

  // Focused pages (signing in or up) keep only the logo and a way back.
  if (focused)
    return (
      <header className="sticky top-0 z-20 bg-background">
        <div className="mx-auto flex h-16 max-w-(--container-page) items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link to="/" className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm text-muted-foreground transition-colors duration-150 hover:bg-surface hover:text-foreground">
            <ArrowLeft size={16} aria-hidden="true" />
            {t('Back to AgroTrends')}
          </Link>
        </div>
      </header>
    )

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
        {/* Wide screens: the search is a field in the bar itself; it keeps the words on the results page. */}
        <InlineSearch key={current} initial={current} field={inline} />
        <nav aria-label={t('Main')} className="ml-auto flex items-center gap-0 md:gap-1">
          <button
            type="button"
            onClick={() => setSearching(true)}
            aria-label={t('Search')}
            aria-keyshortcuts="Control+K Meta+K"
            className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground max-[379px]:hidden lg:hidden"
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

/** The bar's search field: Enter searches questions, stories and topics on `/search`; a blank search stays put. */
function InlineSearch({ initial, field }: { initial: string; field: RefObject<HTMLInputElement | null> }) {
  const t = useT()
  const navigate = useNavigate()
  const [query, setQuery] = useState(initial)

  function submit(event: FormEvent) {
    event.preventDefault()
    const q = query.trim()
    if (!q) return
    field.current?.blur()
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <search className="hidden min-w-0 flex-1 lg:block lg:max-w-sm xl:max-w-md">
      <form
        onSubmit={submit}
        className="flex h-10 items-center gap-2 rounded-full bg-surface pr-2 pl-4 text-sm text-muted-foreground transition-[background-color,box-shadow] duration-150 focus-within:bg-background focus-within:ring-2 focus-within:ring-ring/40 hover:bg-secondary focus-within:hover:bg-background"
      >
        <MagnifyingGlass size={18} aria-hidden="true" className="shrink-0" />
        <input
          ref={field}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') event.currentTarget.blur()
          }}
          aria-label={t('Search AgroTrends')}
          aria-keyshortcuts="Control+K Meta+K"
          placeholder={t('Search questions, crops, pests')}
          enterKeyHint="search"
          className="h-full min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        <kbd aria-hidden="true" className="hidden rounded-full bg-background px-2 py-0.5 font-sans text-xs xl:inline">
          Ctrl K
        </kbd>
      </form>
    </search>
  )
}
