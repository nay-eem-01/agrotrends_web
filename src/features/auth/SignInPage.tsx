import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useSignIn } from '../../api/auth'
import { errorMessage } from '../../api/errors'
import { isEmail, safeNext } from '../../lib/auth'
import { Button } from '../../ui/Button'
import { TextField } from '../../ui/TextField'
import { AuthPage, FormError } from './AuthPage'
import { useSession } from './session'

export function SignInPage() {
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const navigate = useNavigate()
  const session = useSession()
  const signIn = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  if (session.status === 'signed-in') return <Navigate to={next} replace />

  function submit(event: FormEvent) {
    event.preventDefault()
    const found = {
      email: isEmail(email) ? undefined : 'Enter your e-mail address.',
      password: password ? undefined : 'Enter your password.',
    }
    setErrors(found)
    if (found.email || found.password) return
    signIn.mutate(
      { email: email.trim(), password },
      {
        onSuccess: (tokens) => {
          session.signedIn(tokens)
          navigate(next, { replace: true })
        },
      },
    )
  }

  const signUpLink = next === '/' ? '/sign-up' : `/sign-up?next=${encodeURIComponent(next)}`

  return (
    <AuthPage title="Sign in" intro="Welcome back. Sign in to write, clap, follow and ask the advisor.">
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <TextField label="E-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <FormError message={signIn.isError ? errorMessage(signIn.error) : null} />
        <Button type="submit" loading={signIn.isPending} className="mt-1">
          Sign in
        </Button>
      </form>
      <p className="mt-8 text-sm text-ink-muted">
        New to AgroTrends?{' '}
        <Link to={signUpLink} className="font-medium text-paddy underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthPage>
  )
}
