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

const SECTIONS = [
  { to: '/admin/experts', label: 'Expert applications' },
  { to: '/admin/categories', label: 'Categories' },
]

/**
 * The frame of every admin page: its sections, and the admin sign-in for anyone who isn't staff. Staff see every
 * section; the backend checks the exact privilege (EXPERT_REVIEW, CONTENT_MODERATE) and its 403 is shown as written.
 */
export function AdminPage({ title, children }: { title: string; children: ReactNode }) {
  const { status, user } = useSession()
  return (
    <section className="mx-auto max-w-(--container-feed) px-4 pt-10 pb-20 sm:px-6">
      <title>{`${title} – Admin – AgroTrends`}</title>
      <p className="text-sm text-muted-foreground">Admin</p>
      <h1 className="mt-1 text-2xl sm:text-3xl">{title}</h1>
      {status === 'restoring' ? (
        <Spinner />
      ) : isAdmin(user) ? (
        <>
          <nav aria-label="Admin sections" className="mt-6 flex gap-6 overflow-x-auto border-b border-border">
            {SECTIONS.map((section) => (
              <NavLink
                key={section.to}
                to={section.to}
                className={({ isActive }) =>
                  cn('-mb-px flex h-11 items-center border-b-2 text-sm whitespace-nowrap', isActive ? 'border-primary font-medium text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')
                }
              >
                {section.label}
              </NavLink>
            ))}
          </nav>
          {children}
        </>
      ) : (
        <AdminSignIn signedInAsReader={status === 'signed-in'} />
      )}
    </section>
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
    signIn.mutate({ email: email.trim(), password }, { onSuccess: (tokens) => session.signedIn(tokens) })
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
