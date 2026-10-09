import { useT } from '../lib/i18n'
import { BookmarksSimple, GearSix, NotePencil, SignOut } from '@phosphor-icons/react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../features/auth/session'
import { Avatar } from '../ui/Avatar'
import { LanguageSwitch } from './Footer'

/** The signed-in reader's avatar in the top bar; opens a small panel with who is signed in and Sign out. */
export function AccountMenu() {
  const t = useT()
  const { user, signOut } = useSession()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const root = useRef<HTMLDivElement>(null)
  const name = user?.name || t('Your account')

  useEffect(() => {
    if (!open) return
    function close(event: MouseEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !root.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  async function leave() {
    setOpen(false)
    await signOut()
    navigate('/')
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t('Account')}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-full"
      >
        <Avatar name={name} size={32} />
      </button>
      {open && (
        <div id={panelId} className="absolute right-0 mt-1 w-64 rounded-lg border border-rule bg-paper py-2 shadow-lg">
          <div className="border-b border-rule px-4 pt-1 pb-3">
            <p className="truncate font-medium">{name}</p>
            {user?.email && <p className="truncate text-sm text-ink-muted">{user.email}</p>}
          </div>
          {user?.authorId != null && (
            <Link to="/me/stories" onClick={() => setOpen(false)} className="mt-1 flex h-11 items-center gap-2 px-4 text-sm text-ink-muted hover:bg-field hover:text-ink">
              <NotePencil size={18} aria-hidden="true" />
              {t('Your stories')}
            </Link>
          )}
          <Link to="/library" onClick={() => setOpen(false)} className="flex h-11 items-center gap-2 px-4 text-sm text-ink-muted hover:bg-field hover:text-ink">
            <BookmarksSimple size={18} aria-hidden="true" />
            {t('Library')}
          </Link>
          <Link to="/settings" onClick={() => setOpen(false)} className="flex h-11 items-center gap-2 px-4 text-sm text-ink-muted hover:bg-field hover:text-ink">
            <GearSix size={18} aria-hidden="true" />
            {t('Settings')}
          </Link>
          <button type="button" onClick={leave} className="flex h-11 w-full items-center gap-2 px-4 text-left text-sm text-ink-muted hover:bg-field hover:text-ink">
            <SignOut size={18} aria-hidden="true" />
            {t('Sign out')}
          </button>
          <div className="border-t border-rule px-4 pt-1">
            <LanguageSwitch className="flex h-11 items-center text-sm text-ink-muted hover:text-ink" />
          </div>
        </div>
      )}
    </div>
  )
}
