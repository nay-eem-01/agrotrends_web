import { CheckCircle } from '@phosphor-icons/react'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchMe, useResendVerification, verifyEmail } from '../../api/auth'
import { ApiError, errorMessage } from '../../api/errors'
import { isEmail } from '../../lib/auth'
import { useT } from '../../lib/i18n'
import { Button, ButtonLink } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { TextField } from '../../ui/TextField'
import { AuthPage, FormError } from './AuthPage'
import { ResendLink } from './confirmEmail'
import { useSession } from './session'

// The token is single-use: one request per token, even when React runs the effect twice in development.
const pending = new Map<string, Promise<null>>()
function verifyOnce(token: string) {
  if (!pending.has(token)) pending.set(token, verifyEmail(token))
  return pending.get(token)!
}

/** `/verify-email?token=`: the link the backend mails after sign-up (and after a resend). */
export function VerifyEmailPage() {
  const t = useT()
  const token = useSearchParams()[0].get('token') ?? ''
  const { status, user, updateUser } = useSession()
  const verify = useMutation({ mutationFn: verifyOnce })
  const { mutate } = verify

  useEffect(() => {
    if (token) mutate(token)
  }, [token, mutate])

  useEffect(() => {
    // Signed in on this device: pick up emailVerified so the banner goes away.
    if (verify.isSuccess && status === 'signed-in') void fetchMe().then(updateUser, () => updateUser({ emailVerified: true }))
  }, [verify.isSuccess, status, updateUser])

  if (!token || verify.isError) {
    const expired = !token || (verify.error instanceof ApiError && verify.error.status === 400)
    return (
      <AuthPage title={t('This link is invalid or has expired')} intro={t('Links work once and only for a while. Ask for a new one below.')}>
        {!expired && (
          <p role="alert" className="mb-6 text-sm text-destructive">
            {errorMessage(verify.error)}
          </p>
        )}
        {user?.email ? <ResendLink email={user.email} /> : <ResendForm />}
      </AuthPage>
    )
  }

  if (!verify.isSuccess) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Spinner label={t('Confirming your e-mail')} />
      </div>
    )
  }

  return (
    <AuthPage title={t('E-mail confirmed')} intro={t('You can now ask, answer, vote and publish.')}>
      <CheckCircle size={40} weight="fill" aria-hidden="true" className="mb-6 text-primary" />
      <ButtonLink to={status === 'signed-in' ? '/questions' : '/sign-in'}>{status === 'signed-in' ? t('Go to questions') : t('Sign in')}</ButtonLink>
    </AuthPage>
  )
}

/** Signed out: resend to the address typed here. */
function ResendForm() {
  const t = useT()
  const resend = useResendVerification()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!isEmail(email)) return setError(t('Enter your e-mail address.'))
    setError(undefined)
    resend.mutate(email.trim())
  }

  if (resend.isSuccess) {
    return <output className="text-sm text-muted-foreground">{t('If the address is registered, a new link is on its way.')}</output>
  }
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <TextField label={t('E-mail')} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
      <FormError message={resend.isError ? errorMessage(resend.error) : null} />
      <Button type="submit" loading={resend.isPending} className="self-start">
        {t('Send a new link')}
      </Button>
    </form>
  )
}
