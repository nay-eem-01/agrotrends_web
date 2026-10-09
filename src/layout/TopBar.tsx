import { MagnifyingGlass, NotePencil } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../features/auth/session'
import { ButtonLink } from '../ui/Button'
import { AccountMenu } from './AccountMenu'
import { Logo } from './Logo'

export function TopBar() {
  const navigate = useNavigate()
  const { status } = useSession()
  const [query, setQuery] = useState('')

  function search(event: FormEvent) {
    event.preventDefault()
    const q = query.trim()
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-(--container-page) items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Logo />
        <search className="hidden min-w-0 flex-1 sm:block sm:max-w-60">
          <form onSubmit={search}>
            <label className="flex h-10 items-center gap-2 rounded-full bg-field px-3 text-ink-muted focus-within:ring-2 focus-within:ring-paddy">
              <MagnifyingGlass size={18} aria-hidden="true" />
              <span className="sr-only">Search stories</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
              />
            </label>
          </form>
        </search>
        <nav aria-label="Main" className="ml-auto flex items-center gap-0 sm:gap-3">
          <Link to="/search" className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted hover:text-ink sm:hidden" aria-label="Search">
            <MagnifyingGlass size={22} />
          </Link>
          <Link to="/questions" className="hidden h-11 items-center px-2 text-sm text-ink-muted hover:text-ink md:flex">
            Questions
          </Link>
          <Link to="/advisor" className="hidden h-11 items-center px-2 text-sm text-ink-muted hover:text-ink md:flex">
            Advisor
          </Link>
          <Link to="/write" className="hidden h-11 items-center gap-1.5 px-2 text-sm text-ink-muted hover:text-ink md:flex">
            <NotePencil size={20} aria-hidden="true" />
            Write
          </Link>
          {status === 'signed-in' && (
            <>
              <Link to="/write" className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted hover:text-ink md:hidden" aria-label="Write">
                <NotePencil size={22} />
              </Link>
              <AccountMenu />
            </>
          )}
          {status === 'anonymous' && (
            <>
              <Link to="/sign-in" className="hidden h-11 items-center px-2 text-sm whitespace-nowrap text-ink-muted hover:text-ink sm:flex">
                Sign in
              </Link>
              <ButtonLink to="/sign-up" size="sm">
                Get started
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
