import { BookOpen, ChatCircleText, Compass, House, NotePencil, Newspaper, Plus, Sparkle, UserCircle, type Icon } from '@phosphor-icons/react'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { cn } from 'cn'
import { useFollowedTags } from '../api/topics'
import { useSession } from '../features/auth/session'
import { useT } from '../lib/i18n'

const KEY = 'agrotrends.sidebar'

interface SidebarState {
  open: boolean
  toggle: () => void
}

const SidebarContext = createContext<SidebarState>({ open: true, toggle: () => {} })

/** Whether the sidebar is open (full) or hidden to an icon strip; the reader's choice is remembered on this device. */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(KEY) !== 'closed'
    } catch {
      return true
    }
  })
  const toggle = useCallback(() => {
    setOpen((current) => {
      try {
        localStorage.setItem(KEY, current ? 'closed' : 'open')
      } catch {
        // Kept for this visit only.
      }
      return !current
    })
  }, [])
  const value = useMemo(() => ({ open, toggle }), [open, toggle])
  return <SidebarContext value={value}>{children}</SidebarContext>
}

export function useSidebar() {
  return useContext(SidebarContext)
}

/**
 * The app's navigation from 1024px, on every page: the sections, then (signed in) your topics, reading list and
 * stories. Hidden, it keeps an icon strip, so the sections are one click away on reading and writing pages too; the
 * top bar's menu button opens and hides it. Below 1024px the menu sheet and the phone tab bar take over.
 */
export function AppSidebar() {
  const t = useT()
  const { open } = useSidebar()
  const { status, user } = useSession()
  const signedIn = status === 'signed-in'
  const followed = useFollowedTags(signedIn)
  const sections: { to: string; end?: boolean; label: string; icon: Icon }[] = [
    { to: '/', end: true, label: signedIn ? t('Home') : t('Discover'), icon: signedIn ? House : Compass },
    { to: '/questions', label: t('Questions'), icon: ChatCircleText },
    { to: '/stories', label: t('Stories'), icon: Newspaper },
    { to: '/advisor', label: t('AI advisor'), icon: Sparkle },
  ]
  const yours: { to: string; label: string; icon: Icon }[] = signedIn
    ? [
        ...(user?.id != null ? [{ to: `/users/${user.id}`, label: t('Your profile'), icon: UserCircle }] : []),
        { to: '/library', label: t('Reading list'), icon: BookOpen },
        { to: '/me/stories', label: t('Your stories'), icon: NotePencil },
      ]
    : []
  const tags = followed.data ?? []

  return (
    <aside
      id="app-sidebar"
      aria-label={t('Navigation')}
      className={cn(
        'sticky top-16 hidden h-[calc(100dvh-4rem)] shrink-0 overflow-y-auto border-r border-border py-5 transition-[width] duration-200 ease-(--ease-out) [scrollbar-width:thin] lg:block motion-reduce:transition-none',
        open ? 'w-60 px-3' : 'w-[4.5rem] px-2',
      )}
    >
      <nav className="flex flex-col gap-0.5 text-sm">
        {sections.map((item) => (
          <Item key={item.to} {...item} open={open} />
        ))}
        {yours.length > 0 && <hr className="my-3 border-border" />}
        {yours.map((item) => (
          <Item key={item.to} {...item} open={open} />
        ))}
        {signedIn && open && (
          <>
            <h2 className="mt-5 mb-1 px-3 font-sans text-xs font-semibold text-muted-foreground">{t('Your topics')}</h2>
            {tags.slice(0, 8).map((tag) => (
              <NavLink
                key={tag}
                to={`/tags/${encodeURIComponent(tag)}`}
                className={({ isActive }) => cn('flex h-9 items-center gap-3 rounded-full px-3 hover:bg-surface', isActive && 'bg-surface font-semibold text-primary')}
              >
                <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
                <span className="truncate">{tag}</span>
              </NavLink>
            ))}
            <Link to="/topics" className="flex h-9 items-center gap-3 rounded-full px-3 text-muted-foreground hover:bg-surface hover:text-foreground">
              <Plus size={14} aria-hidden="true" />
              {t('Follow topics')}
            </Link>
          </>
        )}
      </nav>
    </aside>
  )
}

function Item({ to, end, label, icon: Icon, open }: { to: string; end?: boolean; label: string; icon: Icon; open: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={open ? undefined : label}
      className={({ isActive }) =>
        cn(
          'flex h-10 items-center gap-3 rounded-full font-medium transition-colors duration-150',
          open ? 'px-3' : 'justify-center',
          isActive ? 'bg-surface text-primary' : 'text-foreground hover:bg-surface',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={20} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" className="shrink-0" />
          <span className={open ? 'truncate' : 'sr-only'}>{label}</span>
        </>
      )}
    </NavLink>
  )
}
