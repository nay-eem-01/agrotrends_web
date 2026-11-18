import { CheckCircle } from '@phosphor-icons/react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fetchMe, useResendPhoneCode, useVerifyPhone } from '../../api/auth'
import { errorMessage } from '../../api/errors'
import { safeNext, splitMobile } from '../../lib/auth'
import { useT } from '../../lib/i18n'
import { Button, ButtonLink } from '../../ui/Button'
import { TextField } from '../../ui/TextField'
import { AuthPage, FormError } from './AuthPage'
import { useSession } from './session'

/** How long Resend waits after a send; the backend allows three codes an hour per number. */
const RESEND_AFTER_S = 60

/**
 * `/verify-phone?next=`: the 6-digit code texted at sign-up or after a number change. Confirming opens writes;
 * then the reader goes on to `next`.
 */
export function VerifyPhonePage() {
  const t = useT()
  const navigate = useNavigate()
  const next = safeNext(useSearchParams()[0].get('next'))
  const { user, updateUser } = useSession()
  const verify = useVerifyPhone()
  const [code, setCode] = useState('')
  const [problem, setProblem] = useState<string>()
  const phone = user?.mobileNumber ?? ''

  if (!phone) {
    return (
      <AuthPage title={t('Confirm your phone number')} intro={t('Your account has no phone number yet. Add one in settings and we will text you a code.')}>
        <ButtonLink to="/settings">{t('Open settings')}</ButtonLink>
      </AuthPage>
    )
  }

  if (user?.phoneVerified || verify.isSuccess) {
    return (
      <AuthPage title={t('Your phone number is confirmed')} intro={t('You can ask, answer, vote and publish now.')}>
        <p className="mb-6 flex items-center gap-2 text-sm font-medium text-success">
          <CheckCircle size={18} weight="fill" aria-hidden="true" />
          {phone}
        </p>
        <Button onClick={() => navigate(next, { replace: true })}>{t('Continue')}</Button>
      </AuthPage>
    )
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const digits = code.replace(/\D/g, '')
    if (digits.length !== 6) return setProblem(t('Enter the 6-digit code.'))
    setProblem(undefined)
    verify.mutate(
      { ...splitMobile(phone), code: digits },
      // Pick up phoneVerified so the banner and the write checks follow.
      { onSuccess: () => void fetchMe().then(updateUser, () => updateUser({ phoneVerified: true })) },
    )
  }

  return (
    <AuthPage title={t('Confirm your phone number')} intro={t('We texted a 6-digit code to {phone}. It works for 10 minutes.', { phone })}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <TextField
          label={t('Code')}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
          error={problem}
          className="max-w-48"
        />
        <FormError message={verify.isError ? errorMessage(verify.error) : null} />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={verify.isPending}>
            {t('Confirm')}
          </Button>
          <ResendCode phone={phone} />
        </div>
      </form>
    </AuthPage>
  )
}

/** "Send a new code", then a short wait before it can be pressed again. Never says whether the number exists. */
export function ResendCode({ phone }: { phone: string }) {
  const t = useT()
  const resend = useResendPhoneCode()
  const [wait, setWait] = useState(0)

  useEffect(() => {
    if (wait <= 0) return
    const timer = setTimeout(() => setWait((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [wait])

  return (
    <span className="flex flex-wrap items-center gap-3">
      <Button
        variant="quiet"
        disabled={wait > 0}
        loading={resend.isPending}
        onClick={() => resend.mutate(splitMobile(phone), { onSuccess: () => setWait(RESEND_AFTER_S) })}
      >
        {wait > 0 ? t('Send a new code in {n}s', { n: wait }) : t('Send a new code')}
      </Button>
      {resend.isSuccess && <output className="text-sm text-muted-foreground">{t('If the number is registered, a new code is on its way.')}</output>}
      {resend.isError && (
        <span role="alert" className="text-sm text-destructive">
          {errorMessage(resend.error)}
        </span>
      )}
    </span>
  )
}
