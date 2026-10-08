import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useResetPassword } from '../../api/auth'
import { errorMessage } from '../../api/errors'
import { passwordProblem } from '../../lib/auth'
import { Button } from '../../ui/Button'
import { TextField } from '../../ui/TextField'
import { AuthPage, FormError } from './AuthPage'

export const PASSWORD_RESET_NOTICE = 'Password changed. Sign in with your new password.'

/** Opened from the reset e-mail: `/reset-password?token=...`. */
export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const reset = useResetPassword()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({})

  if (!token) {
    return (
      <AuthPage title="This link isn't complete" intro="Open the link from the e-mail again, or ask for a new one.">
        <Link to="/forgot-password" className="text-sm font-medium text-paddy underline-offset-4 hover:underline">
          Send a new reset link
        </Link>
      </AuthPage>
    )
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const found = {
      password: passwordProblem(password) ?? undefined,
      confirm: confirm === password ? undefined : "The passwords don't match.",
    }
    setErrors(found)
    if (found.password || found.confirm) return
    reset.mutate(
      { token, newPassword: password },
      { onSuccess: () => navigate('/sign-in', { replace: true, state: { notice: PASSWORD_RESET_NOTICE } }) },
    )
  }

  return (
    <AuthPage title="Set a new password" intro="Choose a password you don't use anywhere else.">
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="8 to 16 characters, with a capital letter, a number and a symbol."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <TextField
          label="Repeat new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
        <FormError message={reset.isError ? errorMessage(reset.error) : null} />
        {reset.isError && (
          <Link to="/forgot-password" className="text-sm font-medium text-paddy underline-offset-4 hover:underline">
            Send a new reset link
          </Link>
        )}
        <Button type="submit" loading={reset.isPending} className="mt-1">
          Set new password
        </Button>
      </form>
    </AuthPage>
  )
}
