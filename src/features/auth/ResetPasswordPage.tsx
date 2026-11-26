import { useT } from '../../lib/i18n'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useResetPassword } from '../../api/auth'
import { errorMessage } from '../../api/errors'
import { passwordProblem } from '../../lib/auth'
import { useFormValidation } from '../../ui/FormValidation'
import { Button } from '../../ui/Button'
import { PasswordField } from '../../ui/PasswordField'
import { AuthPage, FormError } from './AuthPage'

export const PASSWORD_RESET_NOTICE = 'Password changed. Sign in with your new password.'

/** Opened from the reset e-mail: `/reset-password?token=...`. */
export function ResetPasswordPage() {
  const t = useT()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const reset = useResetPassword()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const { errors, setErrors, reportErrors, fieldId, summary } = useFormValidation<'password' | 'confirm'>()

  if (!token) {
    return (
      <AuthPage title={t('This link isn\'t complete')} intro={t('Open the link from the e-mail again, or ask for a new one.')}>
        <Link to="/forgot-password" className="text-sm font-medium text-paddy underline-offset-4 hover:underline">
          {t('Send a new reset link')}
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
    if (reportErrors(found)) return
    reset.mutate(
      { token, newPassword: password },
      { onSuccess: () => navigate('/sign-in', { replace: true, state: { notice: PASSWORD_RESET_NOTICE } }) },
    )
  }

  return (
    <AuthPage title={t('Set a new password')} intro={t('Choose a password you don\'t use anywhere else.')}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        {summary}
        <PasswordField
          label={t('New password')}
          autoComplete="new-password"
          hint="8 to 16 characters, with a capital letter, a number and a symbol."
          value={password}
          onChange={(e) => {
            const value = e.target.value
            setPassword(value)
            setErrors((current) => ({
              password: current.password ? passwordProblem(value) ?? undefined : undefined,
              confirm: current.confirm && confirm !== value ? "The passwords don't match." : undefined,
            }))
            reset.reset()
          }}
          id={fieldId('password')} error={errors.password}
        />
        <PasswordField
          label={t('Repeat new password')}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => {
            const value = e.target.value
            setConfirm(value)
            setErrors((current) => ({ ...current, confirm: current.confirm && value !== password ? "The passwords don't match." : undefined }))
            reset.reset()
          }}
          id={fieldId('confirm')} error={errors.confirm}
        />
        <FormError message={reset.isError ? errorMessage(reset.error) : null} />
        {reset.isError && (
          <Link to="/forgot-password" className="text-sm font-medium text-paddy underline-offset-4 hover:underline">
            {t('Send a new reset link')}
          </Link>
        )}
        <Button type="submit" loading={reset.isPending} pendingLabel={t('Resetting password…')} className="mt-1">
          {t('Set new password')}
        </Button>
      </form>
    </AuthPage>
  )
}
