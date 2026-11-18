import { useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft } from '@phosphor-icons/react'
import { Link, NavLink } from 'react-router-dom'
import { cn } from 'cn'
import { isAdmin, useAdminSignIn } from '../../api/auth'
import { errorMessage } from '../../api/errors'
import { isEmail, isPhone, signInIdentifier } from '../../lib/auth'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { TextField } from '../../ui/TextField'
import { FormError } from '../auth/AuthPage'
import { useSession } from '../auth/session'
import { ADMIN_SECTIONS } from './sections'

/**
 * The frame of every admin page: the title (with a way back on a detail page), and the admin sign-in for anyone who
 * isn't staff. From 1024px the sections are in the app sidebar's Admin group; below that they scroll as tabs here.
 */
export function AdminPage({ title, back, children }: { title: string; back?: { to: string; label: string }; children: ReactNode }) {
  const { status, user } = useSession()
  return (
    <div className="mx-auto max-w-(--container-page) px-4 pt-6 pb-20 sm:px-8 sm:pt-10">
      <title>{`${title} – Admin – AgroTrends`}</title>
      {status === 'restoring' ? (
        <Spinner />
      ) : isAdmin(user) ? (
        <>
          <nav aria-label="Admin sections" className="-mx-4 mb-6 overflow-x-auto border-b border-border px-4 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:hidden">
            <ul className="flex gap-6">
              {ADMIN_SECTIONS.map((section) => (
                <li key={section.to}>
                  <NavLink
                    to={section.to}
                    end={section.end}
                    className={({ isActive }) =>
                      cn(
                        '-mb-px flex h-11 items-center border-b-2 text-sm whitespace-nowrap transition-colors duration-150',
                        isActive ? 'border-primary font-semibold text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                      )
                    }
                  >
                    {section.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <section className="min-w-0">
            {back && (
              <Link to={back.to} className="-ml-1 mb-2 inline-flex h-11 items-center gap-1.5 rounded-full px-1 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft size={16} aria-hidden="true" />
                {back.label}
              </Link>
            )}
            <h1 className="font-serif text-[2rem] leading-tight font-medium sm:text-[2.5rem]">{title}</h1>
            {children}
          </section>
        </>
      ) : (
        <section className="mx-auto max-w-md">
          <p className="text-sm text-muted-foreground">Admin</p>
          <h1 className="mt-1 font-serif text-[2rem] leading-tight font-medium sm:text-[2.5rem]">{title}</h1>
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
    if (!(isEmail(email) || isPhone(email)) || !password) {
      setError('Enter your admin e-mail or phone number, and the password.')
      return
    }
    setError(undefined)
    signIn.mutate({ identifier: signInIdentifier(email), password }, { onSuccess: (tokens) => session.signedIn(tokens) })
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 flex max-w-md flex-col gap-5">
      <p className="text-muted-foreground">
        {signedInAsReader ? 'Your account has no admin access. Sign in with an admin account.' : 'Sign in with an admin account.'}
      </p>
      <TextField label="Admin e-mail or phone" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <FormError message={error ?? (signIn.isError ? errorMessage(signIn.error) : null)} />
      <Button type="submit" loading={signIn.isPending} className="self-start">
        Sign in as admin
      </Button>
    </form>
  )
}
