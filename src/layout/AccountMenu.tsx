import { useT } from '../lib/i18n'
import { BookmarksSimple, CaretRight, ChatCircleText, ClockCounterClockwise, GearSix, NotePencil, SealCheck, ShieldCheck, SignOut, Translate, UserCircle, X, type Icon } from '@phosphor-icons/react'
import { Drawer } from '@base-ui/react/drawer'
import { useState, useSyncExternalStore, type MouseEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { isAdmin } from '../api/auth'
import { useSession } from '../features/auth/session'
import { useMyBadges } from '../features/experts/useMyBadges'
import { useMyAuthorProfile } from '../api/authors'
import { Avatar } from '../ui/Avatar'
import { useLanguageSwitch } from './useLanguageSwitch'

const item = 'min-h-11 text-muted-foreground'
const trigger = 'flex size-11 items-center justify-center rounded-full transition-transform duration-150 ease-(--ease-out) active:scale-[0.94]'
const accountSheetMedia = '(max-width: 767px)'

function subscribeToAccountLayout(listener: () => void) {
  const media = window.matchMedia?.(accountSheetMedia)
  media?.addEventListener?.('change', listener)
  return () => media?.removeEventListener?.('change', listener)
}

function usesAccountSheet() {
  return window.matchMedia?.(accountSheetMedia).matches ?? false
}

type AccountLink = { to: string; label: string; icon: Icon }

export function AccountMenu() {
  const t = useT()
  const { user, signOut } = useSession()
  const navigate = useNavigate()
  const { nextLang, nextLabel, changeLanguage } = useLanguageSwitch()
  const mobile = useSyncExternalStore(subscribeToAccountLayout, usesAccountSheet, () => false)
  const [signingOut, setSigningOut] = useState(false)
  const name = user?.name || t('Your account')
  // The session has no photo; the author profile does, and Settings updates it in place after a change.
  const photo = useMyAuthorProfile(user != null).data?.profileImageUrl || undefined
  // The review queue is for Verified Experts; the entry stays hidden for everyone else.
  const { expertAnywhere } = useMyBadges()
  const admin = isAdmin(user)
  const profilePath = user?.id != null ? `/users/${user.id}` : undefined
  const avatar = <><span className="sr-only">{t('Account')}</span><Avatar name={name} src={photo} size={32} /></>
  const review: AccountLink = { to: '/review', icon: SealCheck, label: t('Review queue') }
  const moderation: AccountLink = { to: '/admin', icon: ShieldCheck, label: t('Admin') }

  function leave() {
    setSigningOut(true)
    // Leave a protected page before clearing the session so its guard does not send the reader to sign-in.
    navigate('/', { replace: true })
    return signOut()
  }

  if (mobile) {
    const activity: AccountLink[] = [
      ...(profilePath ? [{ to: `${profilePath}?tab=questions`, icon: ChatCircleText, label: t('Your questions') }] : []),
      { to: '/me/stories', icon: NotePencil, label: t('Stories and drafts') },
      { to: '/library', icon: BookmarksSimple, label: t('Library') },
      { to: '/advisor/history', icon: ClockCounterClockwise, label: t('Advisor history') },
      ...(expertAnywhere ? [review] : []),
      ...(admin ? [moderation] : []),
    ]
    return (
      <MobileAccountSheet
        avatar={avatar}
        profilePath={profilePath}
        name={name}
        photo={photo}
        activity={activity}
        language={{ lang: nextLang, label: nextLabel, change: changeLanguage }}
        signingOut={signingOut}
        onSignOut={leave}
      />
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={trigger}>{avatar}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 pb-3 text-sm text-foreground">
            <span className="truncate font-medium">{name}</span>
            {(user?.email || user?.mobileNumber) && <span className="truncate text-muted-foreground">{user.email || user.mobileNumber}</span>}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {profilePath && (
            <DropdownMenuItem className={item} render={<Link to={profilePath} state={{ name }} />}>
              <UserCircle size={18} aria-hidden="true" />
              {t('Your profile')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className={item} onClick={changeLanguage}>
            <Translate size={18} aria-hidden="true" />
            {t('Language')}
            <span lang={nextLang} className="ml-auto text-xs font-medium text-primary">{nextLabel}</span>
          </DropdownMenuItem>
          <DropdownMenuItem className={item} render={<Link to="/me/stories" />}>
            <NotePencil size={18} aria-hidden="true" />
            {t('Your stories')}
          </DropdownMenuItem>
          {expertAnywhere && (
            <DropdownMenuItem className={item} render={<Link to={review.to} />}>
              <SealCheck size={18} aria-hidden="true" />
              {review.label}
            </DropdownMenuItem>
          )}
          {admin && (
            <DropdownMenuItem className={item} render={<Link to={moderation.to} />}>
              <ShieldCheck size={18} aria-hidden="true" />
              {moderation.label}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className={item} render={<Link to="/library" />}>
            <BookmarksSimple size={18} aria-hidden="true" />
            {t('Library')}
          </DropdownMenuItem>
          <DropdownMenuItem className={item} render={<Link to="/settings" />}>
            <GearSix size={18} aria-hidden="true" />
            {t('Settings')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className={item} disabled={signingOut} onClick={() => void leave()}>
            <SignOut size={18} aria-hidden="true" />
            {t('Sign out')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type MobileAccountSheetProps = {
  avatar: ReactNode
  profilePath?: string
  name: string
  photo?: string
  activity: AccountLink[]
  language: { lang: string; label: string; change: () => void }
  signingOut: boolean
  onSignOut: () => Promise<void>
}

function MobileAccountSheet({ avatar, profilePath, name, photo, activity, language, signingOut, onSignOut }: MobileAccountSheetProps) {
  const t = useT()
  const [open, setOpen] = useState(false)

  function closeAfterNavigation(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button === 0 && !event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) setOpen(false)
  }

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger className={trigger}>{avatar}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-50 bg-black/55 opacity-[calc(1-var(--drawer-swipe-progress,0))] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <Drawer.Viewport className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center">
          <Drawer.Popup className="pointer-events-auto flex max-h-[calc(100dvh-1.5rem)] w-full translate-y-(--drawer-swipe-movement-y) flex-col rounded-t-2xl border-t border-border bg-popover text-popover-foreground shadow-xl outline-none transition-transform duration-250 ease-(--ease-drawer) data-ending-style:translate-y-full data-starting-style:translate-y-full data-swiping:transition-none motion-reduce:transition-none">
            <div className="shrink-0 px-5 pt-2.5">
              <div aria-hidden="true" className="mx-auto h-1 w-9 rounded-full bg-border-strong" />
              <div className="flex items-center justify-between">
                <Drawer.Title className="text-base font-semibold">{t('Account')}</Drawer.Title>
                <Drawer.Close aria-label={t('Close')} className="-mr-2 grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground">
                  <X size={20} aria-hidden="true" />
                </Drawer.Close>
              </div>
            </div>
            <Drawer.Content className="min-h-0 overflow-y-auto overscroll-contain px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {profilePath && (
                <Link to={profilePath} state={{ name }} onClick={closeAfterNavigation} className="flex min-h-15 items-center gap-3 rounded-xl bg-surface px-3 py-2 text-start hover:bg-secondary">
                  <Avatar name={name} src={photo} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{name}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{t('View public profile')}</span>
                  </span>
                  <CaretRight size={16} aria-hidden="true" className="shrink-0 text-muted-foreground" />
                </Link>
              )}
              <div className="my-2">
                {activity.map((link) => <AccountSheetLink key={link.to} onClick={closeAfterNavigation} {...link} />)}
              </div>
              <div className="border-t border-border py-2">
                <button type="button" className={sheetRow} onClick={language.change}>
                  <Translate size={19} aria-hidden="true" className="shrink-0" />
                  <span className="min-w-0 flex-1">{t('Language')}</span>
                  <span lang={language.lang} className="text-xs font-medium text-primary">{language.label}</span>
                </button>
                <AccountSheetLink onClick={closeAfterNavigation} to="/experts/apply" icon={SealCheck} label={t('Expert verification')} />
                <AccountSheetLink onClick={closeAfterNavigation} to="/settings" icon={GearSix} label={t('Settings')} />
              </div>
              <div className="border-t border-border pt-2">
                <button type="button" disabled={signingOut} onClick={() => void onSignOut()} className={`${sheetRow} text-destructive disabled:opacity-60`}>
                  <SignOut size={19} aria-hidden="true" className="shrink-0" />
                  {t(signingOut ? 'Signing out…' : 'Sign out')}
                </button>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

const sheetRow = 'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-1.5 text-start text-sm hover:bg-surface'

function AccountSheetLink({ to, label, icon: Glyph, onClick }: AccountLink & { onClick: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  return (
    <Link to={to} onClick={onClick} className={sheetRow}>
      <Glyph size={19} aria-hidden="true" className="shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">{label}</span>
      <CaretRight size={15} aria-hidden="true" className="shrink-0 text-muted-foreground" />
    </Link>
  )
}
