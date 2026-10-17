import { useT } from '../../lib/i18n'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from 'cn'
import { useForgotPassword, useForgotPasswordByPhone, useResetPasswordByPhone } from '../../api/auth'
import { errorMessage } from '../../api/errors'
import { compactPhone, isEmail, passwordProblem } from '../../lib/auth'
import { Button } from '../../ui/Button'
import { TextField } from '../../ui/TextField'
import { AuthPage, FormError } from './AuthPage'
import { PASSWORD_RESET_NOTICE } from './ResetPasswordPage'

/** `/forgot-password?by=phone`: a reset link by e-mail, or a code by SMS for accounts that signed up with a phone. */
export function ForgotPasswordPage() {
  const byPhone = useSearchParams()[0].get('by') === 'phone'
  return byPhone ? <ByPhone /> : <ByEmail />
}

/** E-mail | Phone, as links so each way has its own URL. */
function Method({ phone }: { phone: boolean }) {
  const t = useT()
  const tab = (current: boolean) =>
    cn('flex h-9 flex-1 items-center justify-center rounded-md px-3.5 text-sm transition-colors duration-150', current ? 'bg-card font-semibold text-primary shadow-xs ring-1 ring-border' : 'text-muted-foreground hover:text-foreground')
  return (
    <nav aria-label={t('Reset by')} className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
      <Link to="/forgot-password" aria-current={phone ? undefined : 'page'} className={tab(!phone)}>
        {t('E-mail')}
      </Link>
      <Link to="/forgot-password?by=phone" aria-current={phone ? 'page' : undefined} className={tab(phone)}>
        {t('Phone')}
      </Link>
    </nav>
  )
}

function ByEmail() {
  const t = useT()
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
      <AuthPage title={t('Check your e-mail')} intro={t('If an account uses that address, we\'ve sent it a link to set a new password.')}>
        <p className="text-sm text-muted-foreground">
          The link works once and expires soon. Nothing arrived? Check spam, or{' '}
          <button type="button" onClick={() => forgot.reset()} className="font-medium text-primary underline-offset-4 hover:underline">
            try another address
          </button>
          .
        </p>
        <BackToSignIn />
      </AuthPage>
    )
  }

  return (
    <AuthPage title={t('Forgot your password?')} intro={t('Enter the e-mail you signed up with and we\'ll send you a link to set a new one.')}>
      <Method phone={false} />
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <TextField label={t('E-mail')} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
        <FormError message={forgot.isError ? errorMessage(forgot.error) : null} />
        <Button type="submit" loading={forgot.isPending} className="mt-1">
          {t('Send reset link')}
        </Button>
      </form>
      <BackToSignIn />
    </AuthPage>
  )
}

/** Two steps on one page: the number gets a code, then the code and a new password reset it. */
function ByPhone() {
  const t = useT()
  const navigate = useNavigate()
  const send = useForgotPasswordByPhone()
  const reset = useResetPasswordByPhone()
  const [countryCode, setCountryCode] = useState('+880')
  const [mobile, setMobile] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ mobile?: string; code?: string; password?: string; confirm?: string }>({})
  const phone = { countryCode: countryCode.trim(), mobileNumber: compactPhone(mobile) }

  function sendCode(event: FormEvent) {
    event.preventDefault()
    const problem = /^0?\d{6,14}$/.test(phone.mobileNumber) ? undefined : t('Enter the number without the country code.')
    setErrors({ mobile: problem })
    if (!problem) send.mutate(phone)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const found = {
      code: /^\d{6}$/.test(code) ? undefined : t('Enter the 6-digit code.'),
      password: passwordProblem(password) ?? undefined,
      confirm: confirm === password ? undefined : "The passwords don't match.",
    }
    setErrors(found)
    if (found.code || found.password || found.confirm) return
    reset.mutate({ ...phone, code, newPassword: password }, { onSuccess: () => navigate('/sign-in', { replace: true, state: { notice: PASSWORD_RESET_NOTICE } }) })
  }

  if (!send.isSuccess) {
    return (
      <AuthPage title={t('Forgot your password?')} intro={t('Enter the phone number you signed up with and we\'ll text you a code.')}>
        <Method phone />
        <form onSubmit={sendCode} noValidate className="flex flex-col gap-5">
          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <TextField label={t('Code')} autoComplete="tel-country-code" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} />
            <TextField
              label={t('Mobile number')}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="1712345678"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              error={errors.mobile}
            />
          </div>
          <FormError message={send.isError ? errorMessage(send.error) : null} />
          <Button type="submit" loading={send.isPending} className="mt-1">
            {t('Text me a code')}
          </Button>
        </form>
        <BackToSignIn />
      </AuthPage>
    )
  }

  return (
    <AuthPage title={t('Set a new password')} intro={t('If an account uses {phone}, we texted it a 6-digit code. It works for 10 minutes.', { phone: phone.countryCode + phone.mobileNumber.replace(/^0/, '') })}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <TextField
          label={t('SMS code')}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          error={errors.code}
          className="max-w-48"
        />
        <TextField
          label={t('New password')}
          type="password"
          autoComplete="new-password"
          hint="8 to 16 characters, with a capital letter, a number and a symbol."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <TextField label={t('Repeat new password')} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
        <FormError message={reset.isError ? errorMessage(reset.error) : null} />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={reset.isPending}>
            {t('Set new password')}
          </Button>
          <Button variant="quiet" onClick={() => send.reset()}>
            {t('Use another number')}
          </Button>
        </div>
      </form>
    </AuthPage>
  )
}

function BackToSignIn() {
  const t = useT()
  return (
    <Link to="/sign-in" className="mt-8 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
      {t('Back to sign in')}
    </Link>
  )
}
