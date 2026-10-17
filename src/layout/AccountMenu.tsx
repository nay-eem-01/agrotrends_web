import { setLang, useLang, useT } from '../lib/i18n'
import { BookmarksSimple, GearSix, NotePencil, SealCheck, ShieldCheck, SignOut, Translate } from '@phosphor-icons/react'
import { useQueryClient } from '@tanstack/react-query'
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
import { Avatar } from '../ui/Avatar'

const item = 'min-h-11 text-muted-foreground'

/**
 * The signed-in reader's avatar in the top bar; opens a menu with who is signed in, their pages and Sign out.
 * A real menu (shadcn DropdownMenu): arrow keys move between items, Escape closes it and returns focus.
 */
export function AccountMenu() {
  const t = useT()
  const { user, signOut } = useSession()
  const navigate = useNavigate()
  const lang = useLang()
  const queryClient = useQueryClient()
  const name = user?.name || t('Your account')
  // The review queue is for Verified Experts; the entry stays hidden for everyone else.
  const { expertAnywhere } = useMyBadges()
  const nextLang = lang === 'bn' ? 'en' : 'bn'

  async function leave() {
    await signOut()
    navigate('/')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex size-11 items-center justify-center rounded-full transition-transform duration-150 ease-(--ease-out) active:scale-[0.94]">
        <span className="sr-only">{t('Account')}</span>
        <Avatar name={name} size={32} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 pb-3 text-sm text-foreground">
            <span className="truncate font-medium">{name}</span>
            {user?.email && <span className="truncate text-muted-foreground">{user.email}</span>}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className={item} render={<Link to="/me/stories" />}>
            <NotePencil size={18} aria-hidden="true" />
            {t('Your stories')}
          </DropdownMenuItem>
          {expertAnywhere && (
            <DropdownMenuItem className={item} render={<Link to="/review" />}>
              <SealCheck size={18} aria-hidden="true" />
              {t('Review queue')}
            </DropdownMenuItem>
          )}
          {isAdmin(user) && (
            <DropdownMenuItem className={item} render={<Link to="/admin" />}>
              <ShieldCheck size={18} aria-hidden="true" />
              {t('Admin')}
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
          <DropdownMenuItem
            className={item}
            lang={nextLang}
            onClick={() => {
              setLang(nextLang)
              void queryClient.invalidateQueries()
            }}
          >
            <Translate size={18} aria-hidden="true" />
            {nextLang === 'bn' ? 'বাংলা' : 'English'}
          </DropdownMenuItem>
          <DropdownMenuItem className={item} onClick={() => void leave()}>
            <SignOut size={18} aria-hidden="true" />
            {t('Sign out')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
