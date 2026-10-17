import { ChatCircleText, Compass, Newspaper, Plus, Sparkle } from '@phosphor-icons/react'
import { NavLink } from 'react-router-dom'
import { cn } from 'cn'
import { useT } from '../lib/i18n'

/**
 * Phones: the four sections and Ask, always under the thumb. The current one is green with a filled icon and
 * `aria-current`, so it isn't told by colour alone. Hidden from 768px, where the top bar has the room.
 */
export function BottomNav() {
  const t = useT()
  const items = [
    { to: '/', end: true, label: t('Discover'), icon: Compass },
    { to: '/questions', label: t('Questions'), icon: ChatCircleText },
    { to: '/stories', label: t('Stories'), icon: Newspaper },
    { to: '/advisor', label: t('AI advisor'), icon: Sparkle },
  ]
  const tab = ({ to, end, label, icon: Icon }: (typeof items)[number]) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      className={({ isActive }) =>
        cn('flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[0.6875rem] leading-tight transition-colors duration-150', isActive ? 'font-semibold text-primary' : 'text-muted-foreground')
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={22} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
          <span className="max-w-full truncate px-0.5">{label}</span>
        </>
      )}
    </NavLink>
  )

  return (
    <nav aria-label={t('Sections')} className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch px-1">
        {items.slice(0, 2).map(tab)}
        <div className="flex flex-1 items-center justify-center">
          <NavLink
            to="/questions/ask"
            aria-label={t('Ask a question')}
            className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-[background-color,transform] duration-150 ease-(--ease-out) hover:bg-primary-active active:scale-[0.94]"
          >
            <Plus size={24} weight="bold" aria-hidden="true" />
          </NavLink>
        </div>
        {items.slice(2).map(tab)}
      </div>
    </nav>
  )
}
