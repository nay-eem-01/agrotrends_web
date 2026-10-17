import { useState, type FormEvent, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from 'cn'
import { isAdmin, useAdminSignIn } from '../../api/auth'
import { errorMessage } from '../../api/errors'
import { isEmail } from '../../lib/auth'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { TextField } from '../../ui/TextField'
import { FormError } from '../auth/AuthPage'
import { useSession } from '../auth/session'

// Every staff member sees every section; the backend checks the exact privilege and its 403 is shown as written.
const SECTIONS: { to: string; label: string; end?: boolean }[] = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/experts', label: 'Expert applications' },
  { to: '/admin/roles', label: 'Roles' },
  { to: '/admin/categories', label: 'Categories' },
]

/**
 * The frame of every admin page: its sections, and the admin sign-in for anyone who isn't staff. Staff see every
 * section; the backend checks the exact privilege (EXPERT_REVIEW, CONTENT_MODERATE) and its 403 is shown as written.
 */
export function AdminPage({ title, children }: { title: string; children: ReactNode }) {
  const { status, user } = useSession()
  return (
    <div className="mx-auto max-w-(--container-page) px-4 pt-8 pb-20 sm:px-8 sm:pt-10">
      <title>{`${title} – Admin – AgroTrends`}</title>
      {status === 'restoring' ? (
        <Spinner />
      ) : isAdmin(user) ? (
        // Sections in a rail on wide screens, as scrolling tabs on phones; the page beside them.
        <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
          <nav aria-label="Admin sections" className="-mx-4 overflow-x-auto border-b border-border px-4 lg:mx-0 lg:overflow-visible lg:border-0 lg:px-0">
            <p className="hidden px-3 pb-2 text-xs font-semibold text-muted-foreground lg:block">Admin</p>
            <ul className="flex gap-5 lg:sticky lg:top-24 lg:flex-col lg:gap-0.5">
              {SECTIONS.map((section) => (
                <li key={section.to}>
                  <NavLink
                    to={section.to}
                    end={section.end}
                    className={({ isActive }) =>
                      cn(
                        '-mb-px flex h-11 items-center border-b-2 text-sm whitespace-nowrap transition-colors duration-150 lg:mb-0 lg:h-10 lg:rounded-lg lg:border-b-0 lg:px-3',
                        isActive ? 'border-primary font-semibold text-foreground lg:bg-secondary lg:text-primary' : 'border-transparent text-muted-foreground hover:text-foreground lg:hover:bg-muted',
                      )
                    }
                  >
                    {section.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <section className="min-w-0 pt-6 lg:pt-0">
            <h1 className="text-2xl sm:text-[2rem]">{title}</h1>
            {children}
          </section>
        </div>
      ) : (
        <section className="mx-auto max-w-md">
          <p className="text-sm text-muted-foreground">Admin</p>
          <h1 className="mt-1 text-2xl sm:text-[2rem]">{title}</h1>
          <AdminSignIn signedInAsReader={status === 'signed-in'} />
        </section>
      )}
    </div>
  )
}

function AdminSignIn({ signedInAsReader }: { signedInAsReader: boolean }) {
  const session = useSession()
  const signIn = useAdminSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!isEmail(email) || !password) {
      setError('Enter your admin e-mail and password.')
      return
    }
    setError(undefined)
    signIn.mutate({ identifier: email.trim(), password }, { onSuccess: (tokens) => session.signedIn(tokens) })
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 flex max-w-md flex-col gap-5">
      <p className="text-muted-foreground">
        {signedInAsReader ? 'Your account has no admin access. Sign in with an admin account.' : 'Sign in with an admin account.'}
      </p>
      <TextField label="Admin e-mail" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <FormError message={error ?? (signIn.isError ? errorMessage(signIn.error) : null)} />
      <Button type="submit" loading={signIn.isPending} className="self-start">
        Sign in as admin
      </Button>
    </form>
  )
}
