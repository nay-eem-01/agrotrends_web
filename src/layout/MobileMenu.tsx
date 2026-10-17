import { useT } from '../lib/i18n'
import { ChatCircleText, Compass, List, MagnifyingGlass, Newspaper, NotePencil, Plus, Sparkle } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { cn } from 'cn'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { buttonClass } from '../ui/Button'
import { LanguageSwitch, ThemeSwitch } from './Footer'

/**
 * Below 1024px the bar has no room for the destinations, so a menu button opens them in a sheet: every page the
 * desktop bar links to, plus asking, signing in, language and theme.
 */
export function MobileMenu({ signedIn, anonymous }: { signedIn: boolean; anonymous: boolean }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const row = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex h-12 items-center gap-3 rounded-md px-3 text-base transition-colors duration-150',
      isActive ? 'bg-secondary font-semibold text-primary' : 'text-foreground hover:bg-muted',
    )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground lg:hidden">
        <List size={24} aria-hidden="true" />
        <span className="sr-only">{t('Menu')}</span>
      </SheetTrigger>
      <SheetContent side="right" closeLabel={t('Close')} className="w-[min(20rem,85vw)] gap-0 p-4 pt-5">
        <SheetTitle className="px-3 font-sans text-base font-semibold">{t('Menu')}</SheetTitle>
        <nav aria-label={t('Menu')} className="mt-6 flex flex-col gap-1">
          <NavLink to="/" end onClick={close} className={row}>
            <Compass size={20} aria-hidden="true" />
            {t('Discover')}
          </NavLink>
          <NavLink to="/questions" onClick={close} className={row}>
            <ChatCircleText size={20} aria-hidden="true" />
            {t('Questions')}
          </NavLink>
          <NavLink to="/stories" onClick={close} className={row}>
            <Newspaper size={20} aria-hidden="true" />
            {t('Stories')}
          </NavLink>
          <NavLink to="/advisor" onClick={close} className={row}>
            <Sparkle size={20} aria-hidden="true" />
            {t('AI advisor')}
          </NavLink>
          <NavLink to="/write" onClick={close} className={row}>
            <NotePencil size={20} aria-hidden="true" />
            {t('Write')}
          </NavLink>
          <NavLink to="/search" onClick={close} className={row}>
            <MagnifyingGlass size={20} aria-hidden="true" />
            {t('Search')}
          </NavLink>
        </nav>
        <div className="mt-6 flex flex-col gap-2 border-t border-border pt-6">
          {signedIn && (
            <Link to="/questions/ask" onClick={close} className={buttonClass('primary', 'md', 'w-full')}>
              <Plus size={18} aria-hidden="true" />
              {t('Ask a question')}
            </Link>
          )}
          {anonymous && (
            <>
              <Link to="/sign-up" onClick={close} className={buttonClass('primary', 'md', 'w-full')}>
                {t('Get started')}
              </Link>
              <Link to="/sign-in" onClick={close} className={buttonClass('secondary', 'md', 'w-full')}>
                {t('Sign in')}
              </Link>
            </>
          )}
        </div>
        <div className="mt-auto flex flex-col border-t border-border pt-2">
          <LanguageSwitch className="flex h-11 items-center px-3 text-left text-sm text-muted-foreground hover:text-foreground" />
          <ThemeSwitch className="flex h-11 items-center px-3 text-left text-sm text-muted-foreground hover:text-foreground" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
