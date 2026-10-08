import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useForgotPassword } from '../../api/auth'
import { errorMessage } from '../../api/errors'
import { isEmail } from '../../lib/auth'
import { Button } from '../../ui/Button'
import { TextField } from '../../ui/TextField'
import { AuthPage, FormError } from './AuthPage'

export function ForgotPasswordPage() {
  const forgot = useForgotPassword()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!isEmail(email)) {
      setError('Enter your e-mail address.')
      return
    }
    setError(undefined)
    forgot.mutate(email.trim())
  }

  if (forgot.isSuccess) {
    return (
      <AuthPage title="Check your e-mail" intro="If an account uses that address, we've sent it a link to set a new password.">
        <p className="text-sm text-ink-muted">
          The link works once and expires soon. Nothing arrived? Check spam, or{' '}
          <button type="button" onClick={() => forgot.reset()} className="font-medium text-paddy underline-offset-4 hover:underline">
            try another address
          </button>
          .
        </p>
        <Link to="/sign-in" className="mt-8 inline-block text-sm font-medium text-paddy underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </AuthPage>
    )
  }

  return (
    <AuthPage title="Forgot your password?" intro="Enter the e-mail you signed up with and we'll send you a link to set a new one.">
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <TextField label="E-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
        <FormError message={forgot.isError ? errorMessage(forgot.error) : null} />
        <Button type="submit" loading={forgot.isPending} className="mt-1">
          Send reset link
        </Button>
      </form>
      <Link to="/sign-in" className="mt-8 inline-block text-sm font-medium text-paddy underline-offset-4 hover:underline">
        Back to sign in
      </Link>
    </AuthPage>
  )
}
